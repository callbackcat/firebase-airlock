# Airlock speed work: results of the first round

Follow-up to `speed-brief.md`. It reports what happened when the brainstormed
plan was tried, in the plan's own order. Written 15 November 2026. Same
machine as before: 8-core Ryzen, GPU with about 8 GB VRAM, Windows 11,
Chrome 157, Firebase JS SDK 13.3.0.

## Headline

**A one-page letter now scrubs in about 3 seconds instead of 5.5, and a
two-page record in 6 to 7 seconds instead of 10 to 21, with the same pass
rate on a new clean set.** The scrub went from two on-device calls per piece
to one.

| On `holdout5` (8 unseen letters, 5 runs each) | One call (new default) | Two calls (before) |
|---|---|---|
| Subject's details hidden | 99.6% (98.1 to 100) | 98.9% (98.1 to 100) |
| Other people's details hidden | 89.5% (85.7 to 95.2) | 99.0% (95.2 to 100) |
| Useful facts kept | 97.0% (94.3 to 100) | 98.1% (94.3 to 100) |
| Runs that pass (95% hidden, 90% kept) | 5 of 5 | 5 of 5 |
| One-page letter | 2.4 to 3.5 s | 4.3 to 7.0 s |
| Two-page record, 559 words | 5.7 to 7.0 s | 9.7 to 20.7 s |
| Calls cancelled for running too long | 0 | 2 |

## Step 1: where the time goes (measured)

Each call was streamed through Firebase AI Logic, giving time to first output
and time to the end. Medians of five, GPU, model warm.

| Call | Chars in | Chars out | First output | Total |
|---|---|---|---|---|
| Very first call after the page opened | 2 | 1 | 9.3 s | 9.3 s |
| One word in, one character out | 2 | 1 | 1.9 s | 1.9 s |
| Same, with a long system prompt | 2 | 1 | 1.8 s | 1.8 s |
| One page in, one character out | 1,177 | 1 | 1.8 s | 1.8 s |
| 4,000 characters in, one character out | 3,974 | 1 | 2.0 s | 2.0 s |
| One word in, 400 forced characters out | 6 | 400 | 1.8 s | 3.1 s |
| Old first pass (JSON entity list) | 1,177 | 611 | 1.8 s | 4.8 s |
| Old label pass (JSON labels) | 1,219 | 66 | 1.8 s | 2.1 s |
| Label pass, one letter per item | 1,219 | 4 | 1.9 s | 1.9 s |
| Label pass, lines only, one letter per item | 218 | 4 | 1.9 s | 1.9 s |

What this settles:

- **Fixed cost dominates: about 1.8 s per call before any output**, the same
  for 2 characters or 4,000. The brainstorm's guess that writing dominates was
  half right: it does for the old first pass (3 s of writing), not elsewhere.
- **Reading is nearly free.** 4,000 characters cost about 0.2 s more than 2.
  So "send context lines, not the piece" saves nothing on this machine.
- **Writing costs about 3 ms a character free-form, about 5 ms in JSON.**
- **A long system prompt costs nothing measurable.**
- **Parallel calls do not help**: two at once 3.8 s, back to back 3.9 s.

A one-off check with Chrome's API directly (diagnostic, not in the repo)
split the 1.8 s:

| Step | Time |
|---|---|
| `availability()` | 0 ms |
| `create()` with no system prompt | 1 to 7 ms |
| First `prompt()` on that new session | 1.6 to 2.0 s |
| `create()` with a system prompt | 1.6 to 1.9 s |
| First `prompt()` on that session | about 125 ms |
| Second `prompt()` on the same session | about 75 ms |
| `clone()` | 0 ms |
| `prompt()` on a clone | about 70 ms |

**So the 1.8 s is the price of a new session, paid once per session, and a
reused or cloned session answers in about 0.1 s.** The Firebase SDK calls
`LanguageModel.create()` for every `generateContent` and exposes no reuse or
clone. Under the hackathon rule (every model call through Firebase AI Logic,
no raw `LanguageModel` call) that 1.8 s per call cannot be removed, only paid
fewer times.

## Steps 3 to 5: fewer and shorter calls

Measured on older sets, which are development sets (`holdout3` shown).

| Variant | Subject hidden | Useful facts kept | Median per letter |
|---|---|---|---|
| Two calls: entity list, then word labels (baseline) | 100% | 99.3% | 5.3 s |
| One call, no first pass, one letter per item | 83.0% | 91.1% | 1.8 s |
| Same, reading only the items' lines | 84.0% | 90.0% | 2.0 s |
| Two calls, second one as letters on lines | 95.3% | 91.1% | 4.9 to 6.2 s |
| One call, no first pass, word labels (JSON) | 89.9% | 100% | 2.6 to 3.0 s |
| One call: word labels + "missed" list, up to 12 objects | 100% | 97.8% | 4.4 to 6.0 s |
| **One call: word labels + "missed" list, up to 4 strings** | 96.2% | 98.5% | 3.3 to 3.7 s |

What was learned:

- **One-letter labels are fast but wrong too often.** Names that word labels
  ("PERSON", "ORGANISATION") get right were left readable. The regex
  constraint works; the model just labels worse with letters.
- **Labels alone hit the marker's ceiling.** With no first pass, a lower-case
  name that code does not underline can never be hidden.
- **The kept design ("one-combined")**: one call gets the masked piece and the
  numbered list of underlined items. It returns a word label for each item,
  then a short list of personal details that are not on the list. The cap of
  four plain strings matters: with twelve objects the model filled the list
  with noise (amounts, ordinary words) and the time went back to 4 to 6 s.
- **Schema left out of the input** (`omitResponseConstraintInput`): on the old
  first pass it halved the output (611 to 308 characters), meaning fewer
  entities found. It changes behaviour, not just cost. Not pursued.
- On the other development sets the kept design hid 99.0%, 100% and 100%,
  all nine runs a pass, at 2.9 to 4.4 s a letter.

## Step 2: warm-up and scrub on paste

Both are in the app. A one-character call fires on the first touch of the
page, and a paste starts the scrub without a click. **The gain is not
measured**: the end-to-end script clicks immediately, so its first scrub was
still 11.7 s. The probe's cold call took 9.3 s, which is what the warm-up
should move out of the way.

## Not done yet

- **Step 6, deduplicate across a long document.** Still one call per
  4,000-character piece, about 3 s each. A 20-page record would take roughly
  a minute on GPU (estimate). Since reading is nearly free, bigger pieces or
  one labelling call for the whole document's unique items look promising.
- **CPU timing of the one-call scrub.** The two-call scrub took about 22 s a
  letter on CPU. Half the calls suggests about half the time; not measured.
- **Widening the marker** for lower-case names and non-UK postcodes.

## Weak points now

- **Other people's names: 89.5% hidden against 99.0% with two calls.** On the
  two-page record a nurse's name stayed readable (but underlined) in three
  runs of five.
- **Medical terms hidden by mistake on the two-page record**: "Penicillin"
  three runs of five, "Type 2 diabetes mellitus" and "Metformin 1 g twice a
  day" two of five. The two-call scrub did the same. For a medical tool this
  matters more than the kept-facts average suggests.
- **Lower-case names**: "osman" in a text thread was missed in every run and
  not underlined.
- **About 10 underlines a letter** on this set.
- Sample size: 53 subject details, one machine, one Chrome version, English,
  fictional letters by one author.

## Questions for the next brainstorm

1. The floor is about 1.9 s per call and the scrub is at about 3 s per piece.
   Is the remaining second (writing about 150 to 250 characters of JSON
   labels) worth attacking, for example with shorter label words or an array
   in place of numbered keys, given that letters hurt accuracy?
2. For long documents, what is the best split: large pieces (how large before
   accuracy drops or the context window is hit), or patterns and marks over
   the whole document followed by one labelling call per 40 unique items with
   their lines?
3. How to stop medical vocabulary ("Penicillin", "Metformin") being labelled
   as personal, without a hand-written list of medicines?
4. How to recover other people's names in long documents with a single call?
5. Is asking Firebase for session reuse or cloning on-device worth raising as
   SDK feedback? It would cut a call from about 1.9 s to about 0.1 s plus
   writing.
6. What should the CPU-only experience be, now that a one-page scrub is
   probably around 10 s there?
