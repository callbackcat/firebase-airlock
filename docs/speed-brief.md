# Airlock: results so far and the speed problem

A brief for a fresh brainstorming session. It is self-contained: nothing else
needs to be read first. Written 15 November 2026.

## What Airlock is

A web app (Chrome) that sits between a person and a cloud AI model. The person
pastes a letter (medical, tax, landlord, bank) and asks a question about it.

1. **Scrub, on the device.** Personal details are found and replaced with
   placeholders such as `[PERSON_1]`, `[ADDRESS_1]`, `[ID_NUMBER_2]`.
2. **Review.** The person sees the text that will be sent, with anything
   suspicious that is still readable underlined. One click hides an item.
3. **Ask, in the cloud.** Only the scrubbed text goes to the cloud model.
4. **Restore, on the device.** Placeholders in the answer are swapped back.

It is an entry for the #BuildHybridAI 2026 hackathon (Firebase AI Logic hybrid
inference for Web).

## Constraints that cannot change

- **Every model call goes through Firebase AI Logic** (`firebase/ai`, JS SDK
  13.3.0). No other provider, no direct Gemini API, no raw `LanguageModel`
  call. This is a hackathon rule.
- **The scrub model is `ONLY_ON_DEVICE`**: Gemini Nano inside Chrome. It must
  never fall back to the cloud, and unredacted text must never leave the
  machine.
- The cloud model is `gemini-3.5-flash-lite`, `ONLY_IN_CLOUD`.
- No new runtime dependencies without a good reason. TypeScript, no framework.

## The problem to brainstorm

**The on-device scrub is too slow.**

| Case | Time | Measured? |
|---|---|---|
| Fixed patterns on screen | 0 to 4 ms | yes |
| One-page letter, model warm, GPU | about 5.5 s (3.5 to 7 s) | yes |
| One-page letter, first document after opening the page, GPU | 12 to 16 s | yes |
| One-page letter, CPU only | about 22 s (17 to 31 s) | yes, with Chrome's CPU backend forced on a fast 8-core CPU |
| Five-page document, GPU | about 25 to 30 s | **no, extrapolated** |
| Twenty-page record, GPU | about 2 minutes | **no, extrapolated** |
| Twenty-page record, CPU | about 7 to 8 minutes | **no, extrapolated** |
| First use ever (Chrome downloads the model) | unknown, a large one-off download | no |
| Cloud answer | a few seconds | no, not recorded by the harness |

The goal: a scrub that feels quick on an ordinary laptop, and does not grow
linearly into minutes for a multi-page document, **without dropping below the
accuracy pass mark** (95% of the subject's details hidden, 90% of useful facts
kept).

## How the scrub works now

Text is cut into pieces of at most 4,000 characters (a little over a page),
on paragraph breaks. Pieces are processed **one after another**. For each
piece:

1. **Patterns (regex), a few milliseconds.** Emails, card numbers (Luhn),
   bank accounts, NHS and NI numbers, labelled references ("Ref:", "No.",
   "ID"), titled names ("Dr …", "Ms …"), kinship names ("my daughter …"),
   sign-off names, street addresses, UK postcodes, phones, dates of birth,
   vehicle registrations, and bare codes (6+ digits, or capitals with 4+
   digits).
2. **Model pass 1, on device.** A system prompt plus the whole piece. The
   model writes a JSON list of entities `{kind, value}`, constrained by a JSON
   schema (at most 40 items, value at most 80 characters). One retry on
   failure.
3. **Review marks, a few milliseconds.** After hiding everything found so
   far, code flags what still looks personal: capitalised words that are not
   ordinary words or sentence openers, and long or mixed codes.
4. **Model pass 2, on device ("label").** The masked piece plus a numbered
   list of the marked items. The model returns one label per item (person,
   address, personal number, organisation, place, other) as a fixed-size JSON
   object. Personal labels are hidden. Items containing an organisation word
   ("Clinic", "Council", "Plan") are never hidden.

So each piece costs **two on-device calls in sequence**, each of which
re-reads the whole piece.

Around this:

- Pattern results are shown at once; the model's finds are merged in when they
  arrive. Sending is disabled until the model is done.
- Each call has a time limit of five times the machine's usual call (15 s to
  2 min). If pass 1 takes over 20 s, pass 2 is skipped and the person is told
  to check the underlines.
- With no model at all, the person gets patterns plus underlines and must
  confirm they have checked the text.

## What is known about the on-device model through this SDK

- The Firebase SDK **creates a new on-device session for every call**. There
  is no session reuse or cloning exposed.
- It ignores the request `signal`; real cancellation only works by setting
  `onDeviceParams.promptOptions.signal`.
- `promptOptions.responseConstraint` (a JSON schema) is passed through to
  Chrome and is honoured, including `maxItems`.
- No temperature or top-K control is exposed.
- `CHROME_FEATURES=OnDeviceModelForceCpuBackend` forces CPU inference.
  `--disable-gpu` does not.
- Not known: how much of a call is session creation, prompt reading or
  writing the answer. **No breakdown was measured.** Not known either: whether
  Chrome runs two on-device calls in parallel usefully.

## Accuracy results (so the speed work has a baseline to protect)

Test data: 52 fictional letters written for this project (medical, tax,
housing, banking, school, travel, group chat). A 12-letter tuning set and
four hold-out sets of 8. A hold-out set stops counting as clean once its
misses inform a change, so a new one was written each time. `holdout4` has
only ever been measured.

| Set | Runs | Subject's details hidden | Useful facts kept | Time per letter (GPU) |
|---|---|---|---|---|
| **`holdout4`, never tuned on** | 5 | **97.4% (95.7 to 97.8)** | **100%** | 5.0 to 5.8 s |
| `holdout3` | 3 | 100% | 99.3% | 5.3 s |
| `holdout` | 3 | 100% | 97.6% | 6.4 to 7.2 s |
| Tuning set | 3 | 100% | 98.7% | 5.2 to 6.1 s |

All fourteen runs pass. Other people's details in `holdout4`: 93.3% hidden.

How accuracy and time moved together:

| Configuration | Hidden, unseen letters | Time per letter |
|---|---|---|
| Patterns only, no model | 52.2% hidden, 97.8% hidden or underlined | milliseconds |
| Patterns + one model pass (start of the day) | 86.4% (77.6 to 91.8), 0 of 3 runs pass | about 3.5 s |
| + more patterns + free-text second pass | 94.7% (88.7 to 100), 3 of 5 pass | about 6 s |
| + label second pass (current) | 97.4%, 5 of 5 pass | about 5.5 s |

Two things follow. The second pass is what gets it over the pass mark. And
patterns plus underlines already cover nearly everything; what the model adds
is doing the hiding **automatically** instead of leaving about 13 underlines a
letter for the person.

## What was tried, speed-related

| Tried | Result |
|---|---|
| Show patterns at once, model results later | Kept. Perceived wait drops; real wait unchanged |
| Real cancellation and schema caps on output | Kept. Ended runaway calls (one took 165 s) |
| Adaptive time limit; skip pass 2 on slow machines | Kept. No cancelled calls on CPU |
| Second pass as "pick the personal ones from a list" | Rejected: over-hid, only 82 to 88% of useful facts kept |
| Second pass as free text | Replaced by labels: slower and less accurate |
| A cloud-side classifier for the decision step | Rejected: breaks the on-device rule |

## Not tried yet

- Sending **only the lines that contain a marked item** to pass 2, instead of
  the whole piece.
- Running pieces, or the two passes, **in parallel**.
- **Warming the model** when the page opens, so the first scrub is not 12 s.
- **Dropping pass 1** and using only patterns + labels (one call, fixed-size
  output).
- Having the model answer with **item numbers or labels only** in pass 1 too,
  so it writes less.
- Smaller pieces, or skipping pieces where patterns leave no marks.
- Scrubbing **in the background** as soon as text is pasted, before the click.
- A names list for lower-case text; a vote over two first passes (these are
  accuracy ideas, and would cost time).

## Known weak points besides speed

- Lower-case text: a surname typed in lower case in a chat and a Canadian
  postcode were neither hidden nor underlined in any run.
- About 7 underlines a letter with the model, organisation names and headings
  among them.
- The test is small: one machine (8-core Ryzen, GPU with about 8 GB VRAM,
  Windows 11, Chrome 157), English only, letters written by the same author
  as the patterns. No multi-page document was ever tested, for speed or
  accuracy.

## Questions for the brainstorm

1. Where does the time in one on-device call go, and how can that be measured
   through the Firebase SDK?
2. Can the scrub be made one call per piece, or less than one, and stay above
   95%?
3. How should a 20-page record be handled so the wait does not grow with
   every page?
4. What is an acceptable experience on a CPU-only laptop: a slower full
   scrub, or patterns plus underlines with the model as an optional extra?
5. Is there any way within Firebase AI Logic to keep a session warm or reuse
   the system prompt between calls?
