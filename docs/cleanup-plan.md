# Clean-up plan for the public release

Written 16 November 2026, before any of it was carried out. Each line says
what happens to a file or group and why. Nothing here changes the scrub.
Untracked local data is never touched: `.env.local`, `outside-data/`,
`eval-results/`, `.chrome-profile*`.

## Documents

| Item | Action | Reason |
|---|---|---|
| `docs/final-results.md` | keep | The one summary of what was measured |
| `docs/eval-plan.md` | keep | Thresholds and every change to the plan |
| `docs/outside-data.md` | keep, add the court-judgment dataset | The datasets used, with licences |
| `docs/wordlists.md` | keep | Sources and licences of the three word lists |
| `docs/related-work.md` | keep | Earlier systems and what this one adds |
| `docs/firebase-sdk-feedback.md` | keep | Draft note for the SDK maintainers, not posted |
| `docs/setup.md` | keep, update for the new app page | How to run it |
| `docs/screenshots/` | keep | Every state of the screen, for review |
| `docs/cleanup-plan.md` | keep | This file |
| `docs/benchmark.md`, `speed-brief.md`, `speed-results.md`, `results-round-2.md`, `results-round-3.md`, `results-round-3-addendum.md`, `results-round-3-medical.md`, `round-3-table.md` | move to `docs/archive/` | Round-by-round logs. Kept for the record, out of the way |
| `docs/research-notes.md` | move to `docs/archive/` | Working notes; `related-work.md` is the checked version |
| `docs/claude-code-test-prompt.md`, `round-2-prompt.md`, `hackathon-checklist.md` | move to `docs/archive/` | Earlier prompts and a working checklist |

Links between documents are updated after the move.

## Top level

| Item | Action | Reason |
|---|---|---|
| `README.md` | rewrite | What it is, a screenshot, how it works, results with limits, how to run, licence, credits |
| `LICENSE` | replace MIT with Apache-2.0 | The owner's brief says the public release is Apache-2.0 |
| `NOTICE` | add | Attribution for the word lists, Glaze, and the outside datasets |
| `CLAUDE.md` | keep, update the layout section | It names files that have moved |
| `.gitignore` | add `.ui-review/`, `.design-system/` | Scratch folders the design skills write |
| `components.json`, `glaze.eslint.config.mjs`, `vite.config.ts` | keep | Needed by the app page and its lint |
| `skills-lock.json` | delete | Records the agent skills removed below |

## Agent skills

| Item | Action | Reason |
|---|---|---|
| `.claude/skills/glaze/` | keep | The Glaze rules, so later UI changes follow them |
| `.agents/` (nine skills) | delete from the repo | A second copy of the same skills |
| `.claude/skills/` other than `glaze` (eight skills) | delete from the repo | Tools for building design systems, fonts and motion. Not part of this project; anyone can install them again |

## Source

| Item | Action | Reason |
|---|---|---|
| `src/airlock.ts`, `suspects.ts`, `hidefirst.ts`, `wordlists.ts`, `flags.ts`, `models.ts`, `firebase.ts`, `sample.ts`, `src/data/` | keep, untouched | The scrub. Frozen |
| `src/app/` | keep | The app page, React on Glaze |
| `src/components/glaze/`, `src/lib/glaze/` | keep | Glaze, copied in under its MIT licence |
| `src/main.ts` | already deleted | The old app page, replaced by `src/app/` |
| `src/eval/`, `eval.html`, `answers.html`, `probe.html` | keep, untouched | Benchmark tools |
| Experiment switches that are off, and the older call plans in `src/models.ts` | **leave** | Removing them means editing the frozen scrub files. They cost nothing at run time and each is described in `src/flags.ts` |

## Scripts

| Item | Action | Reason |
|---|---|---|
| `run-eval.mjs`, `run-e2e.mjs`, `run-answers.mjs`, `run-probe.mjs`, `chrome.mjs`, `eval-arms.sh`, `summarise-runs.mjs`, `summarise-tab.mjs`, `trace-medical.mjs`, `hidefirst-only.mjs`, `patterns-only.mjs` | keep | Benchmark and test runners in use |
| `run-screenshots.mjs`, `run-paint.mjs` | keep | New: screenshots of every state; paste-to-painted time |
| `fetch-outside.py`, `fetch-tab.py`, `build-wordlists.py`, `build-medical.py` | keep | Rebuild the datasets and the word lists |
| `run-paste.mjs` | delete | Written for the old page's element ids; `run-paint.mjs` and the end-to-end check cover it |
| `eval-many.sh` | delete | Replaced by `eval-arms.sh` |

## Dependencies

| Item | Action | Reason |
|---|---|---|
| `react`, `react-dom`, `@base-ui/react`, `@phosphor-icons/react`, `class-variance-authority`, `clsx`, `tailwind-merge` | keep | Used by the app page and Glaze |
| `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` | keep | Build |
| `eslint`, `@typescript-eslint/parser` | keep | The Glaze lint |
| `typescript` 7 to 6 | already changed | The lint's parser does not support TypeScript 7 |
| `lucide-react`, `shadcn`, `tw-animate-css`, `cn`, `@tailwindcss/postcss`, `@fontsource-variable/geist` | already removed | Added by the shadcn set-up and not used. Fonts are the system's own |

## Checks

- Secrets: the working tree and the full git history are scanned for `.env`
  files, App Check debug tokens, service account keys and API keys. Findings
  are reported by file and count, never by value. History is not rewritten.
- Real names: no committed file may hold text, a name or a case number from
  the court-judgment dataset.
- After every group: unit tests, type-check, build and lint. At the end: the
  end-to-end check and a benchmark run compared with the baseline taken
  before any of this work.
