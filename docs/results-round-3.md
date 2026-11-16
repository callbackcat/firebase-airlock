# Airlock round 3: results

**Two of the four thresholds are missed.** On the final set the scrub hides
97.1% of the subject's details, with two runs of five at 96.9% against a
threshold of 97%, and it keeps 91.5% of medical terms against a threshold of
95%. Other people's details (100%) and useful facts kept (92.7%) pass.

**Later work:** real court judgments and the trace of hidden medical terms are in `results-round-3-addendum.md`; the medical fix, the blind medical set and the second measurement of this set are in `results-round-3-medical.md`.

Written 16 November 2026. Brief: `claude-code-round3-prompt.md`. Earlier work
is in `results-round-2.md`; where the two disagree, this file is right.

## Final measurement

Run once on frozen code, on sets never measured before. Miss lists were not
printed and have not been read.

### `final-set`: 46 new fictional documents, five runs

Written by a separate agent that did not see the pattern, marker or model
code. 481 subject details, 181 other people's details, 409 useful facts, 117
medical terms of which 60 are high severity.

| Measure | Threshold | Result | Verdict |
|---|---|---|---|
| Subject's details hidden | 97% or more in every run | 97.1% mean: 96.9, 96.9, 97.1, 97.7, 97.1 (466 to 470 of 481) | **Missed** in two runs of five, by one detail each |
| Lower end of the Wilson 95% interval | 95% or more | 94.9, 94.9, 95.2, 96.0, 95.2 | **Missed** in the same two runs |
| Other people's details hidden | 95% or more | 100% (181 of 181, every run) | Pass |
| Useful facts kept | 90% or more | 92.7% mean (91.2 to 94.1; 373 to 385 of 409) | Pass |
| Medical terms kept | 95% or more | 91.5% mean (88.9 to 93.2; 104 to 109 of 117) | **Missed** |
| No high-severity medical loss in 9 documents of 10 | at most 4 of 46 documents | 3, 6, 7, 4, 5 documents lost one (52 to 56 of 60 terms kept) | **Missed** in three runs of five |

Also on `final-set`: precision 59% (about 880 of 1,490 hidden values overlap
a labelled detail); 10 to 14 leaked details per run were not underlined, so a
click could not reach them; safe to send after 16 to 18 ms (median, 57 ms at
most); model done after 5.0 to 5.5 s (median; 15 to 24 s for the slowest
document); canaries discarded 1 to 4 of 48 calls; protected items restored
by the model: 0.

### `outside-final`: 100 documents from Nemotron-PII, three runs

| Measure | Result |
|---|---|
| Direct identifiers hidden | 98.5% (337 of 342 in all three runs; Wilson 96.6 to 99.4) |
| Precision | 61 to 62% |
| Leaks not underlined | 5 |
| Safe after / model done | 2 ms / 2.5 to 3.4 s (median) |

One of the three runs was first lost to a harness error and re-run; no
result from the failed attempt existed. No threshold applies. The data is
synthetic and short, and has no useful-facts labels, so over-hiding could not
be measured on it.

### `long-clean`: 5, 10 and 20 pages, three runs

Subject's details 36 of 36, other people's 32 of 32, useful facts 25 of 25,
medical terms 14 of 14, in every run. Safe after 26 to 35 ms (median, 43 ms
at most). Model done after 3.0 to 3.8 s (median); the slowest document took
8.3 to 9.0 s, which includes the model's cold start. One on-device call per
document.

### Forced CPU: 12 one-page letters, three runs (development letters)

Safe after 7 to 13 ms. Model done after 12.7, 13.8 and 15.9 s (medians;
17 to 20 s for the slowest letter). 85 of 85 details hidden, 49 or 50 of 51
useful facts kept, in every run.

### The gap between our letters and outside text

| | Round 2 (old scrub, one run) | Final design |
|---|---|---|
| Our own letters | 96.9% on `dev-all` | 97.1% on `final-set` |
| Outside synthetic text | 88.7% on `outside-dev` | 98.5% on `outside-final` |
| Gap | 8.2 points | none; outside is 1.4 points higher |

The outside figure moved because of the technical-identifier patterns. The
final-set figure did not move with the development figure (98.9 to 99.2% on
`dev-all`), which is what tuning on development letters looks like: about
two points of that were fitted to letters already seen.

### Reading the result

- **Privacy side: close to the mark, not over it.** 97.1% with an interval
  of roughly 95 to 98%. Nobody else named in a document leaked in any run.
- **Usefulness side: the weak point is medical vocabulary.** About one
  medical term in twelve is hidden, and in three runs of five more than one
  document in ten lost a term that changes its meaning. The development sets
  did not predict this (96.9% there); the final set has more, and more
  varied, medical documents.
- **Precision of 59% means about four in ten hidden values were not a
  labelled detail.** Hide first accepts that by design; the answer-quality
  test in step 3 found no cost on 12 development letters, but it was not run
  on the final set.
- **Nothing here was measured on real documents.**

The sections below record how the design got here.

All numbers are three runs with the on-device model unless marked. Sets are
development and stress sets. The raw table is `round-3-table.md`. The code is
frozen at the commit that added this file, on branch `round-2`, not pushed.
Same machine as before: 8-core Ryzen, GPU with about 8 GB VRAM, Windows 11,
Chrome 157.

## What the scrub is now

1. **Hide first.** On paste, everything the patterns find and everything the
   marker underlines is hidden, in code, in 1 to 90 ms. The text is safe to
   send from that moment.
2. **The model only un-hides.** One on-device call labels the hidden marked
   items. Only items it calls **medical** or **ordinary** are shown again.
   Organisations are shown only when their own name holds an organisation
   word, decided in code. Places stay hidden.
3. **Never restored, whatever the model says:** pattern hits; any word on the
   name list; a word next to a hidden name; a word containing or following a
   title or role word (Dr, Nurse, Mr, Judge, "seen by", "cc"). One exception:
   a listed name directly followed by "disease", "syndrome", "monitor" and the
   like, so "Parkinson's disease" can come back.
4. **A missing, malformed or late reply restores nothing.** Every on-device
   call is cancelled after 30 s.
5. **Canaries.** Two made-up names go into every un-hide call. If either
   comes back restorable, that call's restores are thrown away.
6. **Marker sources added:** the name list for words without a capital;
   patterns run over a capitalised copy of a document typed without capitals;
   technical identifiers (IP, MAC, tokens, keys, cookies, values after
   "password", "PIN", "CVC"); postcodes for Canada, Ireland and US ZIP; a
   word next to a hidden name or after "Dear".

## Where the development sets stand

| Set | Old scrub (start of round 3) | Now |
|---|---|---|
| `dev-all` (60 letters), subject's details hidden | 96.9% (96.1 to 97.5) | 98.9 to 99.2% |
| `dev-all`, other people's details | 95.0% | 100% |
| `outside-dev` (50 outside documents), direct identifiers | 88.9% (87.7 to 89.7) | 99.2% (99.0 to 99.5) |
| `stress-lower` (all lower case), subject / others | 48% / 10% | 96.4% / 90.3% |
| `stress-ambiguous`, subject | 95.0% | 98.1% |
| Useful facts kept, `dev-all` | 99.3% | 95.0% |
| Medical terms kept, `dev-all` | 100% | 96.9% |
| Precision, `dev-all` | 80.3% | about 69% |
| Safe to send after | about 3 s | 1 to 90 ms |

Recall is up on every set. The cost is useful facts (about four points) and
precision. **These are development numbers.** The technical patterns in
particular were written after reading `outside-dev`'s misses, so
`outside-final` is the real test of the outside figure.

## Step 0

- The spare working copy from round 2 is removed. A temporary one used during
  round 3 is removed too.
- Every on-device call has a 30 s limit and fails closed. The benchmark
  runner stops a run that shows no progress for three minutes.
- Word lists kept: names 242 KB and common words 83 KB compressed, from US
  Census, ONS, Ireland's CSO, Wikidata, SCOWL and Google Books Ngram. Three
  licences were spot-checked at source and match `wordlists.md`.

## Step 1: the hide-first decision and the instruction test

Hide first against the old scrub, before any of the changes above:

| Set | Old scrub: hidden | Hide first: hidden | Useful facts kept (old / hide first) | Safe after |
|---|---|---|---|---|
| `dev-all` | 96.9% (96.1 to 97.5) | 96.6% (96.4 to 96.6) | 99.3% / 98.4% | 3.1 s / 4 ms |
| `outside-dev` | 88.9% (87.7 to 89.7) | 90.0% (88.2 to 91.7) | not labelled | 2.5 s / 1 ms |
| `stress-ambiguous` | 95.0% | 92.1% | 98.2% / 98.7% | 2.4 s / 2 ms |
| `stress-medical` | 100% | 99.6% | 93.8% / 91.7% | 4.2 s / 8 ms |
| `stress-messy` | 97.2% | 97.2% | 97.6% / 92.9% | 3.8 s / 10 ms |
| `stress-lower` | 48.2% | 44.0% | 100% / 100% | 3.0 s / 2 ms |
| `stress-upper` | 92.9% | 94.0% | 87.4% / 73.4% | 7.4 s / 4 ms |

**The instruction test failed at first.** With one instruction-like line
inserted, other people's details hidden fell from 98.9% to 92.5%. The label
behind it: the marker had merged a role word into the item, and the model
called "Nurse (first name) (surname)" MEDICAL in three runs of three, which
made it restorable. A second leak, a bare surname in a court letter in two
runs of three, did not reproduce once labels were being recorded; its label
in the leaking runs is unknown.

Three designs on a wider test (10 letters x 5 inserted lines, 50 documents):

| Design | Other people's details, instruction set | Same letters, no line | Ambiguous names | Useful facts kept, `dev-all` | Canary discards, clean `dev-all` |
|---|---|---|---|---|---|
| Hide first as first built | 92.5% (10 documents) | 98.9% | 92.1% | 98.4% | none |
| + no-restore rule + canaries | 98.7% (153 of 155 in every run) | 100% | 94.6% (92.5 to 96.9) | 96.8% (2 runs) | 5 to 7 of 60 calls |
| **+ model restores only medical and ordinary (adopted)** | **99.8% (154, 155, 155 of 155)** | **100%** | **97.3% (96.3 to 98.8)** | **95.1% (94.8 to 95.3)** | **0 to 1 of 60** |

- Pattern hits or no-restore items restored by the model: 0 in every run.
- The second design still leaked one surname: told "X is a company, not a
  person", the model labelled it ORGANISATION, three runs of three.
- With the adopted design the same surname leaked once in three runs, after
  the "reply only DONE" line. Judged a pass: across nine hide-first runs of
  the base letters that day they ranged from 30 to 31 of 31.
- In the second design canaries fired on about 10% of clean calls, because a
  made-up name with no context gets called an organisation or place about
  one time in ten. Under the adopted design they fire in under 2%.

**The price.** Useful facts kept on `dev-all` fell from 99.3% to 95.1% and
precision from 80% to 68%. That is more than the two points the adoption
rule in `eval-plan.md` allowed; the owner's instruction for this step
replaced that condition. It is above the 90% final-set threshold. This
change still has to be written into `eval-plan.md` under "Changes".

## Step 2: the marker

### What leaked without being underlined, before step 2

| Set | Leaks | What | Mechanism that catches it |
|---|---|---|---|
| `dev-all` | 13 of 512 | Names typed in lower case in chats | Name list, any letter case |
| `dev-all` | 4 | A lower-case address with no house number, a username, a Canadian postcode | Lower-case document rule; non-UK postcodes; username still open |
| `outside-dev` | 16 of 204 | IP addresses (5), API keys (4), MAC addresses (3), passwords (2), a unique id, a card security code | Technical-identifier patterns |
| `outside-dev` | 10 | Usernames (4), surnames (3), a first name, a Belgian phone number, a Canadian postcode | Name list in part; non-UK postcodes; the rest open |
| `stress-lower` | 71 of 87 | Names, street addresses, postcodes, reference numbers | Patterns over a capitalised copy; name list |
| `stress-ambiguous` | 11 of 160 | Names that are everyday words (months, "Hope", "Mark", "Frost") | A word next to a hidden name or after "Dear"; the rest open |

### Sources added one at a time, on top of the adopted design

| Source | Target set | Hidden before | Hidden after | Useful facts kept, `dev-all` |
|---|---|---|---|---|
| Starting point | `dev-all` subject / others | 97.0% / 97.2% | | 95.1% |
| Name list, lower-case words | `stress-lower` subject / others | 52.4% / 3.2% | 68.5% / 77.4% | 94.8% (2 runs) |
| Capitalised copy of lower-case documents | `stress-lower` subject / others | 68.5% / 77.4% | 96.4% / 90.3% | 94.8% (93.9 to 95.3) |
| Technical identifiers | `outside-dev` | 91.7% (89.7 to 94.1) | 98.7% (98.5 to 99.0) | 95.0% |
| Non-UK postcodes; word beside a hidden name | `outside-dev` / `stress-ambiguous` | 98.7% / 97.3% | 99.2% (99.0 to 99.5) / 98.1% | 95.0% (2 runs) |

All kept. One iteration used of the three allowed. Two rows have two valid
runs because a harness timeout cost one run each. About 16 to 18 underlines a
page on `dev-all`.

Rejected: marking every lower-case word that is not an ordinary English word
in chat-like text (no gain over the name list, and it hid many useful
words); role-word patterns and hyphen halves as marker sources (no gain once
everything marked is hidden).

## Step 3: is the answer still good?

12 letters, three tasks, 144 cloud calls plus 12 for the guessing test. No
quota errors, no refusals, no wrong claims caught by the rubric.

| | Raw letter | Scrubbed, after restores | Scrubbed, before restores |
|---|---|---|---|
| Required facts present | 70.0% | 72.3% | 72.3% |
| Explain | 97.2% | 98.6% | 95.8% |
| What to do | 71.8% | 73.2% | 73.2% |
| Draft a reply | 40.8% | 45.1% | 47.9% |
| Judge pass (explain) | 11 of 12 | 11 of 12 | 11 of 12 |

- **No measurable price.** Scrubbed answers score level with raw-letter
  answers, on 36 answers a column.
- The low reply scores are the rubric: it lists facts an explanation states,
  and a reply letter does not restate them all.
- The one judge failure is the same letter in every column.
- **Placeholders** after restores: 121 returned exactly, 0 altered, 1
  invented (0.8%). Under the 2% trigger, so the system-instruction comparison
  was not run.
- **Judge check by hand:** 20 judged answers read against the marking rule;
  agreement on 19. The judge passed one answer that left out a dose strength.
- Side finding: raw-letter answers contained 12 invented placeholders,
  because the cloud instruction mentions placeholders even when there are
  none. The app never sends a raw letter.

**What can still be guessed** (12 scrubbed letters, one guess each): the
subject's name in 0 of 12; a town that is in the letter in 2 (a town was
readable in the scrubbed text in 3); an employer or organisation in 2
(readable in 2); a health condition in 0. Small sample, no threshold.

## Step 4: the app, long documents, CPU

In the app: hidden on paste; a status line while the model restores; Send
available at once; restored words styled differently, one click hides them
again; clicking any word hides it everywhere; a warning when text has almost
no capitals; the tolerant placeholder restore, with invented placeholders
flagged. End-to-end check: 9 of 9, no personal detail in the cloud request,
safe after 88 ms on the first scrub and 1 ms after.

Long documents (`long-dev`, whole-document labelling, no "missed" pass):

| | 5 pages | 10 pages | 20 pages |
|---|---|---|---|
| Safe after | 24 to 26 ms | 42 to 60 ms | 42 to 82 ms |
| Model done | 9.5 to 10.0 s (includes the model's cold start) | 2.7 to 3.4 s | 2.7 to 3.2 s |
| On-device calls | 1 | 1 | 1 |

Subject's and other people's details 100% in all three runs, useful facts
kept 98.7% (96.2 to 100), medical terms 100%. One call is enough because the
no-restore rule leaves few items for the model. Both targets are met: safe in
under 1 s, model done within 20 s for 20 pages.

Forced CPU, 12 one-page letters, **one run only** (the second was cut off by
the stop): safe after 13 ms (median), model done after 15.9 s (11.9 to
20.4 s), 85 of 85 details hidden, 49 of 51 useful facts kept.

## Not done

- The system-instruction comparison (not triggered: no refusals, 0.8% of
  placeholders altered or invented).
- Answer quality on the final set. It was measured on 12 development letters
  only.
- Dropped by decision: a two-vote restore, the research branch, idle-decay
  timing, RedactionBench.
- `related-work.md` and `firebase-sdk-feedback.md` are written and not
  posted. Related work quotes only figures confirmed from abstracts.

## Known limits

- A name that is not on the list and has no title or hidden name beside it
  stays hidden only if the model does not call it medical or ordinary. A line
  in the document can still push it there. This is model-dependent and is
  not closed.
- Names that are everyday words ("Hope", "Mark", "Frost") standing alone.
- Usernames and foreign phone formats.
- Places and many organisations stay hidden. That costs about four points of
  useful facts, and answers may be less specific than step 3's small sample
  showed.
- About 16 to 18 underlines a page remain.
- Everything here is fictional or synthetic text. **Nothing was measured on
  real documents.**

## Sample sizes and what they support

- `final-set`: 481 subject details, five runs. Supports "about 97%, interval
  roughly 95 to 98%". It does not support "over 97%".
- 117 medical terms: supports "about 89 to 93% kept". The high-severity count
  rests on 60 terms in about 17 documents, so one document moves it a lot.
- `outside-final`: 342 details, three identical runs. Supports "about 97 to
  99% on this synthetic dataset". It says nothing about real documents.
- `long-clean`: three documents. Supports the timings; too small for a rate.
- Repeat runs share their items, so ranges are given and runs are not pooled.

## Questions for the next round

1. Medical terms: the model may restore what it calls medical, yet one term
   in twelve stays hidden. Is that the no-restore rule catching terms that
   are also names, or the model not labelling them medical? The miss lists
   for `final-set` have not been read; reading them ends its use as a clean
   set.
2. Is 97.1% with a 95 to 98% interval the number to publish, and with which
   wording?
3. The remaining leaks are details the marker never underlines. Is there
   time for another marker source, given that it needs a new clean set?
