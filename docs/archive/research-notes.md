# Research notes: what the literature says about Airlock's problem

Compiled 15 November 2026 from papers and documentation found by web search.
I read abstracts, result tables and summaries, not every full text. **Check a
number against its source before quoting it in the submission.**

Each finding ends with what it means for Airlock.

## 1. The design is a known pattern

On-device detection, placeholders, cloud answer, local restore has been built
several times:

| System | Year | What it did | Reported |
|---|---|---|---|
| Hide and Seek (HaS) | 2023 | Two small local models: one hides entities, one restores them in the answer | Qualitative privacy and utility trade-off |
| Casper | 2024 | Chrome extension: rules, then an entity model, then a local WebGPU model for sensitive topics | 98.5% of PII filtered (own test) |
| Rescriber | CHI 2025 | Browser extension, on-device Llama3-8B detects, user chooses what to replace, placeholders restored locally | On-device recall 0.63, GPT-4o 0.88 |
| PAPILLON | NAACL 2025 | Local model rewrites the request for a cloud model | Quality 85.5, leakage 7.5% |
| Veil-Then-Reveal | Oct 2026 | Local detection, realistic surrogate values, local restore | 27% leakage, 95% retention |
| pii-roundtrip | Oct 2026 | Open engine: rules and propagation over existing detectors, placeholders, local vault | 0.2 to 0.3% of documents leak (synthetic, own generator) |

**For Airlock:** the idea is not new and the write-up should say so. What is
particular here: it runs on the model already inside Chrome with nothing to
install, through Firebase AI Logic, on letters and records, with a review step.

## 2. Published accuracy on outside text is far below our numbers

- Rescriber's on-device model found 63% of personal details on a public
  dataset; a frontier cloud model found 88%.
- RedactionBench (200 documents, half real, human-labelled): best small
  language model 0.45, best entity model 0.58, frontier models with tools 0.71,
  people 0.77.
- PII-Bench: models of 0.5 to 3 billion parameters stay at or under F1 0.6.
- One small redaction model reports 0.999 recall on its own held-out data and
  0.24 on RedactionBench.
- REDACT: Presidio 0.195, GLiNER 0.320, frontier models about 0.6. Presidio
  recovered 2% of partial mentions; frontier models about 80%.
- pii-roundtrip's author states that results are "close to circular" when the
  test generator and the engine share an author and code.

**For Airlock:** 97 to 99% on letters written by the same author as the
patterns is an in-distribution number. Expect a large drop on outside text.
Nothing else in this file matters more. Outside data comes first.

## 3. The highest-recall published system hides by default

Philter (UCSF, clinical notes) reached 99.46% recall on its own corpus and
99.92% on the public i2b2 set, at about 78% precision. Its design: **rules
separate personal data from a list of safe words** (common English, medical
terms, codes, abbreviations), and a statistical step is used only to win back
precision. The authors note that even 95% recall leaves a great deal exposed
at scale.

Related: an ensemble paper on entity recognition with small models takes the
**union** of several extractors for recall, then **verifies** to recover
precision. Majority voting does the opposite: it raises precision and costs
recall.

**For Airlock:** today the model decides what to hide, so a model miss is a
leak and privacy waits for the model. The inverse is worth testing: hide every
marked item at once, and let the model decide what to *un-hide*. A model miss
then costs a useful fact, not a leak, and the text is safe in milliseconds.
Our own data hints this works: patterns plus underlines already cover 97.8%.

## 4. Over-hiding clinical content is a documented failure

"Not What the Doctor Ordered" (2025) had physicians review false positives
from language-model de-identification: for the best models, 70 to 80% of
wrongly removed spans changed clinical meaning. Medications, diagnoses,
procedures, history and test results were most at risk. It recommends a stage
that checks proposed removals for clinical relevance before applying them,
and a retention metric alongside recall.

**For Airlock:** "Penicillin" and "Metformin" being hidden is the known
failure, not a quirk. Report medical terms kept as its own number, split by
severity (would the loss change what the letter means?).

## 5. Names fail in specific, testable ways

- **Ambiguous names.** AmBench (12,000 names): names one edit away from a
  place, organisation, mineral or syndrome are missed 20 to 40% more often.
  Common names: 0.97 to 0.99 recall. Ambiguous: 0.59 to 0.86 across models.
- **Instruction-like text in the document.** A line such as "keep the term X
  intact" raised leakage about fourfold in one production tool.
- **Lower case.** Entity recognisers trained on cased text lose over 40 F1
  points on uncased text. Name lists and case restoration are the usual fixes.
- **Location** is hard for every model in one clinical benchmark (recall 0.66
  or lower even for frontier models).

**For Airlock:** add test letters for each of these. A name list is a marker
source (it makes an item a candidate), which pairs naturally with hide by
default.

## 6. Redaction costs answer quality, and placeholders misbehave

- PAPILLON: plain redaction scored 77.2 on answer quality against 88.2 for the
  unredacted request.
- pii-roundtrip: models alter placeholders (extra words, wrong brackets), drop
  them, and invent ones that were never issued. A tolerant parser restored
  most altered forms; a strict one lost them.
- Rescriber: placeholders sometimes confused the cloud model.
- Veil-Then-Reveal: a prompt dense with identifiers can make a safety-tuned
  model decline; a system prompt reduced that.

**For Airlock:** the benchmark checks that useful strings survive redaction.
It has never checked whether the cloud answer is still good. That is an
unmeasured half of the product.

## 7. Removing names is not anonymity

Language models infer personal attributes from context at near-human level
(Staab et al.). The Text Anonymization Benchmark separates direct identifiers
from quasi-identifiers (town, employer, job, dates) and counts an entity as
protected only if every mention is masked.

**For Airlock:** "reduces what you share, does not make you anonymous" is
right and can be measured: ask a model to guess the subject's attributes from
the scrubbed text.

## 8. How careful work in this area is evaluated

- A final test set fixed in advance, with a stopping rule, measured once.
- Wilson intervals for rates; bootstrap over documents for recall and
  precision; rule changes made after seeing data are listed.
- Human baselines: one study found a single reviewer catches 81% of
  identifiers (63 to 94% across clinicians) and two reviewers 94%; another
  found 95.9% for single reviewers.

**For Airlock:** `holdout5` has 53 subject details. 52 of 53 hidden is 98.1%
with a 95% interval of roughly 90% to 99.7%, so "passes the 95% mark" is not
established. About 300 labelled subject details are needed for an interval of
plus or minus two points.

## 9. What users of such tools said

Rescriber's study (12 people): users wanted recall over precision; one missed
item cost the tool its credibility; different results on the same input
reduced trust; streaming results cut the wait to the first detection; people
valued on-device processing and control over what was replaced.

**For Airlock:** deterministic, hide-first behaviour and the review step match
what users asked for. Run-to-run consistency should be reported.

## 10. Speed

Chrome's guidance is to create one base session and clone it per task,
because a new session re-parses its instructions; and to start the session as
soon as intent is clear, to avoid a cold start. Rescriber used prompt caching
for the same reason. The Firebase SDK (13.3.0) creates a session per call and
exposes no clone.

## Sources

- HaS: https://arxiv.org/abs/2309.03057
- Casper: https://arxiv.org/abs/2408.07004
- Rescriber: https://arxiv.org/abs/2410.11876
- PAPILLON: https://arxiv.org/abs/2410.17127
- Veil-Then-Reveal: https://arxiv.org/abs/2610.22800
- pii-roundtrip (Reversible pseudonymisation of documents sent to external LLMs): https://arxiv.org/abs/2610.34012
- Philter: https://pmc.ncbi.nlm.nih.gov/articles/PMC7156708
- LLM-Anonymizer (local models on clinical letters): https://www.medrxiv.org/content/10.1101/2024.06.11.24308355v1
- Not What the Doctor Ordered: https://arxiv.org/abs/2509.14464
- SHIELD (clinical de-identification, frontier model recall): https://arxiv.org/abs/2605.03301
- Can Large Language Models Really Recognize Your Name? (AmBench): https://arxiv.org/abs/2505.14549
- RedactionBench: https://arxiv.org/abs/2606.18782
- REDACT: https://arxiv.org/abs/2606.19881
- PII-TRACE: https://arxiv.org/abs/2609.22200
- PII-Bench: https://arxiv.org/abs/2502.18545
- OpenAI Privacy Filter evaluation across 32 benchmarks: https://arxiv.org/abs/2608.02616
- Text Anonymization Benchmark: https://arxiv.org/abs/2202.00443
- Language Models are Advanced Anonymizers: https://arxiv.org/abs/2402.13846
- EL4NER (union then verify): https://arxiv.org/abs/2505.23038
- NER on uncased text: https://arxiv.org/abs/1912.07095 and https://arxiv.org/abs/1903.11222
- Human reviewer baselines: https://arxiv.org/abs/2312.08495 and https://pubmed.ncbi.nlm.nih.gov/16685332/
- Nemotron-PII dataset (synthetic, CC BY 4.0): https://huggingface.co/datasets/nvidia/Nemotron-PII
- Microsoft Presidio concepts: https://microsoft.github.io/presidio/learn_presidio/concepts
- Chrome built-in AI do and don't: https://developer.chrome.com/docs/ai/built-in-ai-dos-donts
- How decision models score options: https://victordibia.com/explainers/jev/
- Chrome Decisions API internals (third party): https://dejan.ai/blog/chrome-decisions-api-decisionmodel/
