# Airlock round 2: results so far

> **Superseded in part.** Round 3 changed the design and has newer numbers: see `results-round-3.md`.

Hand-over for a planning session. Written 15 November 2026. Self-contained,
but `speed-brief.md`, `speed-results.md`, `research-notes.md`,
`eval-plan.md` and `outside-data.md` in this folder give the background.

**Round 2 is not finished.** The round was stopped part-way at the owner's
request. The final sets have not been measured, so nothing here is a final
result. Most numbers below come from a single run and are marked as such.

Same machine throughout: 8-core Ryzen, GPU with about 8 GB VRAM, Windows 11,
Chrome 157, Firebase JS SDK 13.3.0. Branch `round-2`, not pushed.

## Headline

1. **On text we did not write, the current scrub hides 88.7% of direct
   identifiers** (181 of 204, one run, 50 synthetic documents from
   Nemotron-PII; Wilson 95% interval 83.7% to 92.4%). On our own 60
   development letters it hides 96.9% of the subject's details (347 of 358;
   interval 94.6% to 98.3%). The gap is about 8 points.
2. **The gap is almost entirely technical identifiers our letters never
   contain**: MAC addresses, cookies, API keys, IP addresses. People's names
   were 47 of 47.
3. **Hide first works as a design but does not hide more.** With the model as
   an un-hider the text is safe to send after about 6 ms instead of about
   3 s, and accuracy is level with today's scrub (one run). It hides no more
   because both designs are limited by the same thing: what the marker never
   underlines.
4. **Our own-letter claim was weaker than reported.** On all 60 development
   letters together the lower end of the interval is 94.6%, under the 95%
   mark. Earlier rounds reported 97 to 99% on sets of 46 to 53 details.

## Part 1: accuracy measured properly

### What was built

| Item | State |
|---|---|
| `outside-dev` (50) and `outside-final` (100) from Nemotron-PII | Built. Synthetic, CC BY 4.0 (verified on the dataset card), revision `b70ffaf`. Downloaded into git-ignored `outside-data/`; nothing committed. 204 and 342 direct identifiers. |
| RedactionBench | **Skipped by decision.** Released under CC BY 4.0, but about half is real documents from the public web and its card says the original licences are uncertain. That conflicts with the fictional-only rule. |
| `final-set` | Built, **not measured**. 46 documents, 481 subject details, 181 other people's details, 409 useful facts, 117 medical terms (60 high severity), 192 quasi-identifiers. Written by a separate agent that did not open the pattern, marker or model code. |
| Stress sets | Built, **not measured**. Ambiguous names (40), medical-heavy with eponyms that must stay (10), a base set of 10 in normal, lower-case and upper-case, the same 10 with an instruction-like line inserted, messy layout (10). |
| `holdout6` (8 letters) | Built for the first round 2 brief. Now inside `dev-all`. |
| `long-dev`, `long-clean` (5, 10, 20 pages each) | Built from entity sheets. `long-dev` measured (part 4). `long-clean` not measured. |
| Metrics | All of 1.4 are in `scripts/summarise-runs.mjs`: precision, Wilson and bootstrap intervals, run-to-run consistency, time to safe and time to model done, underlines per page, clicks to fix, quasi-identifiers left readable, medical terms by severity. |
| `docs/eval-plan.md` | Written before any hide-first measurement. Thresholds and stopping rule as proposed in the brief. |

Entity-level scoring: confirmed. Each label is the shortest string that must
not be readable, checked against the whole outgoing text ignoring case and
line breaks, so one surviving mention is a miss.

### Baseline (today's scrub, `one-combined`)

| Set | Runs | Direct or subject details hidden | Other people's | Precision | Useful facts kept | Medical kept | Time |
|---|---|---|---|---|---|---|---|
| `outside-dev` (50 docs) | 1 | 88.7% (n=204; 83.7 to 92.4) | not labelled | 76.5% (88.4% counting quasi-identifiers as right) | not labelled | not labelled | 2.6 s median |
| `dev-all` (60 letters) | 1 | 96.9% (n=358; 94.6 to 98.3) | 95.5% (n=154) | 79.0% | 98.8% (n=343) | 98.4% (n=64) | 3.1 s median |
| `holdout5` (8 letters) | 3 | 98.7% (98.1 to 100) | 90.5% | not computed | 96.2% | not computed | 2.9 to 3.8 s |

On `outside-dev`, by the dataset's own labels (hidden of total):

- All hidden: first names 24/24, surnames 23/23, emails 23/23, account
  numbers 10/10, user names 10/10, customer ids 9/9, dates of birth 9/9,
  health plan numbers 7/7, PINs 7/7, social security numbers 6/6, street
  addresses 5/5, cards 5/5.
- Mostly hidden: phone numbers 12/13, postcodes 3/4, licence plates 2/3.
- **Mostly missed: MAC addresses 0/4, HTTP cookies 0/4, API keys 1/5, IPv4
  addresses 1/5**, card security code 0/1, IPv6 2/3, passwords 1/2.
- 16 of the 23 misses were not underlined, so a reviewer could not fix them
  with a click.

**Checkpoint:** the brief said to stop if `outside-dev` was under 70%. It is
88.7%, so the work went on.

Limits of this outside test: the data is synthetic, the documents are short
(median about 620 characters), there is no "who is this about" label and no
useful-facts label, so over-hiding cannot be measured on it. It is not the
same test as the real-document benchmarks in `research-notes.md`, where small
models score 45 to 63%.

**Not done in part 1:** the baseline on the stress sets; three runs (only one
was taken) on `outside-dev` and `dev-all`.

## Part 2: hide by default

All arms are implemented (`src/hidefirst.ts`, `Models.unhide`, `VITE_ARM=a0`
to `a4`). **One run each**, so differences of a point are noise.

| Arm | Set | Hidden | Other people's | Precision | Useful facts kept | Medical kept | Safe after | Model done |
|---|---|---|---|---|---|---|---|---|
| A0 today | `dev-all` | 96.9% | 95.5% | 79.0% | 98.8% | 98.4% | 3.1 s | 3.1 s |
| A1 hide everything marked, no model | `dev-all` | 97.2% | 95.5% | 54.3% | 80.5% | 67.2% | 4 ms | no model |
| A2 A1 + safe rules in code | `dev-all` | 96.9% | 95.5% | 60.5% | 88.3% | 76.6% | 5 ms | no model |
| A3 A2 + model un-hides | `dev-all` | 96.6% | 96.1% | 79.0% | 98.8% | 96.9% | 6 ms | 3.6 s |
| A0 today | `outside-dev` | 88.7% | | 76.5% | | | 2.6 s | 2.6 s |
| A2 | `outside-dev` | 87.3% | | 56.6% | | | 1 ms | no model |
| A3 | `outside-dev` | 90.2% | | 78.4% | | | 2 ms | 3.1 s |

What this shows:

- **Hiding everything marked does not raise recall.** A1 hides 97.2% against
  96.9% for A0. The details that leak are the ones the marker never
  underlines (17 of them on `dev-all`), and hide-first cannot reach those
  either. The research finding that hide-by-default gives the highest recall
  depends on a marker that marks almost everything; ours does not yet.
- **What hide-first buys is time and failure direction.** The text is safe in
  milliseconds, sending no longer has to wait for the model, and a model
  failure leaves items hidden instead of leaking them.
- **Without the model, hide-first is too blunt to use alone**: 80 to 88% of
  useful facts and 67 to 77% of medical terms survive.
- **With the model as un-hider (A3) the losses come back**: 98.8% of useful
  facts, 96.9% of medical terms, precision level with A0.
- **A3 slightly lowered hidden on `dev-all`** (96.9% to 96.6%): the model
  wrongly restored one item. One run, so not established.
- The safe rules in code (organisation words, a word also written in lower
  case, a word followed by a dose) lift useful facts from 80.5% to 88.3% and
  cost 0.3 points of hidden.

**Against the decision rule** (hides at least as much as A0, safe in under
100 ms, useful facts within two points of A0): A3 meets the time and
useful-facts conditions on this one run and is level on hidden within noise.
**The decision has not been made**; it needs three runs per arm.

**Not done in part 2:** three runs per arm; A4 (two votes); the stress sets,
including the instruction-injection test of the un-hider's two safety rules;
widening the marker (name lists, lower-case words, non-UK postcodes, context
words). The switches for several of these exist and are off (`src/flags.ts`:
`o1` role words, `o2` hyphen halves, `w1` chat speakers, `w2` non-UK
postcodes, `m1` medical label, `m2` dose and lower-case rule, `adj`, `o3`,
`o4`, `csv`, `yesno`). None has been measured with the model. A helper was
still building openly licensed name and common-word lists when this was
written; if `src/data/` and `docs/wordlists.md` exist, check that work before
using it.

The one thing that would raise recall is the marker. The outside data says
where: technical identifiers (IP and MAC addresses, keys, cookies, tokens),
which are pattern work, not model work.

## Part 3: is the answer still good?

**Not run.** The harness is written and type-checks: `answers.html`,
`src/eval/answers.ts`, `scripts/run-answers.mjs`, with three modes (answer
quality for raw, A0, hide-first before and after restores; current against
stricter cloud instruction; what the cloud model can still guess). The rubric
is in `src/eval/answer-facts.ts`: 20 letters, 116 required facts, 40 claims an
answer must not make, one judge sentence per letter. It has not been tried
against real answers, so its false-positive rate is unknown. A tolerant
placeholder parser (`restore()` in `src/airlock.ts`) counts exact, altered,
invented and unused placeholders; it is not yet used by the app itself.

To run (about 380 cloud calls in all, spaced and capped):

```bash
node scripts/run-answers.mjs                        # quality, about 320 calls
ANSWERS_MODE=system node scripts/run-answers.mjs    # 80 calls
ANSWERS_MODE=infer  node scripts/run-answers.mjs    # 40 calls
```

## Part 4: long documents

Measured with today's scrub (A0), before hide-first existed. Three runs each
on `long-dev`. The 5-page times include the model's cold start.

| Design | Subject hidden | Other people's | Useful facts kept | Calls | 5 pages | 10 pages | 20 pages |
|---|---|---|---|---|---|---|---|
| Today: 4,000-character pieces | 100% | 97.9% | 92.3% | 34 | 24 to 30 s | 33 to 39 s | 74 to 84 s |
| 16,000-character pieces | 95.6 to 98.2% | 77 to 84% | 90 to 91% | 7 to 11 | 17 to 73 s | 15 to 51 s | 29 to 69 s |
| Whole document, 20 items a call | 100% | 86.5% | 93.6% | 11 to 17 | 15 to 18 s | 15 to 18 s | 27 to 58 s |
| Whole document, 40 items a call | 100% | 69.8% | 96.2% | 14 | 17 to 21 s | 15 to 16 s | 24 to 27 s |
| Whole document, 80 items a call | 100% | 81.3% | 97.4% | 14 | 18 to 22 s | 13 to 17 s | 22 to 31 s |
| Whole document, labels only, no "missed" pass | 100% | 79.2% | 97.4% | 3 | 12 to 14 s | 4.7 s | 4.8 to 6.0 s |

- Large pieces were the worst: calls overran or were cancelled.
- Whole-document labelling is about three times faster at 20 pages but loses
  other people's names: an item labelled wrongly once is wrong everywhere.
- Nearly all the remaining time is the "missed" pass; labelling alone takes
  about 5 s for 20 pages.
- No design met 20 s for 20 pages. With hide-first this target changes
  meaning, because the text is safe at once and the model only restores.
- Not done: the list of items whose label differed between two contexts (the
  diagnostic plan `doc-contexts` exists and was not run); `long-clean`.

## Part 5: speed unknowns

| Measurement | Result |
|---|---|
| Paste the instant the page loads | 14.6 s to scrub done (14.0 to 15.9, three runs) |
| Paste 20 s after the page was touched | 3.2 s (2.7 to 3.6): the warm-up saves about 11 s |
| Largest input one call accepts | 24,000 characters works (4.1 s to first output); 32,000 is refused with "The input is too large" |
| Reading cost at scale | 4,000 characters 1.8 s, 8,000 2.1 s, 16,000 2.9 s, 24,000 4.1 s to first output |
| Twelve labels, by format | JSON with numbered keys 3.2 s; JSON array 2.9 s; comma-separated words 2.3 s; shorter words 2.4 s |
| Forced CPU, one-page letters, today's scrub | about 14 s a letter (13.9 to 15.1, three runs of the tuning set); accuracy unchanged |

**Not done:** first-call time after 1, 5 and 15 minutes idle (started, then
stopped to free the browser); CPU timing for hide-first;
`docs/firebase-sdk-feedback.md`.

Written but not measured in a browser: results shown as they arrive; a review
mode for slow machines, chosen from the warm-up call's duration.

## Part 6: research

Not started (session reuse, an entity model for reference, Chrome's Decisions
API).

## Part 7: final measurement

Not done. `final-set`, `outside-final` and `long-clean` are untouched.
`docs/related-work.md` is not written.

## What went wrong along the way

- **Helper file saves reloaded the benchmark page mid-run** and produced
  invalid results. Fixed by turning off hot reload in the benchmark server.
  The invalid runs were discarded.
- **One outside-text run hung for over 20 minutes** in the background and
  finished normally when run again. Cause not found.
- **The first hand-written second working copy is still on disk** at
  `../firebase-airlock-wt` (branch `wt/round-2`, same commits as `round-2`).
  It can be removed with `git worktree remove ../firebase-airlock-wt`.

## Sample sizes and what they support

- `outside-dev`: 204 details, one run. Supports "roughly 84 to 92%", and the
  breakdown by label, where the larger groups are solid and the groups of 3
  to 5 are indicative only.
- `dev-all`: 358 subject details, one run. Supports "about 95 to 98% on our
  own development letters". These letters have informed changes, so the true
  figure on new letters of the same kind is probably a little lower.
- Hide-first arms: one run each. Supports the large effects (time to safe;
  A1 and A2 losing useful facts; A3 recovering them). Does not support any
  claim about a one-point difference in hidden.
- Nothing here supports a claim about real documents.

## Questions for the next session

1. Is the outside gap worth closing with patterns for technical identifiers
   (IP, MAC, keys, cookies, tokens), given that the product is aimed at
   letters, not logs? It would move the outside number most.
2. Hide-first does not raise recall with the current marker. Is "safe in
   milliseconds and fails closed" enough reason to adopt it, or should the
   marker be widened first (name lists, lower case) and the comparison
   repeated?
3. With hide-first the reviewer sees fewer underlines (most marked items are
   hidden), but 12 to 17 leaks per 60 letters are not underlined at all.
   What should the review step show instead?
4. Which is the honest headline for the submission: 88.7% on outside
   synthetic text, about 97% on our own letters, or both with the gap named?
5. Part 3 is ready to run. Is 380 cloud calls on the project's quota
   acceptable, and should the "what can still be guessed" test stay in?
6. The thresholds in `eval-plan.md` ask for a lower interval end of 95% on
   `final-set` (481 details). The development result suggests that will be
   missed. Keep the threshold and report the miss, or change it now with a
   written reason, before the set is measured?

## How to continue

```bash
git checkout round-2
python scripts/fetch-outside.py                 # only if outside-data/ is missing
RUNS=3 EVAL_SET=dev-all bash scripts/eval-many.sh              # baseline, three runs
VITE_ARM=a3 RUNS=3 EVAL_SET=dev-all bash scripts/eval-many.sh  # hide first + un-hide
RUNS=3 EVAL_SET=stress-ambiguous bash scripts/eval-many.sh     # also stress-medical, stress-base,
                                                               # stress-lower, stress-upper,
                                                               # stress-instructions, stress-messy
SUMMARY_ARGS=--quiet RUNS=5 EVAL_SET=final-set bash scripts/eval-many.sh   # once, at the end
```

`SUMMARY_ARGS=--quiet` leaves out the miss lists, so a final set can be scored
without anyone reading its misses.
