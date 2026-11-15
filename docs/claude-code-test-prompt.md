# Prompt for Claude Code: test whether Airlock works

Run Claude Code **on the computer that has Chrome and the on-device model**,
from the repository root, after finishing `docs/setup.md`. Paste everything
below the line, or run:

```bash
claude "$(sed '1,/^---$/d' docs/claude-code-test-prompt.md)"
```

---

You are testing a proof of concept called Airlock. Read `CLAUDE.md`,
`README.md` and `docs/setup.md` before doing anything. The rules in
`CLAUDE.md` apply to everything below.

## The question

Airlock hides personal details in a document with an on-device model (Gemini
Nano in Chrome, called through Firebase AI Logic), sends only placeholders to
a cloud model, and restores the real values locally. None of that has been run
against a real model yet. Find out whether it works, with evidence:

1. Does the on-device model actually run through Firebase AI Logic in Chrome
   on this machine?
2. How much personal data does the scrub step hide, and how much useful
   content does it destroy?
3. Is it true at the network level that the raw document never leaves the
   machine and the cloud request contains only placeholders?
4. Can the scrub be made good enough with prompt and pipeline changes?

Work on your own. Stop and ask me only when you hit one of the stop
conditions at the end.

## Step 0: preflight

- Run `npm install`, `npm test`, `npm run build`. All must pass before you go on.
- Check `.env.local` exists and has `VITE_FIREBASE_CONFIG` (valid one-line
  JSON) and `VITE_APPCHECK_DEBUG_TOKEN`. Check presence only. Do not print
  the values.
- Record the OS, CPU, RAM, GPU, free disk space and the Chrome version.

## Step 1: get the on-device model running

Run `npm run eval` and read the first lines of output.

The scripts start Chrome with its own profile in `.chrome-profile/`, so my
normal Chrome profile is untouched. A fresh profile will not have the model
enabled. If the output says `LanguageModel is not defined` or
`availability() = unavailable`, work through these in order and re-run after
each:

1. Look at `chrome://version` and `chrome://on-device-internals` in the test
   profile (`KEEP_OPEN=1` keeps the window open) to see which flags are
   active, whether the machine qualifies and what state the model is in.
2. Try `CHROME_FEATURES="AIApiFoundationalModel:model_version/v4,OptimizationGuideManifestBroker"`.
   These feature names come from a third-party repository and are unverified:
   confirm in `chrome://version` that they took effect, and drop them if they
   do nothing.
3. Open `chrome://flags/#gemma4-for-built-in-ai` in the test profile and set
   it to Enabled, then relaunch. If you cannot drive that page, open it and
   ask me to click. That is one of the allowed stops.
4. Try another Chrome channel with `CHROME_PATH` (Beta, Dev or Canary) if the
   flag does not exist in the installed one.
5. Last resort: if I confirm the flag is on in my own Chrome, start
   `npm run dev` and drive `http://localhost:5173/eval.html` there through
   the Claude in Chrome extension instead of the script.

The first successful run downloads the model, which is several gigabytes.
Wait for it. `EVAL_TIMEOUT_MIN` raises the limit (default 45).

If Firebase rejects calls, read the browser console errors the script prints.
An App Check error usually means the debug token in `.env.local` is not the
one registered in the Firebase console.

If the on-device call fails only through Firebase AI Logic, you may check the
raw Prompt API (`LanguageModel`) from the DevTools console to tell an SDK
problem from a browser problem. Diagnosis only. Do not commit code that calls
it.

Do not go past this step until a run reports that the model ran on all 12
letters. A `NO-MODEL` verdict measures the regular expressions, not the
product.

## Step 2: measure

- Run `npm run eval` three times. The model is not deterministic, so report
  the mean and the range.
- Record for each run: subject-details recall, staff/third-party recall,
  recall by type, useful facts kept, model spans used against returned, and
  median time per letter.
- Baseline for comparison, measured without a model: fixed patterns alone
  hide 29.4% of subject details and 0% of names and addresses.
- Read the misses. Group them by cause, for example: names in capitals,
  first names used alone, non-English names, reference numbers, addresses
  with no street number, staff names in signatures.

## Step 3: check the privacy claim

Run `npm run e2e`. It makes one real cloud call. All nine checks should pass.
For any that fail, find out why before changing anything. Pay particular
attention to:

- **"Scrub works with the page offline"** and **"No request left the machine
  during the offline scrub"**. If Firebase AI Logic contacts any host during
  an on-device call (App Check, telemetry, anything), report exactly which
  host and what was in the request. That finding matters more than a pass.
- **"No hidden value appears in any cloud request body"**. Open the saved
  JSON in `eval-results/` and read the outgoing request body yourself. Confirm
  it holds placeholders and that the response reports `in_cloud`.

Then turn the machine's network off entirely (or ask me to) and confirm the
scrub still runs in the app. Turn it back on afterwards.

## Step 4: improve it, carefully

Thresholds, which are a starting judgement and not a standard: **pass** is
subject-details recall of 95% or more with 90% or more of useful facts kept;
**marginal** is 85% and 80%; anything lower is a **fail**.

If the result is not a pass, try to fix it. One change at a time, re-run the
benchmark three times after each, keep the change only if subject recall
improves and useful facts kept stays at or above 90%. Ideas, roughly in order
of cost:

- Rewrite `SCRUB_SYSTEM` in `src/models.ts`. Be specific about what was
  missed. Add two or three short fictional examples.
- A second on-device pass over the same text asking only for what the first
  pass missed.
- Split the work: one on-device call for people, one for addresses and
  reference numbers.
- Smaller chunks in `chunkText`.
- More patterns in `src/airlock.ts` for things a regex catches reliably, such
  as labelled reference numbers ("Our ref:", "Policy number:").

Do not overfit. Never put a name, address or number from the fixtures into a
prompt or a pattern. When you have a version you believe in, add at least
eight new fictional letters to `src/eval/fixtures.ts` in formats the existing
set lacks (an email thread, a payslip, a tenancy agreement extract, a letter
from outside the UK, a very short note, a two-page letter) and report recall
on those separately. That hold-out number is the honest one.

Stop after three rounds of changes or two hours, whichever comes first.

## Step 5 (only if time allows): the photo path

Render two fixture letters to PNG (a screenshot of a plain HTML page is
fine), feed each to "Read a photo" in the app, and compare the transcription
with the original text. Report the character error rate roughly and whether
names and numbers survived.

## Step 6: report

Write `docs/benchmark.md` with:

- **Verdict in the first line**: works, works with the changes made, or does
  not work as designed.
- Environment: OS, hardware, Chrome version and channel, how the model was
  enabled, model details from `chrome://on-device-internals`, Firebase JS SDK
  version, cloud model name.
- A results table: baseline, first measurement, after each kept change, and
  the hold-out set. Means and ranges.
- The misses that remain, grouped by cause, with examples.
- The nine network checks and anything unexpected in the request log.
- What you changed and why, and what you tried that did not help.
- What is still untested.
- A recommendation: build on this, change the design, or drop it. If the
  model cannot reach the pass threshold, say so plainly and say what the
  product would have to become (for example: patterns plus mandatory human
  review, with the model only as a hint).

Commit your work on a branch named `test/first-run` with clear messages.
Do not commit `eval-results/` or `.chrome-profile/`. Do not push to `main`,
change the repository's visibility or deploy anything.

## Stop and ask me when

- A step needs the Firebase console, a Chrome flag you cannot set, or the
  machine's network switched off.
- Anything asks for billing, payment or a new account.
- The machine does not meet Chrome's requirements for the on-device model.
- You have tried three different fixes for the same blocker and it still fails.
- You are about to do something `CLAUDE.md` forbids because it looks like the
  only way forward.

When you stop, say what you tried, what happened and the one thing you need.
