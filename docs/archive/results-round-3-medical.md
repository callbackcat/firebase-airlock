# Round 3, last part: the medical fix and the closing measurements

Written 16 November 2026, 19:30. This closes the measurement work. It follows
`results-round-3.md` (whose headline, the first measurement of `final-set`,
stands) and `results-round-3-addendum.md` (court judgments, the trace of
hidden medical terms). The marker stayed frozen throughout. The `final-set`
miss lists have still not been read.

**In one line:** the medical fix helps on the letters it was built from and
on `final-set`, but on 20 medical documents written blind to it the scrub
keeps only 86.5% of medical terms and 87.6% of useful facts, both under their
thresholds. Privacy on that set is the best measured: 99.3% of the subject's
details hidden.

## What changed (one change, switch `medsafe`, now on by default)

1. **A medical safe list decided in code.** A marked item that sits inside a
   whole phrase on the list is shown without asking the model, so a canary
   discard cannot undo it. The list is `src/data/medical.txt`: 91,425
   phrases from Wikidata labels and aliases (CC0), 482 KB compressed, loaded
   on demand. Built by `scripts/build-medical.py`.
2. **Head-word fallback** for "disease" and "syndrome" only, and never for a
   word on the name list. The brief said "given-name list"; the project has
   one combined list, so this is stricter than asked.
3. **A single listed word that is also on the name list** is shown only when
   a dose, strength, form or frequency follows.
4. **Never** after a title or role word, next to a hidden name, or when the
   same word is a hidden name elsewhere in the document.
5. **Added while testing:** a single word must be five letters or more, not a
   possessive, not an eponym's surname on its own, and not followed by
   another capitalised word.
6. **The model's "medical" label no longer restores a word that stands like
   a name** (a possessive, an eponym's surname alone, a word before another
   capitalised word). This closed two trap leaks and cost some medical terms.

## Acceptance on development sets (three runs each)

| Set | Frozen design | With the fix |
|---|---|---|
| `dev-all`: subject / others hidden | 98.9% / 100% | 99.2% (98.9 to 99.4) / 100% |
| `dev-all`: medical terms kept | 94.8% (90.6 to 96.9) | 96.9% |
| `dev-all`: useful facts kept | 94.7% | 94.9% |
| `stress-medical`: medical terms kept | 82.3% (79.7 to 86.1) | 86.5% (84.8 to 87.3) |
| `stress-instructions-wide`: subject / others | 100% / 100% | 100% / 99.8% (one leak in one run) |
| `stress-ambiguous`: subject | 98.1% (round 3's valid runs) | 98.3% (98.1 to 98.8) |
| Protected items restored by the model | 0 | 0 |

Kept: subject's and other people's details hold within run-to-run range on
the three named sets, and nothing protected was restored. The one leak on the
instruction set is the known limit: a surname that is not on the name list
and has no title beside it.

**The traps (`stress-traps`, 12 names in 10 sentences).** With the fix, 8 of
12 stay hidden in every run. The four that leak are names that open a
sentence ("Amara's scan", "Sarah's line manager", "Tom's test results", a
surname). They leak identically without the fix: the marker treats a
capitalised word at the start of a sentence as an ordinary opening. The
marker was kept frozen by decision, so **the "traps pass" condition is not
met, and the cause is outside this change.** Before point 6 above, two more
leaked because the model labelled a name MEDICAL; both are closed.

Before point 6 the fix kept more medical terms (98.4% on `dev-all`, 90.3% on
`stress-medical`). Point 6 gave some of that back to close the two leaks.

## `final-medical`: 20 documents written blind, five runs, measured once

Written by a separate agent that opened only two files, for the format, and
never the code, the word lists or the docs. 206 subject details, 159 other
people's, 240 useful facts of which 212 are medical terms (71 high severity,
54 named after people).

| Measure | Threshold (from `eval-plan.md`) | Result | Verdict |
|---|---|---|---|
| Subject's details hidden | 97% in every run; interval's lower end 95% | 99.3% mean: 205, 204, 205, 204, 205 of 206; lower end 96.5 to 97.3 | Pass |
| Other people's details hidden | 95% | 99.9% (158 or 159 of 159) | Pass |
| Useful facts kept | 90% | 87.6% mean (85.8 to 88.8; 206 to 213 of 240) | **Missed** |
| Medical terms kept | 95% | 86.5% mean (84.9 to 87.7; 180 to 186 of 212) | **Missed** |
| No high-severity loss in 9 documents of 10 | at most 2 of 20 | 5 or 6 documents lost one (64 to 66 of 71 terms kept) | **Missed** |

Also: precision about 59%; one leaked detail per run was not underlined; safe
to send after 11 to 21 ms; model done after 5 to 9 s (median, two browsers
running at once, so not a clean timing); canaries discarded 1 to 3 of about
22 calls; protected items restored 0. One of the five runs first produced no
result file and was run again.

This set was built to be hard on medical vocabulary: generic and brand
medicine names, abbreviations, and 54 terms named after people.

## `final-set`: second measurement after one change prompted by the first

Five runs. **The first measurement stays the headline.** This set has now
been measured twice, and the change between the two was prompted by its first
result, so the second is not a clean number.

| Measure | First measurement | Second measurement |
|---|---|---|
| Subject's details hidden | 97.1% (96.9 to 97.7) | 96.9% (96.7 to 97.1): 466, 465, 466, 467, 466 of 481 |
| Other people's details hidden | 100% | 99.9% (181 of 181 in four runs, 180 in one) |
| Useful facts kept | 92.7% (91.2 to 94.1) | 91.7% (91.0 to 92.7) |
| Medical terms kept | 91.5% (88.9 to 93.2) | 93.7% (91.5 to 96.6): 107, 108, 108, 113, 112 of 117 |
| Documents losing a high-severity term | 3, 6, 7, 4, 5 of 46 | 4, 5, 5, 2, 3 of 46 |

Medical terms kept rose by about two points and is still under 95%. Subject's
details hidden is level within noise (one or two details in 481). Useful
facts kept is a point lower, also within its range.

## All the final figures side by side

| Text | Subject or direct details hidden | Medical terms kept | Useful facts kept |
|---|---|---|---|
| Fictional letters, `final-set`, first measurement | 97.1% (interval about 95 to 98) | 91.5% | 92.7% |
| Fictional medical documents, `final-medical` | 99.3% | 86.5% | 87.6% |
| Synthetic outside text, `outside-final` | 98.5% (96.6 to 99.4) | not labelled | not labelled |
| Real court judgments (TAB) | 96.1% (92.7 to 97.9) | not applicable | 30 to 32% of "should stay readable" spans kept |

`outside-final` and the court judgments were measured before the medical
change, on the design frozen at the end of round 3.

## What this says

- **The privacy side holds across four kinds of text**: 96 to 99% of what
  must be hidden is hidden, including on real documents, and nobody else
  named in a document leaked in 13 of 15 final runs on our own sets (one
  detail in each of the other two).
- **The usefulness side is the weak half, and medical vocabulary is where it
  shows.** Roughly one medical term in eight is hidden on documents the list
  was not built from. A list of 91,000 phrases did not close the gap: terms
  the list lacks ("Holter monitor", "Hickman line") still go to the model,
  which calls a term named after a person a PERSON.
- **The scrub over-hides by design.** Precision is about 59 to 69% on our
  sets and far lower on court judgments.

## Known limits (complete list at the end of the work)

- **A name that opens a sentence is not underlined** and so can leak
  ("Amara's scan has been moved"). Found by the trap sentences; the marker
  was kept frozen. This is the most concrete open leak.
- A name that is not on the name list and has no title or hidden name beside
  it stays hidden only if the model does not call it medical or ordinary. A
  line in the document can still push it there.
- Names that are everyday words ("Hope", "Mark", "Frost") standing alone.
- Dates that identify a person but are not labelled as a date of birth.
- Usernames and foreign phone formats.
- Medical terms: about one in eight hidden on unseen medical documents.
- Places and many organisations stay hidden.
- Text written all in capitals is safe but badly over-hidden. A route for it
  is written (switch `updoc`) and was never run.
- Canaries discard about 5 to 15% of un-hide calls on longer or denser text,
  which adds to the over-hiding.
- Everything except the court judgments is fictional or synthetic. The court
  judgments are one kind of real document; no cloud answer was tested on
  them.

## Not done

- The optional all-capitals route.
- Answer quality on any final set (measured on 12 development letters only).
- Two of the earlier forced-CPU and timing figures were not repeated with the
  medical fix. The safe list is a set lookup done before the model call, so
  no slowdown is expected; that is not measured.
