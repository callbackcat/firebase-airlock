<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <img src="assets/logo-light.svg" alt="Airlock logo" width="120">
  </picture>
</p>

<h1 align="center">Airlock</h1>

<p align="center"><strong>See exactly what the cloud sees.</strong></p>

Airlock sits between a private document and a cloud model. An on-device model
finds the personal details, Airlock swaps them for placeholders, you approve
what leaves, the cloud model does the thinking, and the real values are put
back on your device.

Built on [Firebase AI Logic](https://firebase.google.com/docs/ai-logic/hybrid)
hybrid inference for Web (Chrome).

> Status: proof of concept. See [What is and is not tested](#what-is-and-is-not-tested).

## Why hybrid, and why both halves are needed

| Step | Runs | Firebase AI Logic mode | Why there |
|---|---|---|---|
| Read a photographed letter | On device | `ONLY_ON_DEVICE` | The raw image is the most sensitive input. |
| Find personal details | On device | `ONLY_ON_DEVICE` | Needs to read the raw text. Must never fall back to cloud. |
| Explain, list actions, draft a reply | Cloud | `ONLY_IN_CLOUD` | Needs a stronger model. Only ever sees placeholders. |
| Put real values back | On device | no model call | A string replace against a vault kept in memory. |

The scrub step is pinned to the device on purpose. With `PREFER_ON_DEVICE`, a
browser without the local model would silently send the raw document to the
cloud, which is the one thing this app exists to prevent. When the local model
is missing, Airlock drops to fixed patterns, says so, and makes you confirm
before anything is sent.

## How it works

```
paste ─▶ pattern pass ─▶ on-device model ─▶ placeholders ─▶ you approve
                                                               │
         restored answer ◀─ rehydrate ◀─ cloud model ◀─────────┘
```

1. **Pattern pass** (`detectWithRegex`): emails, phone numbers, postcodes,
   bank details, card numbers (Luhn-checked), ID numbers, dates of birth.
2. **Model pass** (`detect` + an `Extractor`): names, addresses and anything
   else that needs reading. Structured JSON output. Spans the model invented
   are dropped, because a value that is not in the text redacts nothing.
3. **Redact** (`redact`): one stable placeholder per value, applied to every
   occurrence. If the model spots a name in one chunk, it is removed everywhere.
4. **Approve**: the middle panel is the exact outgoing text. Untick what you
   are happy to send, or hide more by hand.
5. **Leak check** (`findLeaks`): refuses to send if any vaulted value is still
   readable in the outgoing text.
6. **Cloud call**, then **rehydrate** (`rehydrate`) locally.

## Use the core in your own app

`src/airlock.ts` has no Firebase or DOM imports. Wrap any model call:

```ts
import { detect, redact, rehydrate, findLeaks } from './airlock';

const found = await detect(text, extractOnDevice);   // your on-device extractor
const { redacted, vault } = redact(text, found.entities);
if (findLeaks(redacted, vault).length) throw new Error('leak');
const answer = await cloudModel.generateContent(redacted);
const restored = rehydrate(answer.response.text(), vault);
```

## Run it

```bash
npm install
cp .env.example .env.local     # paste your Firebase web config
npm run dev
```

1. Create a Firebase project and enable **AI Logic** with the Gemini Developer API.
2. Register a web app and paste its config into `.env.local`.
3. App Check is required by AI Logic. In dev, open the browser console, copy
   the debug token it prints, and register it under App Check > Manage debug tokens.
4. Use desktop Chrome with the built-in model enabled. The hackathon FAQ says to
   turn on **Gemma 4 for Built-in AI** in `chrome://flags`; check the
   [hybrid web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)
   for the current flags and Chrome version.

Without a Firebase config the page still loads: pattern-only scrubbing works
and the cloud step is switched off.

```bash
npm test          # unit tests for the core
npm run build     # typecheck + production build
```

## What is and is not tested

Tested:

- Core logic: 11 unit tests, including the full pipeline on the sample letter
  with a stand-in extractor.
- Types: compiles against `firebase@13.3.0` (`InferenceMode`, `InferenceSource`,
  `onDeviceParams.promptOptions.responseConstraint`, `inCloudParams`).
- UI: both paths driven in headless Chrome. Pattern-only with no Firebase
  config, and the full three-step flow with the model module stubbed.

Not tested yet:

- Any real call to Gemini Nano or to the cloud through Firebase AI Logic.
- How well the on-device model actually finds names and addresses. This is the
  number that decides whether the product works. Measure recall on 20 to 30
  varied letters before building further.
- Reading a photographed letter on device.

## Limits, stated plainly

- **This reduces what you share. It does not make you anonymous.** What is left
  (a clinic name, a date, a town) can still narrow down who you are.
- A small model will miss things. The pattern layer, the approval step and the
  leak check exist because of that.
- The pattern layer is UK-shaped. Other locales need their own patterns.
- Rehydration restores the first-seen spelling of a value.
- The vault lives in memory only and is gone on reload.

## Next

- Recall benchmark for the scrub step, per entity type.
- Chrome extension side panel ("send this page through Airlock").
- Google Search grounding on the cloud step, so explanations cite real rules.
- A `PREFER_ON_DEVICE` document-type classifier to pick the right prompt.
- Remote Config for the cloud model name and prompts.

## Licence

[MIT](LICENSE). The sample letter is fictional.
