# Round 3 addendum: real documents, medical terms (work stopped part-way)

> The medical work described as unfinished below was completed later the same day: see `results-round-3-medical.md`. The court-judgment section here is final.

Written 16 November 2026, 16:36, when the work was stopped at the owner's
request. It adds to `results-round-3.md`, whose headline (the first
measurement of `final-set`) is unchanged. Same machine. Branch `round-2`, not
pushed.

**State in one line:** the court-judgment measurement is complete; the
medical fix is written, switched off by default, and only one of its fifteen
acceptance runs had finished; `final-medical` and the second `final-set`
measurement have not been run.

## Real documents (court judgments)

Text Anonymization Benchmark (TAB): judgments of the European Court of Human
Rights with hand-labelled personal details. Repository
`NorskRegnesentral/text-anonymization-benchmark`, MIT licence (its
`LICENSE.txt` and README agree), commit `558e09e`. Used under the amended
rule 4 in `CLAUDE.md`: local, git-ignored (`outside-data/tab/`), on-device
scrub only, no cloud call, no text or name from it written to the repository.

- **Mapping.** DIRECT must be hidden; QUASI is counted with no pass or fail;
  NO_MASK should stay readable.
- **More than one annotator** (up to ten per test document): a detail is
  DIRECT if any annotator marked it DIRECT, otherwise QUASI if any marked it
  QUASI, otherwise NO_MASK. This is the strictest reading for the scrub.
- **Entity level.** TAB gives each mention an entity id. An entity counts as
  hidden only when every written form of it is hidden.
- **Debug.** 10 train-split documents: 20 of 20 direct entities hidden, no
  mapping fault found.
- **Measured once:** 100 test-split documents, seed 20261116, frozen final
  design (before any medical change), three runs. One run alone for timing,
  two side by side in two browsers.

| Measure | Result |
|---|---|
| Direct identifiers hidden, entity level | 96.1% (219 of 228, the same in all three runs) |
| Wilson 95% interval / bootstrap over documents | 92.7 to 97.9 / 93.1 to 98.6 |
| By type | codes 109 of 110; people 109 of 112; dates 0 of 5; organisation 1 of 1 |
| Leaked entities not underlined | 9 of 9 |
| Quasi-identifiers left readable per document | about 25 of 40 (62%) |
| NO_MASK spans hidden | 68 to 70% (681 to 701 of 1,001) |
| Precision | 9% counting direct identifiers only; 53% counting direct or quasi |
| Safe to send after | 15 ms median, 74 ms at most |
| Model done after | 6.9 s median, 60 s at most (the run made alone) |
| On-device calls / cancelled or failed | 142 / 4 to 8 per run |
| Canary discards | 20 to 24 of 142 calls |
| Protected items restored by the model | 0 |

Side by side with the other final figures:

| Text | Direct or subject details hidden | Interval |
|---|---|---|
| Fictional letters, `final-set` (first measurement) | 97.1% | about 95 to 98 |
| Synthetic outside text, `outside-final` | 98.5% | 96.6 to 99.4 |
| **Real documents (court judgments)** | **96.1%** | **92.7 to 97.9** |

What it shows:

- On real text the scrub hides about 96% of what must be hidden, a point
  below the fictional final set and inside its interval.
- **All five direct dates leaked.** There is no pattern for a date that is
  not labelled as a date of birth.
- **Heavy over-hiding.** About two thirds of the spans the annotators said
  should stay readable were hidden: courts, institutions, legal terms.
  Under strict restores, organisations and places do not come back.
- **Canaries discard about 15% of calls on this text**, against under 2% on
  our letters, and a few calls per run hit the 30-second limit on the long
  judgments. Both fail closed and both add to the over-hiding.
- Whether a cloud answer about a judgment is still useful after this much is
  hidden was not tested, and under rule 4 cannot be: no cloud call is made on
  this data.

## Three stress sets re-run under the final design (three runs each)

| Set | Subject hidden | Others hidden | Useful facts kept | Medical terms kept |
|---|---|---|---|---|
| `stress-medical` | 100% | 100% | 82.5% (80.0 to 86.3) | 82.3% (79.7 to 86.1) |
| `stress-upper` (all capitals) | 98.2% | 100% | 56.5% (52.2 to 59.4) | 33.3% (20 to 40) |
| `stress-messy` | 97.6% | 97.4% | 92.9% (91.4 to 94.3) | 96.8% (95.2 to 100) |

Baseline taken at the same time for the medical fix: `dev-all` 98.9% /
100%, useful facts 94.7% (93.6 to 95.3), medical terms 94.8% (90.6 to 96.9);
`stress-ambiguous` 99.2% / 100%; `stress-instructions-wide` 100% / 100%.

New known limit: **text written all in capitals is safe but badly
over-hidden.** Every word looks like a name, and little comes back.

## Why medical terms are hidden (development sets, three runs each)

| Cause | `dev-all` (10 of 192 lost) | `stress-medical` (42 of 237 lost) |
|---|---|---|
| Model labelled it PERSON | 3 | 19 |
| No-restore rule: name list | 3 | 12 |
| Canary discard | 4 | 7 |
| Model labelled it ORGANISATION | 0 | 3 |
| Model unsure, or the call failed | 0 | 1 |

The largest cause is the model calling a term named after a person a PERSON
(Babinski sign, Holter monitor, Addison's disease). The name list is second.
The `final-set` miss lists were not read.

## The medical fix (written, switch `medsafe`, off by default)

A medical safe list decided in code, as specified by the owner:

1. A marked item that sits inside a whole phrase on the medical list is
   shown without asking the model, so a canary discard cannot undo it.
2. Head-word fallback for "disease" and "syndrome" only. **Deviation:** the
   project has one combined name list, not a separate given-name list, so
   the fallback is refused for any word on the name list, surnames included.
3. A single listed word that is also on the name list is shown only when a
   dose, strength, form or frequency follows.
4. Never after a title or role word, next to a hidden name, or when the same
   word is a hidden name elsewhere in the document.
5. Added while testing: a single word must be five letters or more, not a
   possessive, not the surname in an eponym standing alone ("Crohn"), and not
   followed by another capitalised word ("Metformin Okafor").

**The list.** `src/data/medical.txt`, built by `scripts/build-medical.py`
from Wikidata labels and aliases (CC0, the licence already verified for the
name list): medicines with an ATC code, items with an ICD-10 code, MeSH
disease, technique and drug branches, symptoms, tests, procedures, and
medical items named after a person. 91,425 phrases, 482 KB compressed, loaded
on demand. 365 of its single words are also on the name list. Known gaps:
"Holter monitor", "Hickman line" and "Foley catheter" are not in it.

**No-model check** (deterministic, all development sets): no privacy figure
changes. Medical terms kept before any model restore rise from 76.6% to
92.2% on `dev-all`, 63.3% to 75.9% on `stress-medical`, 76.2% to 90.5% on
`stress-messy`.

**With the model: one run each on two sets, then stopped.**

| Set | Runs | Subject | Others | Useful facts kept | Medical terms kept |
|---|---|---|---|---|---|
| `dev-all` | 1 of 3 | 355 of 358 | 154 of 154 | 95.3% (327 of 343) | 98.4% (63 of 64) |
| `stress-instructions-wide` | 1 of 3 | 279 of 280 | 155 of 155 | 95.1% | 25 of 25 |

One run does not decide anything. `stress-traps`, `stress-medical` and
`stress-ambiguous` were not reached.

**The traps.** Ten trap sentences are in `stress-traps` (12 names). Without
the model, **four names leak with or without the fix**: a possessive name
opening a sentence ("Amara's scan", "Sarah's line manager", "Tom's test
results") and a surname opening a sentence. The cause is older than this
work: a capitalised word that opens a sentence is treated as an ordinary
sentence opening unless it is marked elsewhere. The fix itself exposes none
of the twelve. So "the traps pass" is not met as written, and not because of
the fix. Closing it means a marker change (an opening word on the name list
is marked), which the brief kept frozen. This is a real leak pattern and
probably accounts for some `final-set` misses; that is a guess, since those
lists were not read.

## Parallel browsers

Two test browsers at once work: 10 letters each in 51 s of wall time, 3.6
and 3.7 s a letter, against 4.2 s alone. The second browser runs from a local
copy of the first profile (`.chrome-profile-2`, git-ignored). Use
`EVAL_OUT`, `CHROME_PROFILE`, `CHROME_DEBUG_PORT` and `PORT` to keep them
apart; see `scripts/eval-arms.sh`. Timings from parallel runs are not
reported.

## Not done

- The medical fix's acceptance runs (14 of 15 outstanding) and the decision
  to keep it.
- The optional all-capitals route (switch `updoc`, written, never run).
- `final-medical`: 20 documents written blind to the code and the list (206
  subject details, 159 other people's, 212 medical terms, 71 high severity).
  Committed, never measured.
- The second `final-set` measurement.
- The `eval-plan.md` "Changes" entry for the medical fix.

## To resume

```bash
git checkout round-2
F=strictrestore,nameslc,lcdoc,tech,w2,adj,medsafe

# 1. Acceptance runs for the medical fix, two browsers side by side
VITE_FLAGS=$F TAG=medsafe ARMS=a3 SETS="dev-all stress-traps stress-medical" bash scripts/eval-arms.sh &
VITE_FLAGS=$F EVAL_OUT=eval-results/p2 CHROME_PROFILE=.chrome-profile-2 CHROME_DEBUG_PORT=9334 PORT=5183 \
  TAG=medsafe ARMS=a3 SETS="stress-instructions-wide stress-ambiguous" bash scripts/eval-arms.sh
wait
node scripts/trace-medical.mjs "medsafe dev-all" "medsafe stress-medical"

# 2. Keep it only if subject's and other people's details hold on dev-all,
#    stress-ambiguous and stress-instructions-wide. If kept, add medsafe to
#    DEFAULT_FLAGS in src/flags.ts and commit: that is the freeze.

# 3. Then, once each, five runs, counts only:
RUNS=5 TAG=FINAL2 ARMS=a3 SETS="final-medical" bash scripts/eval-arms.sh
RUNS=5 TAG=FINAL2 ARMS=a3 SETS="final-set" bash scripts/eval-arms.sh   # "second measurement after one change prompted by the first"
grep FINAL2 eval-results/table.md
```

The first `final-set` measurement stays the headline whatever the second one
shows.
