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

> Status: proof of concept. It runs end to end on a real on-device model. On
> unseen letters it hides about 97% of personal details and underlines most of
> what it missed, so the approval step still matters. See
> [What is and is not tested](#what-is-and-is-not-tested).

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

All model calls go through Firebase AI Logic. There is no other AI provider in
this project.

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
cp env.example .env.local      # then fill it in; see docs/setup.md
npm run dev
```

`docs/setup.md` lists everything you need: a free Firebase project, an App
Check debug token and a Chrome with the on-device model. Without a Firebase
config the page still loads: pattern-only scrubbing works and the cloud step
is switched off.

## Test it

```bash
npm test          # unit tests for the core and the benchmark scoring
npm run build     # typecheck + production build
npm run eval      # benchmark the scrub step in a real Chrome
npm run e2e       # one full run, checked at the network level
```

**`npm run eval`** opens `eval.html` in Chrome, runs 12 labelled fictional
letters (85 labelled details) through the same scrub code the app uses, and
reports what was still readable afterwards: by type, patterns alone against
patterns plus the model, plus how many useful facts were hidden by mistake.

**`npm run e2e`** drives the app once and checks nine things, including that
the scrub works with the page offline, that no request leaves the machine
while scrubbing, and that no hidden value appears in the body of the request
that goes to the cloud.

Both scripts start Chrome as a plain process with its own profile in
`.chrome-profile/` and attach over the DevTools protocol. Options are
documented at the top of `scripts/chrome.mjs`.

`docs/claude-code-test-prompt.md` is a prompt that hands this whole test to
Claude Code.

## What is and is not tested

Tested (details in [docs/benchmark.md](docs/benchmark.md)):

- Core logic, patterns, review marks and benchmark scoring: 75 unit tests.
- The on-device model through Firebase AI Logic, on Chrome 157 on Windows 11:
  the scrub ran on device, including with the page offline.
- Scrub accuracy on 8 letters that were never used for tuning, five runs: it
  hides 97.4% of the subject's details (95.7% to 97.8%) and keeps every useful
  fact. With no model, patterns alone hide 52% and underline nearly all the
  rest for the reader.
- Speed: patterns appear in a few milliseconds; the on-device model takes
  about 5.5 seconds a letter on a GPU and about 22 seconds on CPU.
- Reliability: no failed or stalled on-device call in the last 40 benchmark
  runs.
- One full run checked at the network level: nine checks passed, no request
  left the machine during the scrub, and the cloud request held no personal
  detail.

Not tested yet:

- The scrub with the machine's network switched off entirely.
- Reading a photographed letter on device.
- Other machines, Chrome channels and languages.
- App Check with a real provider on a hosted build.

## Limits, stated plainly

- **This reduces what you share. It does not make you anonymous.** What is left
  (a clinic name, a date, a town) can still narrow down who you are.
- A small model will miss things. The pattern layer, the approval step and the
  leak check exist because of that.
- The pattern layer is UK-shaped. Other locales need their own patterns.
- Rehydration restores the first-seen spelling of a value.
- The vault lives in memory only and is gone on reload.

## Next

- Measure the scrub step and tune it (`docs/claude-code-test-prompt.md`).
- Chrome extension side panel ("send this page through Airlock").
- Google Search grounding on the cloud step, so explanations cite real rules.
- A `PREFER_ON_DEVICE` document-type classifier to pick the right prompt.
- Remote Config for the cloud model name and prompts.
- Hosted build with a production App Check provider.

## Licence

[MIT](LICENSE). Every letter in this repository is fictional.
