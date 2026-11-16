# Draft feedback for firebase/firebase-js-sdk (not posted)

**Title:** On-device inference creates a new session for every call, which costs about 1.7 s per call; please allow session reuse

**Package:** `firebase` 13.3.0 (`@firebase/ai` 3.1.0), hybrid inference for Web
**Browser:** Chrome 157, Windows 11, on-device model on GPU

## What happens

With `mode: InferenceMode.ONLY_ON_DEVICE`, every `generateContent` and
`generateContentStream` call goes through `ChromeAdapterImpl.createSession()`,
which calls `LanguageModel.create(createOptions)` and destroys the previous
session. A new session costs about 1.7 s before the first output, whatever
the size of the input.

Measured with streamed calls through the SDK (medians of five, model warm):

| Call | Characters in | Characters out | Time to first output | Total |
|---|---|---|---|---|
| One word in, one character out, no system prompt | 2 | 1 | 1.9 s | 1.9 s |
| The same with a long system prompt | 2 | 1 | 1.8 s | 1.8 s |
| One page in, one character out | 1,177 | 1 | 1.8 s | 1.8 s |
| 4,000 characters in, one character out | 3,974 | 1 | 2.0 s | 2.0 s |

Measured with Chrome's API directly, to see where the time goes:

| Step | Time |
|---|---|
| `LanguageModel.create()` with a system prompt | 1.6 to 1.9 s |
| First `prompt()` on that session | about 125 ms |
| A second `prompt()` on the same session | about 75 ms |
| `session.clone()` | 0 ms |
| `prompt()` on the clone | about 70 ms |

So the cost belongs to the new session. A reused or cloned session answers in
about a tenth of a second. Chrome's own guidance is to create one base
session and clone it per task.

## Minimal reproduction (public SDK only)

```js
import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';

const ai = getAI(initializeApp(firebaseConfig), { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, {
  mode: InferenceMode.ONLY_ON_DEVICE,
  onDeviceParams: { promptOptions: { responseConstraint: /^[A-Z]$/ } },
});

await model.generateContent('Hi'); // loads the model
for (let i = 0; i < 5; i++) {
  const started = performance.now();
  await model.generateContent('Hi');
  console.log(Math.round(performance.now() - started), 'ms'); // about 1,700 to 1,900 each
}
```

## Request

An option on `onDeviceParams` to keep one base session per `GenerativeModel`
while `createOptions` are unchanged, and to serve each call from a clone of
it. Off by default if that is safer.

## What it would change for one app

Our app labels items in a document on the device before anything is sent to
the cloud. A one-page document takes about 3 s, of which about 1.8 s is this
fixed cost. A 20-page document needs several calls and takes 20 s or more.
We have not measured the app with session reuse, so we do not claim a figure
for it; the direct measurements above suggest most of the fixed cost would go.

## Two smaller findings

- **The request `signal` is ignored on device.** Passing `{ signal }` as the
  second argument of `generateContent` does not cancel an on-device call. The
  call can be cancelled by putting the signal on
  `onDeviceParams.promptOptions.signal` instead, because that object is passed
  through to `session.prompt()`.
- **`omitResponseConstraintInput` changes the result, not only the cost.**
  With a JSON schema as `responseConstraint`, setting it on `promptOptions`
  halved the length of the model's answer in our test (611 to 308
  characters): fewer items were returned. Worth a line in the documentation.
