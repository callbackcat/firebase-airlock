# Benchmark: first run against a real on-device model

**Verdict: works with the changes made, as a way to reduce what is shared, not as a guarantee.**
The hybrid mechanism works end to end on a real machine. On the letters used
for tuning the scrub now hides 98.5% of the subject's details. On eight new
letters it had never seen it hides 86.4%, with one run in three below 80%.
The second number is the honest one, and it is marginal, not a pass.

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
