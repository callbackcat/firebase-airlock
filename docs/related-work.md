# Related work

Airlock's idea is not new. Detecting personal details on the device, sending
placeholders to a cloud model and restoring the answer locally has been built
several times. This page says what Airlock shares with that work and the
narrow thing it adds.

Numbers below were re-checked against each paper's abstract on 16 November
2026. Where a figure in `archive/research-notes.md` could not be confirmed from the
abstract, it is left out here.

## Earlier systems

| System | What it did | What its abstract reports |
|---|---|---|
| Hide and Seek (2023), [arXiv 2309.03057](https://arxiv.org/abs/2309.03057) | Two small local models: one hides entities, one restores them in the answer | Not re-checked |
| Casper (2024), [arXiv 2408.07004](https://arxiv.org/abs/2408.07004) | A browser extension: rules, an entity model, then a local model for sensitive topics | Not re-checked |
| Rescriber (CHI 2025), [arXiv 2410.11876](https://arxiv.org/abs/2410.11876) | A browser extension where a smaller on-device model (Llama3-8B) detects personal details, the user chooses what to replace, and placeholders are restored locally | A study with 12 people: users' subjective view of the on-device model was "on par" with GPT-4o, and "comprehensiveness and consistency" of detection decided how much they trusted it |
| PAPILLON (NAACL 2025), [arXiv 2410.17127](https://arxiv.org/abs/2410.17127) | A local model rewrites the request before a cloud model sees it | High response quality kept for 85.5% of queries, with privacy leakage held to 7.5% |
| Philter (2020), [npj Digital Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC7156708) | Rules that remove everything in a clinical note not known to be safe, with a statistical step to recover precision | Not re-checked; the design is what matters here |

## What Airlock shares with them

- **The round trip.** Placeholders out, real values back, on the device. This
  is the same as Hide and Seek and Rescriber.
- **A person in the loop.** Like Rescriber, the reader sees what will leave
  and can change it.
- **Hide by default.** Since round 3 Airlock hides everything that could be
  personal the moment text is pasted, and uses the model only to put safe
  things back. That is Philter's design, applied to letters.
- **The known weaknesses.** Published results on text the authors did not
  write are well below results on their own data. Ours follow the same
  pattern: see `archive/results-round-2.md` for the gap.

## What is particular to Airlock

- **Nothing to install and no model to host.** It runs on the model already
  inside Chrome, through Firebase AI Logic hybrid inference: the scrub is
  pinned to the device, the answer comes from the cloud, and the split is the
  product.
- **The model cannot cause a leak by failing.** The text is safe before the
  model is asked anything. A slow, wrong or absent model costs useful detail,
  not privacy.
- **Letters and records, with the facts kept.** The benchmark counts what was
  hidden and also what a useful answer needs: amounts, deadlines, diagnoses
  and doses.

## What it does not claim

It reduces what is shared. It does not make a person anonymous: a town, an
employer and a diagnosis left readable can identify someone. Nothing here was
measured on real documents.
