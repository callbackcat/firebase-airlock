# Airlock

On-device redaction in front of a cloud model, built on Firebase AI Logic
hybrid inference for Web (Chrome). An entry for the #BuildHybridAI 2026
hackathon. Read `README.md` first, then `docs/final-results.md`.

## Rules that do not bend

1. **Every model call goes through Firebase AI Logic** (`firebase/ai`). No
   OpenRouter, no other provider SDK, no direct Gemini API call, no raw
   `LanguageModel` call in committed code. This is a hackathon rule.
2. **The scrub model stays `ONLY_ON_DEVICE`.** Never change it to a mode that
   can fall back to the cloud, and never send unredacted text to the cloud
   model, not even "for testing".
3. **Never commit secrets.** `.env.local`, App Check debug tokens, service
   account keys. Do not print them in logs or reports either. `eval-results/`
   is git-ignored because it can hold request bodies.
4. **Only fictional data in the repository.** Every letter, name and number in
   fixtures and samples is made up. Do not add real documents or real people.
   One exception, for measurement only: a real public dataset may be used
   locally, in a git-ignored folder, with the on-device scrub only. No cloud
   call is made on it at all, and no output that contains its names is
   written to the repository.
5. **Say what was not tested.** Reports state what ran, on what, and what did
   not run.

## Commands

```bash
npm install
npm test            # unit tests (core + benchmark scoring)
npm run typecheck
npm run build
npm run lint        # Glaze design-system lint on src
npm run dev         # app at /, benchmark at /eval.html
npm run eval        # benchmark in a real Chrome; exit 0 pass, 1 marginal/fail, 2 model did not run, 3 harness error
npm run e2e         # one full run with network-level checks
```

Script options are at the top of `scripts/chrome.mjs` (`CHROME_PATH`,
`CHROME_PROFILE`, `CHROME_FEATURES`, `CHROME_EXTRA_ARGS`, `KEEP_OPEN`,
`EVAL_TIMEOUT_MIN`).

## Layout

- `src/airlock.ts` core: detect, redact, rehydrate, leak check. No Firebase or
  DOM imports. Keep it that way.
- `src/models.ts` the only place models are created and called.
- `src/firebase.ts` app, App Check, AI Logic init from `.env.local`.
- `src/app/`, `index.html` the app, in React on the Glaze design system.
- `src/components/glaze/`, `src/lib/glaze/` Glaze, copied in. Do not edit.
- `src/eval/` labelled letters, scoring, benchmark page. `eval.html`.
- `scripts/` Chrome launcher and the two test runners.
- `test/` unit tests.

## Conventions

- TypeScript strict. React and Glaze in `src/app/` only; the core stays plain
  TypeScript. No new runtime dependencies without a reason.
- Build DOM with `textContent`, never `innerHTML` with document text.
- UK English in user-facing copy. Plain words.
- A change to the scrub prompt or patterns is only kept if `npm run eval`
  improves and the useful-facts-kept rate stays at or above 90%.
