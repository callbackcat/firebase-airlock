#!/usr/bin/env python3
"""
Fetch outside test data: a fixed sample of nvidia/Nemotron-PII (test split).

    python scripts/fetch-outside.py

Needs Python 3.9+ and pyarrow (`pip install pyarrow`). Nothing else.

What it does
  1. Downloads the test split parquet at a pinned dataset revision into
     outside-data/raw/ (skipped when the file is already there with the right
     SHA-256). One anonymous GET to huggingface.co, generic User-Agent.
  2. Picks 150 documents with a fixed seed (rule below) and splits them
     50 / 100 into outside-dev and outside-final.
  3. Writes outside-data/outside-dev.json, outside-data/outside-final.json,
     outside-data/stats.json (counts only) and outside-data/SOURCE.md.

Everything under outside-data/ is git-ignored. Do not commit any of it.
The script prints counts only, never document text. See docs/outside-data.md.

Selection rule
  - document_format == "unstructured"
  - locale in LOCALES (the dataset has "us" and "intl"; both are English)
  - 400 <= len(text) <= 6000, counted in Unicode code points
  - at least one direct identifier (documents without one are skipped and the
    next document in the shuffled pool takes the place)
  - order: every document gets the key sha256("<seed>:<locale>:<uid>"), every
    document type the key sha256("<seed>:type:<document_type>"). Types are
    sorted by their key, documents inside a type by theirs, then documents
    are taken round-robin, one per type per round, until 150 are chosen.
    A hash order is used instead of random.shuffle so the result does not
    depend on the Python version.
  - the first 50 chosen are outside-dev, the other 100 are outside-final.
"""

import ast
import collections
import datetime
import hashlib
import json
import os
import sys
import urllib.request

DATASET = "nvidia/Nemotron-PII"
DATASET_URL = "https://huggingface.co/datasets/nvidia/Nemotron-PII"
REVISION = "b70ffaf5ff39e079776134c5bf4381f00a9fd1ed"
LICENCE = "cc-by-4.0 (Creative Commons Attribution 4.0 International)"
FILE = "data/test-00000-of-00001.parquet"
FILE_SHA256 = "1a4b0512ecb5370f0992d29d0f9c07351e6de13f0d7ea33bb18cecb984780247"
FILE_BYTES = 150968398
USER_AGENT = "Mozilla/5.0 (generic-client)"

SEED = 20261115
TOTAL = 150
DEV = 50
MIN_CHARS = 400
MAX_CHARS = 6000
FORMAT = "unstructured"
LOCALES = ("us", "intl")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "outside-data")
RAW = os.path.join(OUT, "raw")
PARQUET = os.path.join(RAW, os.path.basename(FILE))

# label -> (group, kind). kind is only used for the direct group.
# The full table with reasons is in docs/outside-data.md.
D, Q = "direct", "quasi"
LABELS = {
    # people
    "first_name": (D, "PERSON"),
    "last_name": (D, "PERSON"),
    # contact
    "street_address": (D, "ADDRESS"),
    "postcode": (D, "POSTCODE"),
    "email": (D, "EMAIL"),
    "phone_number": (D, "PHONE"),
    "fax_number": (D, "PHONE"),
    "date_of_birth": (D, "DOB"),
    # identity and record numbers
    "ssn": (D, "ID_NUMBER"),
    "national_id": (D, "ID_NUMBER"),
    "tax_id": (D, "ID_NUMBER"),
    "medical_record_number": (D, "ID_NUMBER"),
    "health_plan_beneficiary_number": (D, "ID_NUMBER"),
    "certificate_license_number": (D, "ID_NUMBER"),
    "license_plate": (D, "ID_NUMBER"),
    "vehicle_identifier": (D, "ID_NUMBER"),
    "employee_id": (D, "ID_NUMBER"),
    "customer_id": (D, "ID_NUMBER"),
    "unique_id": (D, "ID_NUMBER"),
    # money
    "account_number": (D, "ACCOUNT"),
    "bank_routing_number": (D, "ACCOUNT"),
    "credit_debit_card": (D, "CARD"),
    "cvv": (D, "CARD"),
    # logins, secrets, devices
    "user_name": (D, "OTHER"),
    "password": (D, "OTHER"),
    "pin": (D, "OTHER"),
    "api_key": (D, "OTHER"),
    "http_cookie": (D, "OTHER"),
    "ipv4": (D, "OTHER"),
    "ipv6": (D, "OTHER"),
    "mac_address": (D, "OTHER"),
    "device_identifier": (D, "OTHER"),
    "biometric_identifier": (D, "OTHER"),
    # quasi-identifiers
    "date": (Q, None),
    "date_time": (Q, None),
    "time": (Q, None),
    "company_name": (Q, None),
    "occupation": (Q, None),
    "employment_status": (Q, None),
    "education_level": (Q, None),
    "city": (Q, None),
    "county": (Q, None),
    "state": (Q, None),
    "country": (Q, None),
    "coordinate": (Q, None),
    "age": (Q, None),
    "gender": (Q, None),
    "race_ethnicity": (Q, None),
    "religious_belief": (Q, None),
    "political_view": (Q, None),
    "sexuality": (Q, None),
    "language": (Q, None),
    "blood_type": (Q, None),
    "url": (Q, None),
    "swift_bic": (Q, None),
}
# Any label not listed above is treated as "not personal" and reported.


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download():
    os.makedirs(RAW, exist_ok=True)
    if os.path.exists(PARQUET) and sha256_file(PARQUET) == FILE_SHA256:
        print("raw file already present, checksum ok")
        return
    url = f"https://huggingface.co/datasets/{DATASET}/resolve/{REVISION}/{FILE}"
    print(f"downloading {FILE} at revision {REVISION[:12]} (about {FILE_BYTES // 1_000_000} MB)")
    tmp = PARQUET + ".part"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    got = sha256_file(tmp)
    if got != FILE_SHA256:
        os.remove(tmp)
        sys.exit(f"checksum mismatch for {FILE}: got {got}")
    os.replace(tmp, PARQUET)
    print("download ok, checksum ok")


def key(*parts):
    return hashlib.sha256(":".join(str(p) for p in (SEED,) + parts).encode("utf-8")).hexdigest()


def parse_spans(raw):
    # The column is a string. Almost every row is a Python literal (single
    # quotes), a few are JSON. Both hold [{start, end, label, text}].
    try:
        return json.loads(raw)
    except ValueError:
        return ast.literal_eval(raw)


def label_doc(text, spans, drops):
    """Return (gold, quasi, per-label span counts) for one document."""
    gold, quasi, seen_gold, seen_quasi = [], [], set(), set()
    counts = collections.Counter()
    for s in sorted(spans, key=lambda s: (s["start"], s["end"])):
        label = s["label"]
        group, kind = LABELS.get(label, ("not personal", None))
        # The offsets are the annotation. The span's own "text" field
        # sometimes differs from the document in letter case, so it is not used.
        value = text[s["start"]:s["end"]].strip()
        if not value or value not in text:
            drops["empty or not found in text"] += 1
            continue
        if str(s.get("text", value)) != value:
            drops["note: span text field differs from document (kept, offsets used)"] += 1
        counts[label] += 1
        if group == D:
            if value in seen_gold:
                continue
            seen_gold.add(value)
            gold.append({"kind": kind, "value": value, "who": "subject", "label": label})
        elif group == Q:
            if value not in seen_quasi:
                seen_quasi.add(value)
                quasi.append(value)
    # A string that is a direct identifier somewhere in the document is not
    # also listed as a quasi-identifier.
    both = [q for q in quasi if q in seen_gold]
    if both:
        drops["note: quasi value also a direct value in same document (kept as direct only)"] += len(both)
        quasi = [q for q in quasi if q not in seen_gold]
    return gold, quasi, counts


def main():
    try:
        import pyarrow.parquet as pq
    except ImportError:
        sys.exit("pyarrow is needed: pip install pyarrow")

    download()
    cols = ["uid", "document_type", "document_format", "locale", "text", "spans"]
    table = pq.read_table(PARQUET, columns=cols).to_pydict()
    n = len(table["uid"])

    formats = collections.Counter(table["document_format"])
    locales = collections.Counter(table["locale"])

    # Pool: documents that pass the format, locale and length rule.
    by_type = collections.defaultdict(list)
    pool = 0
    for i in range(n):
        text = table["text"][i]
        if table["document_format"][i] != FORMAT or table["locale"][i] not in LOCALES:
            continue
        if not (MIN_CHARS <= len(text) <= MAX_CHARS):
            continue
        pool += 1
        # uid repeats across the two locales, so the locale is part of the key.
        by_type[table["document_type"][i]].append((key(table["locale"][i], table["uid"][i]), i))
    for docs in by_type.values():
        docs.sort()
    types = sorted(by_type, key=lambda t: key("type", t))

    drops = collections.Counter()
    unknown = collections.Counter()
    chosen = []
    skipped_no_direct = 0
    cursor = {t: 0 for t in types}
    while len(chosen) < TOTAL:
        progressed = False
        for t in types:
            if len(chosen) >= TOTAL:
                break
            docs = by_type[t]
            while cursor[t] < len(docs):
                i = docs[cursor[t]][1]
                cursor[t] += 1
                progressed = True
                text = table["text"][i]
                spans = parse_spans(table["spans"][i])
                local_drops = collections.Counter()
                gold, quasi, counts = label_doc(text, spans, local_drops)
                if not gold:
                    skipped_no_direct += 1
                    continue
                drops.update(local_drops)
                for label in counts:
                    if label not in LABELS:
                        unknown[label] += counts[label]
                chosen.append({
                    "type": t, "locale": table["locale"][i], "text": text,
                    "gold": gold, "quasi": quasi, "counts": counts,
                })
                break
        if not progressed:
            sys.exit(f"pool ran out after {len(chosen)} documents")

    def build(docs, prefix):
        out = []
        for k, d in enumerate(docs, 1):
            out.append({
                "id": f"{prefix}-{k:03d}",
                "title": d["type"],
                "text": d["text"],
                "gold": d["gold"],
                "keep": [],
                "quasi": d["quasi"],
            })
        return out

    dev_docs, final_docs = chosen[:DEV], chosen[DEV:]
    dev, final = build(dev_docs, "out-dev"), build(final_docs, "out-final")

    # Last check, the same one the benchmark relies on.
    for f in dev + final:
        for g in f["gold"]:
            assert g["value"] in f["text"], f["id"]
        for q in f["quasi"]:
            assert q in f["text"], f["id"]

    def dump(name, data):
        with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
            fh.write("\n")

    dump("outside-dev.json", dev)
    dump("outside-final.json", final)

    def totals(docs, built):
        return {
            "documents": len(built),
            "direct identifiers (unique values per document)": sum(len(f["gold"]) for f in built),
            "quasi-identifiers (unique values per document)": sum(len(f["quasi"]) for f in built),
            "labelled spans (all groups, before de-duplication)": sum(sum(d["counts"].values()) for d in docs),
            "document types": len({d["type"] for d in docs}),
            "locales": dict(collections.Counter(d["locale"] for d in docs)),
            "characters min/median/max": [
                min(len(d["text"]) for d in docs),
                sorted(len(d["text"]) for d in docs)[len(docs) // 2],
                max(len(d["text"]) for d in docs),
            ],
        }

    dev_spans = collections.Counter()
    for d in dev_docs:
        dev_spans.update(d["counts"])
    dev_gold = collections.Counter(g["label"] for f in dev for g in f["gold"])
    dev_kinds = collections.Counter(g["kind"] for f in dev for g in f["gold"])
    final_labels = set()
    for d in final_docs:
        final_labels.update(d["counts"])

    label_rows = []
    for label in sorted(set(dev_spans) | final_labels):
        group, kind = LABELS.get(label, ("not personal", None))
        label_rows.append({
            "label": label, "group": group, "kind": kind,
            "dev spans": dev_spans.get(label, 0),
            "dev gold values": dev_gold.get(label, 0) if group == D else None,
            "in final": label in final_labels,
        })

    stats = {
        "dataset": DATASET, "revision": REVISION, "seed": SEED,
        "split rows": n, "formats in split": dict(formats), "locales in split": dict(locales),
        "document types in split": len(set(table["document_type"])),
        "pool after format, locale and length rule": pool,
        "document types in pool": len(types),
        "documents skipped for having no direct identifier": skipped_no_direct,
        "spans dropped or noted": dict(drops),
        "labels not in the mapping (treated as not personal)": dict(unknown),
        "dev": totals(dev_docs, dev),
        "final": totals(final_docs, final),
        "dev direct identifiers by kind": dict(dev_kinds),
        "labels": label_rows,
        "dev document types": sorted(d["type"] for d in dev_docs),
    }
    dump("stats.json", stats)

    today = datetime.date.today()
    fetched = f"{today.day} {today.strftime('%B %Y')}"
    with open(os.path.join(OUT, "SOURCE.md"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(f"""# Source of the files in this folder

This folder is git-ignored. Do not commit it.

- Dataset: {DATASET} (Nemotron-PII, NVIDIA). Synthetic data, no real people.
- URL: {DATASET_URL}
- Revision (commit sha): {REVISION}
- File: {FILE} (SHA-256 {FILE_SHA256})
- Licence: {LICENCE}, https://creativecommons.org/licenses/by/4.0/legalcode
- Attribution: NVIDIA, "Nemotron-PII: Synthesized Data for Privacy-Preserving AI".
  The documents are unchanged. The labels were regrouped (see docs/outside-data.md).
- Date fetched: {fetched}
- Seed: {SEED}
- Made by: scripts/fetch-outside.py

## Selection rule

Test split, document_format = "{FORMAT}", locale in {", ".join(LOCALES)} (both English),
{MIN_CHARS} to {MAX_CHARS} characters, at least one direct identifier. Documents
are ordered by sha256("{SEED}:<locale>:<uid>") inside each document type, types by
sha256("{SEED}:type:<document_type>"), then taken round-robin, one per type per
round. First {DEV} are outside-dev, the other {TOTAL - DEV} are outside-final.

## Counts

- Rows in the test split: {n}
- Pool after the format, locale and length rule: {pool} documents, {len(types)} document types
- Skipped for having no direct identifier: {skipped_no_direct}
- Spans dropped because the value was empty or not found in the text: {drops.get("empty or not found in text", 0)}
- outside-dev.json: {len(dev)} documents, {stats["dev"]["direct identifiers (unique values per document)"]} direct identifiers, {stats["dev"]["quasi-identifiers (unique values per document)"]} quasi-identifiers
- outside-final.json: {len(final)} documents, {stats["final"]["direct identifiers (unique values per document)"]} direct identifiers, {stats["final"]["quasi-identifiers (unique values per document)"]} quasi-identifiers

Per-label counts for outside-dev are in stats.json.
""")

    # Counts only. No document text is printed.
    print(json.dumps({k: v for k, v in stats.items() if k not in ("labels", "dev document types")}, indent=1))
    print("label\tgroup\tkind\tdev spans\tdev gold values\tin final")
    for r in label_rows:
        print("\t".join(str(r[c]) for c in ("label", "group", "kind", "dev spans", "dev gold values", "in final")))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
