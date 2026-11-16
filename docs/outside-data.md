# Outside test data

Text the authors of Airlock did not write, used to check the scrub step on
documents it has never seen. The data is downloaded at test time into
`outside-data/`, which is git-ignored. Nothing from the dataset is committed,
and this file holds no document text.

## How to get it

```bash
pip install pyarrow        # once
python scripts/fetch-outside.py
```

The script makes one anonymous download from huggingface.co (about 151 MB, the
test split parquet, checked against a pinned SHA-256), then writes:

| File | What |
| --- | --- |
| `outside-data/raw/test-00000-of-00001.parquet` | the downloaded split |
| `outside-data/outside-dev.json` | 50 documents, for tuning |
| `outside-data/outside-final.json` | 100 documents, for the final number only |
| `outside-data/stats.json` | counts, no text |
| `outside-data/SOURCE.md` | source, revision, licence, date, seed, counts |

It is a Python script, not `.mjs`, because Node has no parquet reader without
a new dependency. Running it twice gives byte-identical JSON files (checked).

`outside-final.json` is held back. Do not read it, tune on it, or paste from
it. Report counts and scores only.

## The dataset

**Nemotron-PII** by NVIDIA: <https://huggingface.co/datasets/nvidia/Nemotron-PII>

Synthetic documents written by a language model around made-up personas
(NVIDIA NeMo Data Designer), with character-offset span labels for 55 kinds of
personal detail. The card says it is "fully synthetic and designed to avoid
real personal data", which fits rule 4 in `CLAUDE.md`.

- Revision used (commit sha): `b70ffaf5ff39e079776134c5bf4381f00a9fd1ed`
- File: `data/test-00000-of-00001.parquet`,
  SHA-256 `1a4b0512ecb5370f0992d29d0f9c07351e6de13f0d7ea33bb18cecb984780247`
- Fetched: 15 November 2026

### Licence, and how it was checked

CC BY 4.0. Checked on 15 November 2026 in two places, at the revision above:

1. The licence field in the card's front matter, line 2 of
   <https://huggingface.co/datasets/nvidia/Nemotron-PII/blob/b70ffaf5ff39e079776134c5bf4381f00a9fd1ed/README.md>:
   `license: cc-by-4.0`. The Hub API
   (<https://huggingface.co/api/datasets/nvidia/Nemotron-PII>) returns the same
   value in `cardData.license` and the tag `license:cc-by-4.0`. The dataset is
   not gated.
2. The card's "License/Terms of Use" section, line 39 of the same file: "This
   dataset is licensed under the Creative Commons Attribution 4.0
   International License (CC BY 4.0) available at
   https://creativecommons.org/licenses/by/4.0/legalcode."

CC BY 4.0 allows use, copying and adaptation for any purpose with attribution.
We do not redistribute the data. If results are published, credit "NVIDIA,
Nemotron-PII" and say the labels were regrouped.

### Structure

Splits: `train` and `test`. We use `test` only.

Columns: `uid`, `domain`, `document_type`, `document_description`,
`document_format`, `locale`, `text`, `spans`, `text_tagged`.

| Field | Values in the test split |
| --- | --- |
| `document_format` | `unstructured` 50,578 rows, `structured` 49,422 rows |
| `locale` | `us` 50,000 rows, `intl` 50,000 rows |
| `document_type` | 1,466 different types |
| `spans` | a string holding a list of `{start, end, label, text}` |

There are no `en_*` locale codes. The whole dataset is English (`language: en`
on the card); `locale` only says whether names, addresses and number formats
follow US or international conventions. We take both.

## Selection rule

Seed `20261115`. From the test split:

1. `document_format` is `unstructured` (free text, not forms or tables).
2. `locale` is `us` or `intl`.
3. The text is 400 to 6,000 characters long.
4. The document has at least one direct identifier (see the mapping below).
5. Order. Each document gets the key `sha256("20261115:<locale>:<uid>")` and
   each document type the key `sha256("20261115:type:<document_type>")`.
   Types are sorted by key, documents inside a type by key, and documents are
   taken round-robin, one per type per round, until there are 150. A hash
   order is used in place of a library shuffle so the result does not depend
   on the Python version.
6. The first 50 are `outside-dev`, the other 100 are `outside-final`.

38,030 documents in 1,458 types pass steps 1 to 3. Because there are more
types than documents needed, every one of the 150 has a different type. 13
documents were skipped at step 4 and replaced by the next in order.

## File shape

Each file is a JSON array. It follows `Fixture` in `src/eval/fixtures.ts`,
with two additions: `label` on each gold entry and a `quasi` list.

```
{ "id": "out-dev-001", "title": "<document_type>", "text": "...",
  "gold": [{ "kind": "<KIND>", "value": "<span text>", "who": "subject", "label": "<dataset label>" }],
  "keep": [], "quasi": ["<span text>", ...] }
```

- `gold`: the direct identifiers, one entry per different value in a document.
  The value is the document text between the span offsets, so
  `text.includes(value)` always holds (checked in Python and again in Node).
- `quasi`: quasi-identifier values, one per different value. A value that is
  also a direct identifier in the same document is left out of `quasi`.
- `who` is always `subject`. The dataset does not say whose detail a span is.
- `keep` is empty. The dataset has no list of facts worth keeping, so these
  files cannot measure over-redaction the way the repo's own letters do.

## Label mapping

All 55 labels of the dataset occur in the 150 documents. "Dev spans" counts
every labelled span in the 50 dev documents; "dev gold" counts entries in
`gold` after removing repeats inside a document. Per-label counts for the
final set are not given on purpose.

### Direct identifiers (go into `gold`)

| Dataset label | Kind | Dev spans | Dev gold |
| --- | --- | ---: | ---: |
| `first_name` | PERSON | 41 | 24 |
| `last_name` | PERSON | 29 | 23 |
| `street_address` | ADDRESS | 5 | 5 |
| `postcode` | POSTCODE | 5 | 4 |
| `email` | EMAIL | 24 | 23 |
| `phone_number` | PHONE | 15 | 13 |
| `fax_number` | PHONE | 1 | 1 |
| `date_of_birth` | DOB | 9 | 9 |
| `ssn` | ID_NUMBER | 6 | 6 |
| `national_id` | ID_NUMBER | 1 | 1 |
| `tax_id` | ID_NUMBER | 1 | 1 |
| `medical_record_number` | ID_NUMBER | 4 | 4 |
| `health_plan_beneficiary_number` | ID_NUMBER | 8 | 7 |
| `certificate_license_number` | ID_NUMBER | 0 | 0 |
| `license_plate` | ID_NUMBER | 3 | 3 |
| `vehicle_identifier` | ID_NUMBER | 4 | 4 |
| `employee_id` | ID_NUMBER | 0 | 0 |
| `customer_id` | ID_NUMBER | 9 | 9 |
| `unique_id` | ID_NUMBER | 2 | 2 |
| `account_number` | ACCOUNT | 10 | 10 |
| `bank_routing_number` | ACCOUNT | 3 | 3 |
| `credit_debit_card` | CARD | 5 | 5 |
| `cvv` | CARD | 1 | 1 |
| `user_name` | OTHER | 14 | 10 |
| `password` | OTHER | 2 | 2 |
| `pin` | OTHER | 7 | 7 |
| `api_key` | OTHER | 7 | 5 |
| `http_cookie` | OTHER | 4 | 4 |
| `ipv4` | OTHER | 5 | 5 |
| `ipv6` | OTHER | 3 | 3 |
| `mac_address` | OTHER | 4 | 4 |
| `device_identifier` | OTHER | 1 | 1 |
| `biometric_identifier` | OTHER | 5 | 5 |

Dev gold by kind: PERSON 47, OTHER 46, ID_NUMBER 37, EMAIL 23, PHONE 14,
ACCOUNT 13, DOB 9, CARD 6, ADDRESS 5, POSTCODE 4. Total 204.

### Quasi-identifiers (go into `quasi`)

| Dataset label | Dev spans |
| --- | ---: |
| `date` | 26 |
| `date_time` | 5 |
| `time` | 6 |
| `company_name` | 19 |
| `occupation` | 16 |
| `employment_status` | 7 |
| `education_level` | 6 |
| `city` | 6 |
| `county` | 0 |
| `state` | 5 |
| `country` | 5 |
| `coordinate` | 4 |
| `age` | 2 |
| `gender` | 1 |
| `race_ethnicity` | 5 |
| `religious_belief` | 0 |
| `political_view` | 2 |
| `sexuality` | 2 |
| `language` | 9 |
| `blood_type` | 1 |
| `url` | 20 |
| `swift_bic` | 3 |

### Not personal

No dataset label falls here; every one of the 55 is a personal detail of some
kind. A label the script does not know is treated as not personal and listed
in `stats.json` (none at this revision).

### Judgement calls

- `bank_routing_number` is direct (ACCOUNT), to match the repo's own letters,
  where a sort code is gold. `swift_bic` names a bank, so it is quasi.
- `url` is quasi. The label does not say whether a link belongs to a person,
  and in the dev set the links are mostly company or public websites.
- `ipv4`, `ipv6`, `mac_address` and `device_identifier` are direct, though some
  will be a server's and not a person's. The label cannot tell them apart.
- `coordinate` is quasi, grouped with places. A home's coordinates would be
  as identifying as an address.
- `cvv` and `pin` are direct: short secrets that belong with a card or account.
- The sensitive categories (`race_ethnicity`, `religious_belief`,
  `political_view`, `sexuality`, `blood_type`) are quasi here because they do
  not single a person out alone. That is a statement about identifiability,
  not about how sensitive they are.

## Counts

| | outside-dev | outside-final |
| --- | ---: | ---: |
| Documents | 50 | 100 |
| Direct identifiers (`gold` entries) | 204 | 342 |
| Quasi-identifiers (`quasi` entries) | 134 | 311 |
| Labelled spans of all kinds, before removing repeats | 388 | 780 |
| Document types | 50 | 100 |
| Locale `us` / `intl` | 22 / 28 | 50 / 50 |
| Characters, shortest / median / longest | 414 / 620 / 2,404 | 408 / 701 / 2,144 |

Spans dropped because the value was empty or not found in the text: 0.

## Document types covered

150 different types, one document each, none shared between dev and final.
The dev types (these are dataset metadata, not document text):

Display Ad Specifications, Property Maintenance Request, Insurance Coverage
Terms, Health Insurance Enrollment Form, Investment Forecast, Author
Interview, Organ Donor Registration, Product Release Notes, System Design
Document, Loan Servicing, Benefit Payment, Financial Planning, student
biometric exam check-in record, Tax Exemption Form, Policy Valuation Report,
Vehicle Service Checklist, Policy Change Form, Environmental Compliance
Report, Passport, Policy Renewal Form, telecom account PIN verification form,
Medical Authorization, Social Security Application, Travel Safety Checklist,
Customer Payment Information Sheet, Disability Diagnosis Letter, Investment
Performance, Customer Service Contract, event registration payment form,
Emergency Medical Supplies Inventory, Product Catalog, Insurance Claim Form,
Investment Terms, API Documentation, Credit Score, Router DHCP Lease Log,
Medication Refill Request, Property Tax Receipt, Racial Discrimination
Survey, Exercise Routine, Environmental Compliance Audit, Health Education
Brochure, Election Results Report, API Deployment, Change Log, Nutrition
Tips, Brochure Cover, Investment Policy, Nutrition Reminder, API Parameter.

The final set has 100 further types of the same spread (finance, insurance,
health, government, IT, marketing). They are in `outside-final.json` as
`title` and are not listed here.

## Caveats

About the data:

- **Synthetic.** The text was written by a language model, not by people.
  It is tidier and more uniform than real letters, and some values are
  obvious fillers (running digits, stock names). A score here says how the
  tool does on unfamiliar wording and unfamiliar identifier types, not how it
  does on real post.
- **Not UK letters.** Half the documents use US conventions (SSNs, ZIP codes,
  US phone formats) and the rest a mix of countries. The repo's own letters
  are UK ones. Many documents are business or IT text (release notes, API
  documents, logs) and not letters to a person.
- **Short.** The dev median is about 620 characters. The 6,000 limit is never
  reached; the longest of the 150 is about 2,400.
- **The card and the files disagree on size.** The card says 50,000 test rows.
  The parquet has 100,000 rows: 50,000 `us` then 50,000 `intl`, and every
  `uid` appears once in each half with different text. So `uid` alone is not
  a key; the script uses locale plus `uid`.
- **Types called "form" appear as unstructured.** `document_format` is the
  dataset's own flag. Some unstructured documents still have form-like lines.

About the labels:

- **No "who".** Staff, third parties and the subject are not told apart, so
  everything is marked `subject`. The split of misses by `who` means nothing
  on this data.
- **Names are labelled in parts.** `first_name` and `last_name` are separate
  spans, which matches the repo's rule of listing a surname on its own.
  Surnames of several words are one span and are kept whole, so a tool that
  hides only one word of such a surname counts as a miss.
- **More kinds than the repo scores.** API keys, cookies, MAC addresses, PINs,
  biometric and device numbers are direct identifiers here and make up about
  a fifth of the dev gold (kind OTHER). The repo's own letters have nothing
  like them. Expect recall to be lower on OTHER; report it by kind.
- **Many documents have no labelled name.** 27 of the 50 dev documents have no
  PERSON entry. Their gold is numbers, logins and contact details only. One of
  those 27 has a title or greeting followed by a capitalised word, which may
  be a name the dataset did not label. This was not checked by hand.
- **First names labelled as user names.** In dev, some `user_name` spans are
  a bare first name or a first-and-last name joined by a dot. They are scored
  as OTHER, not PERSON.
- **Span edges are loose.** At least one dev e-mail span includes the full
  stop that ends the sentence. The value is kept as labelled.
- **The span's own `text` field can differ from the document in letter case**
  (6,195 of 850,340 spans in the split, all case-only; 10 in the sample). The
  script ignores that field and cuts the value from the document by offset.
- **`spans` is a string**, a Python literal in all rows but one, which is
  JSON. The script reads both.
- **Odd quasi labels.** In dev, role words and a status word are labelled as
  occupation or similar, a team name as a company, a template placeholder as
  a date, and times written in words as times. This only affects `quasi`.
- **Organisations labelled as people's names: not seen** in the 47 dev PERSON
  entries. The final set was not looked at, so this is not ruled out there.
- **Unlabelled identifiers.** A pattern check of the dev set found no e-mail
  address without a label. Names, phone numbers and other kinds were not
  checked for gaps. A tool that hides an unlabelled identifier is right, and
  the files cannot show it.

## What was and was not run

Run on 15 November 2026, Windows 11, Python 3.12, pyarrow 21, Node 22:

- `scripts/fetch-outside.py`, twice; the two JSON outputs were identical.
- A Node check that every `gold` and `quasi` value is found by
  `text.includes`, that ids are unique, and that every text is 400 to 6,000
  UTF-16 units long: 0 failures in both files.
- `git check-ignore` confirms `outside-data/` is ignored.

Not run: the benchmark itself on these files. Nothing in `src/eval/` reads
them yet. `npm test`, `npm run typecheck` and `npm run eval` were not run for
this change. The script was not tried on macOS or Linux.

## Court judgments (real documents)

**Text Anonymization Benchmark (TAB)** by Norsk Regnesentral:
<https://github.com/NorskRegnesentral/text-anonymization-benchmark>

Judgments of the European Court of Human Rights with every personal detail
labelled by hand. Licence: MIT (the repository's `LICENSE.txt` and README
agree). Used at commit `558e09e`.

This is real text about real people, so it is used under rule 4 of
`CLAUDE.md`: downloaded into the git-ignored `outside-data/tab/`, on-device
scrub only, no cloud call on it, and no text or name from it written to this
repository.

```bash
python scripts/fetch-tab.py
```

- 100 documents from the test split with a fixed seed (20261116) are the
  measured set; 10 from the train split were used to check the mapping.
- Labels: DIRECT must be hidden; QUASI is counted with no pass or fail;
  NO_MASK should stay readable.
- More than one annotator: a detail is DIRECT if any annotator marked it
  DIRECT, otherwise QUASI if any marked it QUASI, otherwise NO_MASK.
- An entity counts as hidden only when every written form of it is hidden.
- In the measured set: 228 direct entities (112 people, 110 codes, 5 dates,
  1 organisation), about 40 quasi-identifiers a document.

Results are in `final-results.md`.
