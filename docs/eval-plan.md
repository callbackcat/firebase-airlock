# Evaluation plan for round 2

Written on 15 November 2026, before any round 2 design change was measured on
a final set. It fixes what is measured, on what, against which thresholds,
and when the work stops. A threshold changes only with a reason added to the
"Changes" section at the end.

## Sets

| Set | Use | What it is |
|---|---|---|
| tuning, `holdout`, `holdout2` to `holdout5` | development | 52 fictional letters from earlier rounds. Their misses have informed changes. |
| `holdout6` | development | 8 letters written for the first, speed-only round 2 brief. Never measured before this round. |
| `stress-*` | development | Ambiguous names (40), casing (10 letters in three casings), instruction-like text (10), medical-heavy (10), messy layout (10). |
| `long-dev` | development | 5, 10 and 20 pages, built from entity sheets. |
| `outside-dev` | development | 50 documents from Nemotron-PII (synthetic, not written by us). See `outside-data.md`. |
| **`final-set`** | **final, measured once** | At least 40 new fictional documents with at least 300 labelled subject details, written without sight of the pattern or marker code. |
| **`outside-final`** | **final, measured once** | 100 documents from Nemotron-PII. |
| **`long-clean`** | **final, measured once** | 5, 10 and 20 pages, different content from `long-dev`. |

The final sets are run once, in part 7, with the miss lists switched off
(`SUMMARY_ARGS=--quiet`). Nobody looks at their misses before then.

Limits known in advance: `final-set` and `long-clean` are still fictional text
from this project, so they are in-distribution. Only the outside sets show
what happens on someone else's text, and those are synthetic too.

## Metrics

All are computed by `scripts/summarise-runs.mjs` from the per-document report.

- **Direct identifiers hidden, at entity level.** A labelled detail counts as
  hidden only if it cannot be read anywhere in the outgoing text. The scoring
  already works this way: each label is the shortest string that must not be
  readable, checked against the whole text ignoring case and line breaks, so
  one surviving mention makes it a miss.
- **Subject's details and other people's details**, separately.
- **Precision**: of the values hidden, the share that overlap a labelled
  detail. Also given with quasi-identifiers counted as right.
- **Useful facts kept**, and **medical terms kept**, with high-severity terms
  (loss changes what the document means) counted on their own and as
  documents losing at least one.
- **Quasi-identifiers left readable per document.** A count, no threshold.
- **Run-to-run consistency**: the share of labelled items with the same
  decision in every run.
- **Time until the text is safe to send**, and **time until the model has
  finished**. Medians over documents.
- **Review burden**: underlines per page (3,500 characters), and the clicks a
  reviewer needs to hide what was missed. Missed items that are not
  underlined are listed apart, because a click cannot reach them.
- **Intervals**: a Wilson 95% interval for each rate within a run, and a
  bootstrap over documents (1,000 resamples, fixed seed) for subject details
  hidden and for precision. Repeat runs share their items, so they are given
  as a range and are not pooled.

## Thresholds on `final-set`

| Measure | Threshold |
|---|---|
| Subject's direct identifiers hidden | 97% or more in every run, and the lower end of the Wilson 95% interval at 95% or more |
| Other people's details hidden | 95% or more |
| Useful facts kept | 90% or more |
| Medical terms kept | 95% or more, and no high-severity loss in 9 documents out of 10 |

`outside-final` and `long-clean` have no threshold. Their numbers are reported
as they are.

## Stopping rule

- At most three design iterations in part 2 (hide first). An iteration is a
  change to what is hidden or restored, measured on the development sets.
- A change is kept only if it improves what it was meant to improve, does not
  lower subject's details hidden, and keeps useful facts and medical terms
  within one point.
- Hide first becomes the default only if, on the development sets and
  `outside-dev`, it hides at least as much as today's scrub, the text is safe
  in under 100 ms, and useful facts kept after the model's restores is within
  two points of today's scrub.
- Then the code is frozen and each final set is measured once. Whatever comes
  out is the result. A missed threshold goes in the headline.

## Changes

**16 November 2026, before any final set was measured.**

- The adoption condition for hide first ("useful facts kept within two
  points of today's scrub") was replaced. Reason: the instruction test showed
  that a line inside a document could make the model show a person's name
  again. The owner set new pass conditions for that step: other people's
  details on the instruction test within the run-to-run range of the same
  letters without the line, no protected item restored, and ambiguous names
  no lower than the old scrub. Meeting them needed stricter restores, which
  cost about four points of useful facts on `dev-all` (99.3% to 95.1%).
- The thresholds on `final-set` are unchanged.
- `final-set` came out larger than planned: 46 documents and 481 subject
  details.
- RedactionBench was dropped: about half of it is real documents.
