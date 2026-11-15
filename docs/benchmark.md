# Benchmark: runs against a real on-device model

**Verdict: passes on unseen letters, as a way to reduce what is shared, with review still a required step.**
On eight letters it had never seen, the scrub hides 97.4% of the subject's
details on its own (95.7% to 97.8%, five runs, all five a pass) and keeps
every useful fact. A scrub takes about 5.5 seconds a letter on a GPU and about
22 seconds on CPU, and the fixed patterns appear in a few milliseconds. The
first run of the day hid 86%, with one run in three below 80%.

It is still not a guarantee: two details in those eight letters were neither
hidden nor marked in any run.

This page has four parts: the first run, the
[second session](#iterations-second-session), the
[third session](#iterations-third-session) and the
[fourth session](#speed-fourth-session), which made the scrub faster and has
the current numbers.

Run on 15 November 2026.

## Answers to the four questions

1. **Does the on-device model run through Firebase AI Logic in Chrome here?**
   Yes. `ONLY_ON_DEVICE` calls ran on all letters in every run, and the scrub
   still ran with the page offline.
2. **How much does the scrub hide, and how much does it destroy?**
   86.4% of subject details on unseen letters (98.5% on the tuning set), while
   keeping 99% of the useful facts.
3. **Is the privacy claim true at the network level?**
   Partly. No request left the machine during the scrub, and nothing Airlock
   hid appeared in the cloud request. But what the model misses is sent in
   clear: in the one end-to-end run, a street address and a doctor's name
   reached the cloud.
4. **Can the scrub be made good enough with prompt and pipeline changes?**
   On the tuning set, yes (67% to 98.5% in three changes). On unseen formats,
   not yet, and the run-to-run spread is wide.

## Environment

| | |
|---|---|
| OS | Windows 11 Home, build 22621 |
| CPU | AMD Ryzen 7 6800HS, 8 cores |
| RAM | 31 GB |
| GPU | AMD Radeon RX 6800S (plus integrated Radeon) |
| Free disk | 392 GB |
| Chrome | 157.0.8103.52, stable channel |
| How the model was enabled | Nothing was needed. A fresh profile (`.chrome-profile/`) reported `LanguageModel.availability() = downloadable`, downloaded the model on first use and then reported `available`. No flag was set. |
| Firebase JS SDK | 13.3.0 |
| Cloud model | `gemini-3.5-flash-lite`, via `firebasevertexai.googleapis.com` |
| Node | 22.23.5 |

Not recorded: the model name and version from `chrome://on-device-internals`.

## Results

Each row is three runs: mean, with the range in brackets. "Subject" is details
of the person the letter is about. "Others" is staff and third parties.

### Tuning set: 12 letters, 68 subject details, 17 others

| Stage | Subject hidden | Others hidden | Useful facts kept |
|---|---|---|---|
| Patterns only, no model (before any change) | 29.4% | 23.5% | 100% |
| First measurement with the model | 67.1% (64.7 to 69.1) | 54.9% (47.1 to 64.7) | 100% |
| + name parts | 81.9% (80.9 to 82.4) | 58.8% (52.9 to 64.7) | 100% |
| + labelled reference patterns | 94.1% (92.6 to 95.6) | 56.8% (52.9 to 58.8) | 100% |
| + rewritten scrub prompt | 98.5% (97.1 to 100) | 92.1% (88.2 to 94.1) | 98.7% (98.0 to 100) |

### Hold-out set: 8 new letters, 49 subject details, 22 others

Written after tuning stopped and never tuned on: an email thread, a payslip,
a tenancy agreement extract, a hospital bill from the United States, a very
short note, a two-page decision letter, a chat export and a referral form.

| Stage | Subject hidden | Others hidden | Useful facts kept |
|---|---|---|---|
| Patterns only | 28.6% | 4.5% | 100% |
| Final version | 86.4% (77.6 to 91.8) | 65.2% (36.4 to 81.8) | 99.2% (97.6 to 100) |

Against the thresholds in the test plan (pass 95% and 90%, marginal 85% and
80%): two hold-out runs were marginal and one was a fail.

Median time per letter was 2.3 to 4.9 seconds. The model returned 40 to 80
spans per run and nearly all were real text from the letter (at most two per
run were dropped as invented).

## Misses that remain

- **Whole letters under-read in some runs.** In the failing hold-out run the
  model returned almost nothing for the two-page letter and the chat export,
  so every staff name in one and every name in the other stayed readable. The
  same letters were handled well in the other two runs. This spread is the
  biggest risk.
- **People mentioned once by first name.** A daughter, a sister, a partner, a
  neighbour: "Ottilie", "Aoife", "Noor", "Zofia". A nickname of a hidden name
  ("Leo" for "Leopold").
- **Signers given by initial or first name only.** "D. Whitcombe",
  "Dr P. Underhill", "Petra".
- **Addresses inside a sentence or a subject line.** "41 Sedge Row",
  "7b Garnet Terrace", "8 Tanner's Yard", and building names.
- **Reference numbers without a standard label.** "The job number is
  CH-20931", "Employee no: 118204".

## Network checks

`npm run e2e`, one run, one real cloud call. All nine passed.

| Check | Result |
|---|---|
| Firebase AI Logic is configured | Pass |
| On-device model ran the scrub | Pass (11.7 s, first call) |
| Scrub works with the page offline | Pass (3.5 s) |
| No request left the machine during the offline scrub | Pass |
| Hidden values found to check | Pass (9 values) |
| A cloud request was made | Pass (`firebasevertexai.googleapis.com`) |
| No hidden value appears in any cloud request body | Pass |
| An answer came back | Pass |
| Real values were restored locally | Pass |

The only external host in the request log was
`firebasevertexai.googleapis.com`, for the cloud call.

I read the saved request body. It held placeholders (`[PERSON_1]`,
`[POSTCODE_1]`, `[ID_NUMBER_1]`, `[DOB_1]`, `[ACCOUNT_1]`) where Airlock had
hidden something. **It also held "14 Larch Close" and "Dr Tomasz Bielak" in
clear**, because the model missed them in that run. The check passes because
it only looks for values Airlock hid; it cannot see what was never found. In
the app, the approval panel is where a person would catch this.

## What changed, and why

Kept, one at a time, each measured over three runs:

1. **Name parts** (`expandNameParts` in `src/airlock.ts`). The model returns
   "Mr Oluwaseun Adebayo" once; the letter then says "Dear Mr Adebayo". Each
   part of a detected name is now hidden wherever it appears. Titles, initials
   and month or day names are skipped.
2. **Labelled reference patterns** (`src/airlock.ts`). Values after "ref",
   "reference", "number", "No." or "ID" that are capitals and digits with at
   least one digit, plus UK vehicle registrations.
3. **Scrub prompt** (`SCRUB_SYSTEM` in `src/models.ts`). Tells the model to
   list every named person including the signer, and each line of an address
   separately, with one fictional worked example.

Also fixed: `scripts/chrome.mjs` built `C:\C:\...` paths on Windows, so
neither script could start. Added `scripts/eval3.sh` (three runs) and
`EVAL_SET=holdout`.

Not tried: a second on-device pass, splitting people and addresses into
separate calls, smaller chunks. The plan allowed three rounds. A second pass
is the obvious next thing to try against the "under-read letter" failure.

No fixture name, address or number was put into a prompt or a pattern.

## Still untested

- The scrub with the machine's network switched off entirely (only the page
  was taken offline).
- Reading a photographed letter on device.
- Any other machine, Chrome channel or operating system.
- A hosted build, and App Check with a real provider. The App Check token
  exchange did not appear in the request log; I did not look into why.
- The response's `in_cloud` label is not saved in the results file, so it was
  not checked there. The request did go to the cloud host.
- Non-English letters.

## Recommendation

**Build on it, and change what it promises.**

The split is real and it runs: the raw letter is read on the device, and the
cloud call works on placeholders. But a small model that hides 86% of details
on new formats, and sometimes far less, cannot support "your details never
leave your device". What it supports is "Airlock hides most of them and shows
you exactly what is left before anything is sent".

So the product should be patterns plus the model as a first pass, with human
review as a required step and not a courtesy: the approval panel is the
privacy control. Before building further, try a second on-device pass and
re-measure on the hold-out set; if the low runs do not go away, make the
review step harder to skip, for example by highlighting capitalised words and
numbers the scrub left alone.

## Iterations (second session)

Same machine and Chrome. Each change was measured over three to six runs
before the next one. Three hold-out sets were used, because a set stops being a
clean test once its misses have informed a change:

- `holdout` (8 letters): clean for the first run only.
- `holdout2` (8 letters): clean for iteration 3, then used to find weak points.
- `holdout3` (8 letters): written before iteration 4 was measured, committed
  before its first run, never tuned on. **Its numbers are the result.**

### What was weak, what was done, what it did

| # | Weak point found | Change | Measured effect |
|---|---|---|---|
| 1 | Some runs the model lists far fewer items (2 to 5 where a letter holds 10 or more); no error, just a short list | A second on-device pass reads the letter with everything already found replaced by placeholders and lists what is still readable | `holdout` 86.4% (77.6 to 91.8) to 89.8% (87.8 to 91.8); others 65% to 81%. Scrub time doubled to about 7.5 s |
| 2 | Consistent misses: titled staff, signers, relatives, addresses inside sentences, references with unusual labels. Nothing drew the eye to what was left | Patterns for those; `src/suspects.ts` marks capitalised words and long numbers left in the outgoing text; the approval panel underlines each mark and a click hides it | `holdout` 95.4% (89.8 to 98.0) hidden, 100% hidden or flagged. Patterns alone went from 29% to between 61% and 82%, depending on the set |
| 3 | About 1 run in 8, one on-device call ran away: 165 s until Chrome's output limit, then the whole letter fell back to patterns. My first time limit did not cancel the call, so the calls queued behind it timed out too | The abort signal is now passed to Chrome's `prompt()` (the SDK ignores the one on `generateContent`), 15 s limit, `maxItems` and `maxLength` in the output schema, one retry of the first pass, and a failed review pass keeps the first pass | 25 runs since: no runaway, no failed pass, no letter over 17 s |
| 4 | Codes with fewer than four digits escaped the marks; unlabelled codes, buildings and streets without a number, and lower-case titles were missed; a marked name was not marked again at the start of a sentence | Marks for mixed letter-and-digit codes; patterns for bare codes, named buildings, unnumbered streets, "tell X" and "speak to X"; lower-case titles | `holdout2` 91.0% to 97.4% (95.8 to 97.9) hidden, 96.5% to 100% hidden or flagged |

### Current numbers

Mean, with the range in brackets.

| Set | Runs | Subject hidden | Subject hidden or flagged | Others hidden | Useful facts kept | Median per letter |
|---|---|---|---|---|---|---|
| **`holdout3`, never tuned on** | 5 | **94.7% (88.7 to 100)** | **100%** | 90.5% (89.5 to 94.7) | 98.2% (93.3 to 100) | 5.9 to 7.2 s |
| `holdout2` | 4 | 97.4% (95.8 to 97.9) | 100% | 100% | 100% | 5.5 to 6.2 s |
| `holdout` | 3 | 97.3% (93.9 to 100) | 100% | 93.9% (86.4 to 100) | 100% | 7.0 to 9.0 s |
| Tuning set (12 letters) | 3 | 99.5% (98.5 to 100) | 100% | 100% | 98.7% (98.0 to 100) | 6.9 to 7.3 s |

With no model at all (what a browser without Gemini Nano gets), on `holdout3`:
71.7% of subject details hidden, 92.5% hidden or flagged, 100% of useful facts
kept. `node scripts/patterns-only.mjs` prints this for every set.

The review marks cost about 6 underlines a letter (5 to 10 across sets), and
they include organisation names and headings.

End-to-end run after the changes: nine checks passed, one cloud call, and the
request body held no personal detail. The street address and the doctor's name
that reached the cloud in the first run were hidden this time.

### Did the three weak points get solved?

1. **Runs where the model returns almost nothing: mostly.** The worst run on a
   clean set went from 77.6% to 88.7%. The spread is still 11 points.
2. **Misses hard to spot: yes, on these letters.** Every detail the scrub left
   readable was marked, in every run with the model, on all four sets.
3. **Re-measured on hold-out after each change: yes**, and on a third set that
   was never tuned on.

### Open weak points, for the next round

- **Hidden without review is 94.7% on unseen letters, just under the 95% bar,
  and two runs in five were below it.** What is still missed: names in running
  text with no title or cue ("the late Cuthbert James Noakes", "Lucian and
  Barnaby", "copied in Jonty"), and a name in an email header in two runs of
  five.
- **A known pattern bug, left unfixed so `holdout3` stays clean:** the titled
  name pattern stops at an apostrophe after one letter, so "Dr Lachlan
  O'Shaughnessy" hides "Lachlan" and leaves the surname (missed 5 runs in 5,
  flagged every time).
- **Lower-case text.** Patterns and marks lean on capital letters. In a web
  form typed in lower case, the model found the names; without the model they
  are neither hidden nor marked.
- **Over-hiding by the model.** An organisation name or a date is hidden now
  and then (useful facts kept fell to 93% in one run).
- **Speed.** About 6 s a letter, 15 s for the first one while the model loads.
  Two calls in sequence, and the SDK builds a new session with the system
  prompt for every call.
- **Noise in the marks.** Organisation names and headings are underlined along
  with real misses.
- **Coverage of the test itself.** One machine, one Chrome version, English,
  36 fictional letters, all written by the same author as the patterns.

Ideas not tried yet: have the second pass choose among the marked items
instead of writing free text, which would remove invented values and runaway
lists; send only the lines that hold a mark to the second pass, for speed; a
names list for lower-case text; a vote over two first passes.

## Iterations (third session)

Same machine and Chrome. The ideas left untried at the end of the second
session, one at a time. `holdout3` had informed nothing yet at the start, but
its misses were then used, so a fourth set, `holdout4`, was written while the
first change was being measured and committed before its first run. **Its
numbers are the result.**

### What was tried

| # | Change | Measured effect |
|---|---|---|
| 5 | Titled names with an apostrophe after one letter ("O'Shaughnessy") are matched whole | Fixes the known bug |
| 6a | Second pass picks from the marked items instead of writing free text | Hid 100% on three sets, but kept only 82% to 88% of useful facts: asked "which of these are personal?", the model says yes to nearly everything, organisations included. Not kept as the default |
| 6b | Second pass gives every marked item one label (person, address, personal number, organisation, place, other); only personal labels are hidden. The answer has a fixed size | `holdout3` 94.7% to 99.1% hidden, 96.7% kept; `holdout2` 99.3%, 97.5%; `holdout` 100%, 91.9%. Ten runs, all a pass. **Kept as the default** |
| 7 | The app shows the pattern results at once and adds the model's finds when they arrive; sending waits for the model | Patterns on screen after 0 to 4 ms |
| 8 | The time limit follows the machine (five times its usual call, 15 s to 2 min); a first pass over 20 s skips the second pass | With Chrome's CPU backend forced: 22 s a letter instead of 5 s, no call cancelled, same accuracy |
| 9 | An item labelled personal is dropped when its name holds an organisation word ("Heating", "Plan", "Payment") | `holdout` kept 91.9% to 97.6% |

Not tried: sending only the marked lines to the second pass, a names list for
lower-case text, a vote over two first passes. Free-text review and
pick-from-list are still in the code behind `VITE_PASS2`, for comparison.

### Current numbers

| Set | Runs | Subject hidden | Subject hidden or flagged | Others hidden | Useful facts kept | Median per letter |
|---|---|---|---|---|---|---|
| **`holdout4`, never tuned on** | 5 | **97.4% (95.7 to 97.8)** | 97.8% | 93.3% | **100%** | 5.0 to 5.8 s |
| `holdout3` | 3 | 100% | 100% | 100% | 99.3% (97.8 to 100) | 5.3 s |
| `holdout` | 3 | 100% | 100% | 100% | 97.6% | 6.4 to 7.2 s |
| Tuning set (12 letters) | 3 | 100% | 100% | 100% | 98.7% (98.0 to 100) | 5.2 to 6.1 s |

All fourteen of those runs are a pass. With no model at all, on `holdout4`:
52.2% of subject details hidden, 97.8% hidden or flagged, 100% of useful facts
kept, about 13 underlines a letter.

End-to-end run: nine checks passed, one cloud call, no personal detail in the
request body, patterns on screen 4 ms after the click.

### A weaker machine

`CHROME_FEATURES=OnDeviceModelForceCpuBackend npm run eval` makes Chrome run
the model on the CPU. On this 8-core Ryzen that took 17 to 31 s a letter
(median 22 s) against about 5 s on the GPU. An older 4-core laptop will be
slower than that; it was not measured. `--disable-gpu` does not move the model
off the GPU, so it is no test.

### Open weak points

- **Two details in `holdout4` were neither hidden nor marked, in every run.**
  A surname typed in lower case in a chat ("mr pettigrew", "pettigrew
  lettings"), and a Canadian postcode ("H2X 3J6": the mark for mixed codes
  needs four characters and each half has three). Left unfixed so the set
  stays a clean test.
- **Lower-case text in general.** Patterns and marks lean on capital letters.
- **Speed on ordinary machines.** 22 s a letter on a fast CPU. Below Chrome's
  minimum there is no model and the user gets patterns plus underlines.
- **Noise in the marks.** About 7 underlines a letter with the model, 13
  without, organisation names and headings among them.
- **The test itself.** One machine, one Chrome version, English, 52 fictional
  letters written by the same author as the patterns. A pass on 46 subject
  details is a small sample: one more miss a run would be a fail.

## Speed (fourth session)

Same machine and Chrome. The aim was a faster scrub without losing the pass.

### Where the time in a call goes

`node scripts/run-probe.mjs` streams each on-device call, so it gives the time
to the first output and the time to the end. Medians of five, GPU:

| Call | Characters in | Characters out | First output | Total |
|---|---|---|---|---|
| Very first call after the page opened | 2 | 1 | 9.3 s | 9.3 s |
| One word in, one character out | 2 | 1 | 1.9 s | 1.9 s |
| One page in, one character out | 1,177 | 1 | 1.8 s | 1.8 s |
| 4,000 characters in, one character out | 3,974 | 1 | 2.0 s | 2.0 s |
| One word in, 400 characters out | 6 | 400 | 1.8 s | 3.1 s |
| The old first pass (entity list) | 1,177 | 611 | 1.8 s | 4.8 s |
| The old label pass | 1,219 | 66 | 1.8 s | 2.1 s |

- **Every call costs about 1.8 s before it writes anything, whatever it
  reads.** Reading a page adds almost nothing.
- **Writing costs about 3 to 5 ms a character.** The old first pass spent
  3 s writing its list.
- Two calls at once take as long as one after the other (3.8 s against 3.9 s).
- A one-off check with Chrome's API directly (not in the repo) showed that
  the 1.8 s belongs to a new session: a second prompt on the same session, or
  on a clone of it, took about 0.1 s. The Firebase SDK opens a new session
  for every call and offers no way to reuse one, so within the rules the
  only lever is fewer calls and shorter answers.

### What was tried

Measured on the older sets (`holdout3` unless noted), which are development
sets now.

| Plan (`VITE_PLAN`) | Subject hidden | Useful facts kept | Median per letter |
|---|---|---|---|
| `two`: entity list, then labels (the third session's scrub) | 100% | 99.3% | 5.3 s |
| `one-letters`: no first pass, one letter per marked item | 83.0% | 91.1% | 1.8 s |
| `one-lines`: the same, reading only the lines the items sit on | 84.0% | 90.0% | 2.0 s |
| `two-lines`: entity list, then letters on lines | 95.3% | 91.1% | 4.9 to 6.2 s |
| `one-json`: no first pass, word labels | 89.9% | 100% | 2.6 to 3.0 s |
| `one-combined`, missed list of up to 12 objects | 100% | 97.8% | 4.4 to 6.0 s |
| **`one-combined`, missed list of up to 4 plain strings** | 96.2% | 98.5% | 3.3 to 3.7 s |

- One-letter answers are fast but label badly: names the word labels get
  right were left readable.
- Labels alone cannot hide what the marks do not catch (lower-case names).
- `one-combined` is one call that labels the marked items in words and then
  lists up to four things the marks missed. With a long list the model fills
  it with noise and the time goes back up; four plain strings is the version
  kept. On the other development sets it hid 99.0% (`holdout`), 100%
  (`holdout2`) and 100% (tuning set), nine runs out of nine a pass.
- Leaving the schema out of the model's input
  (`omitResponseConstraintInput`) halved what the old first pass wrote, so it
  changes what is found. It was not taken further.

### Result on a new clean set

`holdout5` (eight letters, one of them two pages) was written and committed
before its first run. `holdout4` is no longer clean: the new prompt mentions
lower-case names, a kind of miss first seen there. Five runs each:

| | `one-combined` (now the default) | `two` (before) |
|---|---|---|
| Subject details hidden | **99.6% (98.1 to 100)** | 98.9% (98.1 to 100) |
| Other people's details hidden | 89.5% (85.7 to 95.2) | 99.0% (95.2 to 100) |
| Useful facts kept | 97.0% (94.3 to 100) | 98.1% (94.3 to 100) |
| Runs that pass | 5 of 5 | 5 of 5 |
| One-page letter | **2.4 to 3.5 s** | 4.3 to 7.0 s |
| Two-page record (559 words) | **5.7 to 7.0 s** | 9.7 to 20.7 s |
| Calls cancelled for running too long | 0 | 2 |

End-to-end run with the new default: nine checks passed, no personal detail in
the cloud request, second scrub of the sample letter 2.5 s (5.4 s before).

### Also changed

- The app makes a one-character call as soon as the person touches the page,
  so the model is loaded before the first scrub. **Its effect was not
  measured**: the end-to-end script clicks at once, and its first scrub still
  took 11.7 s.
- A pasted document is scrubbed straight away, without a click.

### Open weak points after this session

- **Other people's names are hidden less often with one call** (89.5% against
  99.0%). On the two-page record a nurse's name was left readable, though
  underlined, in three runs of five.
- **Medical terms hidden by mistake on the two-page record**: "Penicillin" in
  three runs of five, "Type 2 diabetes mellitus" and "Metformin" in two. The
  two-call scrub did this as well.
- Lower-case names are still missed ("osman" in a text thread, every run).
- Speed on CPU was not measured again. Call count halved, so it should be
  near half the 22 s measured before; that is an estimate.
- Documents longer than two pages are still untested. Time still grows with
  each 4,000-character piece, at about 3 s a piece on a GPU.
- Still one machine, one Chrome version, English, 60 fictional letters by one
  author.
