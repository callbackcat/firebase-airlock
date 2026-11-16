#!/usr/bin/env python3
"""Build src/data/names.txt and src/data/common-words.txt from open sources.

    python scripts/build-wordlists.py              # download what is missing, then build
    python scripts/build-wordlists.py --offline    # build only from files already downloaded
    python scripts/build-wordlists.py --no-wikidata # do not ask Wikidata for lists that are missing
    python scripts/build-wordlists.py --fetch-only # download only

Raw downloads go to outside-data/wordlists-raw/ (git-ignored), or to the folder
named in the WORDLISTS_RAW environment variable. Nothing is sent to any server
except plain anonymous GET requests with a generic User-Agent.

Sources, licences and the reasoning behind each rule are in docs/wordlists.md.
Standard library only.
"""

from __future__ import annotations

import csv
import gzip
import io
import os
import re
import sys
import tarfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

# --------------------------------------------------------------------------
# Settings
# --------------------------------------------------------------------------

REPO = Path(__file__).resolve().parent.parent
RAW = Path(os.environ.get("WORDLISTS_RAW", REPO / "outside-data" / "wordlists-raw"))
OUT_NAMES = REPO / "src" / "data" / "names.txt"
OUT_WORDS = REPO / "src" / "data" / "common-words.txt"

USER_AGENT = "wordlist-builder/1.0"

# Names: how much to take from each source (most frequent first).
CENSUS_TOP = 75000        # US Census 2010 surnames, by rank
ONS_MIN_TOTAL = 20        # England and Wales baby names: births 1996 onwards, both sexes
CSO_MIN_TOTAL = 20        # Ireland baby names: registrations 1964 onwards
WIKIDATA_MIN_COUNT = 2    # people in Wikidata, per country, bearing the name
WIKIDATA_LIMIT = 4000     # names asked for per country and per kind
NAME_MIN_LEN = 3

# Common words.
COMMON_TARGET = 30000     # size of common-words.txt
COMMON_TOP = 5000         # names in the first COMMON_TOP common words are dropped
TOP_NAMES = 2000          # "top given names" / "top surnames" for the name filter
SCOWL_MAX_SIZE = 70       # SCOWL sizes used as the dictionary (10..70)
SCOWL_INFLECTION_MAX_SIZE = 60  # an inflected form must be in SCOWL at this size or below
INFLECTION_SHARE = 0.3    # assumed frequency of an inflected form relative to its base word
LOWER_CASE_RATIO = 0.4    # a frequent name is an ordinary word if lower-case uses >= ratio * capitalised uses
SCOWL_CORE_MAX_SIZE = 35  # everyday vocabulary: trusted when there is no letter-case evidence
SCOWL_UPPER_MAX_SIZE = 35 # capitalised everyday words (days, months, nationalities)
SCOWL_CONTRACTION_MAX_SIZE = 40

FILES = {
    "census": ("census/names.zip",
               "https://www2.census.gov/topics/genealogy/2010surnames/names.zip"),
    "ons": ("ons/babynames1996to2025.xlsx",
            "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/birthsdeathsandmarriages/"
            "livebirths/datasets/babynamesinenglandandwalesfrom1996/1996to2025/babynames1996to2025.xlsx"),
    "ons_hist": ("ons/historicalnames2024.xlsx",
                 "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/birthsdeathsandmarriages/"
                 "livebirths/datasets/babynamesenglandandwalestop100babynameshistoricaldata/1904to2024/"
                 "historicalnames2024.xlsx"),
    "cso_boys": ("cso/VSA50.csv",
                 "https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/VSA50/CSV/1.0/en"),
    "cso_girls": ("cso/VSA60.csv",
                  "https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/VSA60/CSV/1.0/en"),
    "scowl": ("scowl/scowl-2020.12.07.tar.gz",
              "https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz"),
    "gwordlist": ("gwordlist/frequency-alpha-alldicts.txt",
                  "https://raw.githubusercontent.com/hackerb9/gwordlist/master/frequency-alpha-alldicts.txt"),
    "orgtre": ("orgtre/1grams_english.csv",
               "https://raw.githubusercontent.com/orgtre/google-books-ngram-frequency/main/ngrams/"
               "1grams_english.csv"),
    "orgtre_raw": ("orgtre/1grams_english_1a_no_pos.csv",
                   "https://raw.githubusercontent.com/orgtre/google-books-ngram-frequency/main/ngrams/"
                   "more/english/1grams_english_1a_no_pos.csv"),
}

# Entries of the small SCOWL "upper" lists (days, months, nationalities,
# religions) that are not everyday words.
CAPITALISED_NOT_WORDS = {"john", "julies", "mays", "brown", "doctor", "mister"}

# Titles and the like that books mostly write with a capital but that are
# everyday words all the same. Hand-made; they pass the name filter.
ALWAYS_ORDINARY = {"lord", "duke", "pope", "roman"}

# Everyday 's contractions. SCOWL lists the n't, 'll, 've, 'd, 're forms but
# treats 's as a possessive ending, so these are added by hand.
EXTRA_CONTRACTIONS = {
    "it's", "that's", "what's", "there's", "here's", "he's", "she's", "who's",
    "where's", "how's", "let's", "when's", "why's", "that'll", "there'll",
    "could've", "should've", "might've", "must've",
}

# Wikidata (CC0): names of people by country of citizenship. Best effort: a
# query that fails is skipped and reported. The public endpoint allowed
# anonymous clients about one request a minute when this was written and
# counted refused requests too, so the script waits two minutes between
# requests. Files are kept in the raw folder and are not asked for again.
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
WIKIDATA_PAUSE_SECONDS = 200
WIKIDATA_COUNTRIES = {
    "Q145": "United Kingdom", "Q668": "India", "Q843": "Pakistan", "Q1033": "Nigeria",
    "Q36": "Poland", "Q902": "Bangladesh", "Q218": "Romania", "Q117": "Ghana",
    "Q79": "Egypt", "Q148": "China", "Q43": "Turkey", "Q794": "Iran",
    "Q212": "Ukraine", "Q29": "Spain", "Q155": "Brazil", "Q1045": "Somalia",
    "Q37": "Lithuania", "Q928": "Philippines", "Q796": "Iraq", "Q45": "Portugal",
}
WIKIDATA_KINDS = {"P735": "given", "P734": "family"}
# (country, kind) in the order they are asked for: given names first, because
# the surname file of the US Census already reaches most of the world.
WIKIDATA_LISTS = (
    [(q, "P735") for q in WIKIDATA_COUNTRIES]
    + [(q, "P734") for q in WIKIDATA_COUNTRIES if q != "Q145"]
)

# Pieces of multi-word names that are not names on their own.
NAME_PARTICLES = {
    "the", "and", "del", "der", "den", "dos", "das", "des", "les", "los", "las",
    "ter", "ten", "von", "van", "bin", "bint", "ibn", "abu", "née", "nee",
    "junior", "senior", "unknown", "other", "names", "all",
}

# Words that UK letters use (health, law, housing, benefits, money, office
# wording). Written by hand for this project. Any that are missing from the
# frequency-ranked list are added to it.
UK_LETTER_WORDS = """
prescription prescriptions physiotherapy physiotherapist referral referrals outpatient
outpatients inpatient consultant surgery surgeries appointment appointments diagnosis
diagnosed medication medications dosage tablets paracetamol ibuprofen antibiotics inhaler
antidepressant antidepressants radiology cardiology dermatology oncology orthopaedic
orthopaedics paediatric paediatrics gynaecology haematology anaesthetic ultrasound biopsy
endoscopy colonoscopy mammogram vaccination immunisation chemotherapy radiotherapy dialysis
diabetes diabetic asthma arthritis dementia epilepsy midwife midwives pharmacist pharmacy
optician chiropodist podiatry audiology phlebotomy triage discharge discharged counselling
counsellor psychiatrist psychiatric psychologist safeguarding
solicitor solicitors barrister bailiff bailiffs tribunal tribunals claimant defendant
respondent appellant magistrate magistrates summons hearing adjournment affidavit injunction
judgment judgement probate executor conveyancing litigation mediation enforcement proceedings
statutory liability indemnity redundancy grievance disciplinary dismissal
tenancy tenancies tenant tenants landlord landlords arrears eviction evicted possession
repossession leasehold leaseholder freehold freeholder mortgage remortgage lodger sublet
subletting deposit inventory damp mould repairs homelessness homeless overcrowding council
housing rent rental
reconsideration overpayment overpayments underpayment entitlement sanction sanctions
allowance jobseeker jobseekers pension pensions pensioner payslip payslips payroll salary
deduction deductions taxable rebate refund debit overdraft creditor creditors debtor
insolvency bankruptcy repayment repayments instalment instalments invoice remittance
surcharge exemption eligibility eligible assessment assessor carer carers caseworker
dependant dependants guarantor maternity paternity bereavement disability incapacity
backdated backdating mandatory appeal appeals award awarded attendance mobility
enclosed herewith sincerely faithfully regards reference postcode recipient addressee
correspondence acknowledgement cancellation rescheduled reschedule deadline overdue reminder
notification authorisation authorised signature signatory photocopy enclosure enquiry
enquiries complaint complaints ombudsman councillor
""".split()

# --------------------------------------------------------------------------
# Downloading
# --------------------------------------------------------------------------


def http_get(url: str, timeout: int = 300, accept: str | None = None) -> bytes:
    headers = {"User-Agent": USER_AGENT}
    if accept:
        headers["Accept"] = accept
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_files(offline: bool) -> None:
    for key, (rel, url) in FILES.items():
        path = RAW / rel
        if path.exists() and path.stat().st_size > 0:
            continue
        if offline:
            sys.exit(f"missing {path} (run without --offline to download it)")
        print(f"downloading {key}: {url}")
        path.parent.mkdir(parents=True, exist_ok=True)
        data = http_get(url)
        path.write_bytes(data)
        print(f"  {len(data):,} bytes")


def wikidata_query(qid: str, prop: str) -> str:
    # The join order is fixed by hand: people of the country first, then their
    # names. Without the hint the public endpoint times out on large countries.
    return (
        "SELECT ?l ?c WHERE { { SELECT ?n (COUNT(*) AS ?c) WHERE { "
        'hint:Query hint:optimizer "None" . '
        f"?p wdt:P27 wd:{qid} . ?p wdt:{prop} ?n . "
        f"}} GROUP BY ?n ORDER BY DESC(?c) LIMIT {WIKIDATA_LIMIT} }} "
        '?n rdfs:label ?l . FILTER(LANG(?l)="en") } ORDER BY DESC(?c)'
    )


def fetch_wikidata(offline: bool, skip: bool) -> list[str]:
    """Download the per-country name counts. Returns the list of missing files."""
    folder = RAW / "wikidata"
    folder.mkdir(parents=True, exist_ok=True)
    todo = []
    for qid, prop in WIKIDATA_LISTS:
        label, kind = WIKIDATA_COUNTRIES[qid], WIKIDATA_KINDS[prop]
        path = folder / f"{qid}-{prop}.csv"
        if not (path.exists() and path.stat().st_size > 0):
            todo.append((qid, label, prop, kind, path))
    if offline or skip or not todo:
        return [f"{label} {kind}" for _, label, _, kind, _ in todo]
    print(f"wikidata: {len(todo)} lists to download, one request every "
          f"{WIKIDATA_PAUSE_SECONDS} seconds (about {len(todo) * (WIKIDATA_PAUSE_SECONDS + 20) // 60} minutes)")
    missing = []
    for round_no in (1, 2):                 # second round retries the failures once
        failed = []
        for item in todo:
            qid, label, prop, kind, path = item
            url = WIKIDATA_ENDPOINT + "?" + urllib.parse.urlencode(
                {"query": wikidata_query(qid, prop)})
            try:
                data = http_get(url, timeout=75, accept="text/csv")
                if not data.startswith(b"l,c"):
                    raise OSError("unexpected reply")
                path.write_bytes(data)
                print(f"wikidata {label} {kind}: {data.count(10) - 1} names")
            except Exception as err:  # noqa: BLE001 - any failure means "skip this list"
                print(f"wikidata {label} {kind}: round {round_no} failed ({err})")
                failed.append(item)
            time.sleep(WIKIDATA_PAUSE_SECONDS)
        todo = failed
        missing = [f"{label} {kind}" for _, label, _, kind, _ in failed]
        if not failed:
            break
    return missing


# --------------------------------------------------------------------------
# Reading the sources
# --------------------------------------------------------------------------

XL_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def xlsx_sheets(path: Path) -> dict[str, str]:
    """Sheet name -> path inside the zip."""
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        targets = {r.get("Id"): r.get("Target") for r in rels}
        out = {}
        for s in wb.find(XL_NS + "sheets"):
            rid = s.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
            target = targets[rid].lstrip("/")
            out[s.get("name")] = target if target.startswith("xl/") else "xl/" + target
        return out


def xlsx_rows(path: Path, sheet: str):
    """Yield each row of a sheet as {column letters: text}."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(XL_NS + "si"):
                shared.append("".join(t.text or "" for t in si.iter(XL_NS + "t")))
        with z.open(xlsx_sheets(path)[sheet]) as fh:
            for _, el in ET.iterparse(fh):
                if el.tag != XL_NS + "row":
                    continue
                row = {}
                for c in el.findall(XL_NS + "c"):
                    col = re.match(r"[A-Z]+", c.get("r")).group(0)
                    kind = c.get("t")
                    v = c.find(XL_NS + "v")
                    if kind == "inlineStr":
                        row[col] = "".join(t.text or "" for t in c.iter(XL_NS + "t"))
                    elif v is None or v.text is None:
                        continue
                    elif kind == "s":
                        row[col] = shared[int(v.text)]
                    else:
                        row[col] = v.text
                yield row
                el.clear()


def read_census() -> list[tuple[str, int]]:
    """US Census 2010 surnames, most frequent first: (name, people)."""
    out = []
    with zipfile.ZipFile(RAW / FILES["census"][0]) as z:
        with z.open("Names_2010Census.csv") as fh:
            for row in csv.DictReader(io.TextIOWrapper(fh, encoding="latin-1")):
                name = row["name"].strip()
                if not name or name.upper() == "ALL OTHER NAMES":
                    continue
                out.append((name, int(row["count"])))
    out.sort(key=lambda x: -x[1])
    return out


def read_ons() -> Counter:
    """England and Wales baby names: name -> births since 1996, both sexes."""
    total: Counter = Counter()
    path = RAW / FILES["ons"][0]
    for sheet in ("Table_1", "Table_2"):
        count_cols: list[str] = []
        for row in xlsx_rows(path, sheet):
            if not count_cols:
                if row.get("A", "").strip() == "Name":
                    count_cols = [c for c, v in row.items() if v.strip().endswith("Count")]
                continue
            name = row.get("A", "").strip()
            if not name:
                continue
            n = 0
            for c in count_cols:
                v = row.get(c, "")
                if v.isdigit():
                    n += int(v)
            total[name] += n
    return total


def read_ons_historic() -> set[str]:
    """Top 100 names for each tenth year 1904-2024 in England and Wales."""
    names = set()
    path = RAW / FILES["ons_hist"][0]
    for sheet in ("Table_1", "Table_2"):
        started = False
        for row in xlsx_rows(path, sheet):
            if not started:
                started = row.get("A", "").strip() == "Rank"
                continue
            for col, v in row.items():
                if col != "A" and v.strip() and not v.strip().isdigit():
                    names.add(v.strip())
    return names


def read_cso() -> Counter:
    """Ireland baby names: name -> registrations since 1964, both sexes."""
    total: Counter = Counter()
    for key in ("cso_boys", "cso_girls"):
        with open(RAW / FILES[key][0], encoding="utf-8-sig", newline="") as fh:
            reader = csv.reader(fh)
            header = next(reader)
            i_stat, i_name, i_val = 0, 5, header.index("VALUE")
            for row in reader:
                if row[i_stat].endswith("C01") and row[i_val].isdigit():
                    total[row[i_name]] += int(row[i_val])
    return total


def read_wikidata() -> tuple[dict[str, Counter], list[str]]:
    """kind -> name -> largest per-country count. Also the files that were used."""
    out = {"family": Counter(), "given": Counter()}
    used = []
    for qid, prop in WIKIDATA_LISTS:
        label, kind = WIKIDATA_COUNTRIES[qid], WIKIDATA_KINDS[prop]
        path = RAW / "wikidata" / f"{qid}-{prop}.csv"
        if not path.exists():
            continue
        used.append(f"{label} {kind}")
        with open(path, encoding="utf-8", newline="") as fh:
            reader = csv.reader(fh)
            next(reader, None)
            for row in reader:
                if len(row) == 2 and row[1].isdigit():
                    c = int(row[1])
                    if c > out[kind][row[0]]:
                        out[kind][row[0]] = c
    return out, used


def read_scowl() -> dict[tuple[str, int], set[str]]:
    """(category, size) -> entries, for the final SCOWL lists."""
    cats: dict[tuple[str, int], set[str]] = {}
    with tarfile.open(RAW / FILES["scowl"][0]) as t:
        for m in t.getmembers():
            if "/final/" not in m.name or not m.isfile():
                continue
            cat, size = m.name.split("/final/")[1].rsplit(".", 1)
            words = t.extractfile(m).read().decode("latin-1").split("\n")
            cats.setdefault((cat, int(size)), set()).update(w for w in words if w)
    return cats


def read_gwordlist() -> tuple[dict[str, int], dict[str, bool]]:
    """Google Books words (dictionary headwords only), lower-cased: count, and
    whether the most frequent written form of the word is lower case."""
    counts: dict[str, int] = {}
    lower_dominant: dict[str, bool] = {}
    with open(RAW / FILES["gwordlist"][0], encoding="utf-8") as fh:
        for line in fh:
            parts = line.split()
            if len(parts) < 3 or line.startswith("#"):
                continue
            w = parts[1]
            lw = w.lower()
            if lw in lower_dominant:
                continue
            lower_dominant[lw] = w == lw
            counts[lw] = int(parts[2].replace(",", ""))
    return counts, lower_dominant


def read_orgtre_raw() -> tuple[dict[str, int], dict[str, int]]:
    """The 10,000 most frequent raw Google Books words with letter case kept:
    counts of the lower-case form and of the capitalised form."""
    lower: dict[str, int] = {}
    cap: dict[str, int] = {}
    with open(RAW / FILES["orgtre_raw"][0], encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        next(reader)
        for row in reader:
            if len(row) < 2 or not row[1].isdigit():
                continue
            w = row[0]
            if w == w.lower():
                lower[w] = int(row[1])
            elif w == w.capitalize():
                cap[w.lower()] = int(row[1])
    return lower, cap


def inflections(w: str) -> set[str]:
    """Regular inflected forms of a word; the caller keeps only real ones."""
    out = {w + "s", w + "es", w + "ed", w + "ing"}
    if w.endswith("e"):
        out |= {w + "d", w[:-1] + "ing"}
    if len(w) > 2 and w.endswith("y") and w[-2] not in "aeiou":
        out |= {w[:-1] + "ies", w[:-1] + "ied"}
    if len(w) >= 3 and w[-1] not in "aeiouwxy" and w[-2] in "aeiou" and w[-3] not in "aeiou":
        out |= {w + w[-1] + "ed", w + w[-1] + "ing"}
    return out


def read_orgtre() -> list[str]:
    """Cleaned Google Books list of the 10,000 most frequent English words."""
    with open(RAW / FILES["orgtre"][0], encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        next(reader)
        return [row[0].lower() for row in reader if row]


# --------------------------------------------------------------------------
# Names
# --------------------------------------------------------------------------

FOLD = str.maketrans({
    "ø": "o", "ł": "l", "đ": "d", "ð": "d", "ß": "ss", "æ": "ae", "œ": "oe",
    "ı": "i", "þ": "th", "ħ": "h", "ŧ": "t", "ŋ": "n", "ə": "a",
})


def is_latin(token: str) -> bool:
    return all("LATIN" in unicodedata.name(ch, "") for ch in token)


def name_tokens(name: str) -> set[str]:
    """Lower-case letter-only pieces of a name, three letters or longer.
    A piece with accents is given both as written and without accents."""
    out = set()
    text = unicodedata.normalize("NFC", name).lower()
    for piece in re.split(r"[^\w]|[\d_]", text):
        if len(piece) < NAME_MIN_LEN or not piece.isalpha() or not is_latin(piece):
            continue
        if piece in NAME_PARTICLES:
            continue
        out.add(piece)
        plain = unicodedata.normalize("NFKD", piece.translate(FOLD))
        plain = "".join(ch for ch in plain if not unicodedata.combining(ch))
        if plain.isascii() and plain.isalpha() and len(plain) >= NAME_MIN_LEN \
                and plain not in NAME_PARTICLES:
            out.add(plain)
    return out


def top_tokens(ranked_names: list[str], n: int) -> set[str]:
    """Tokens of the first n names of a list ordered by frequency."""
    out: set[str] = set()
    for name in ranked_names[:n]:
        out |= name_tokens(name)
    return out


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------

WORD_RE = re.compile(r"[a-z]+(?:'[a-z]+)*")


def gz_size(path: Path) -> int:
    return len(gzip.compress(path.read_bytes(), 9, mtime=0))


def write_list(path: Path, items: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(sorted(items)) + "\n")


def build(wikidata_missing: list[str]) -> None:
    # ---- read ------------------------------------------------------------
    census = read_census()
    ons = read_ons()
    ons_hist = read_ons_historic()
    cso = read_cso()
    wikidata, wikidata_used = read_wikidata()
    scowl = read_scowl()
    g_count, g_lower = read_gwordlist()
    orgtre = read_orgtre()
    raw_lower, raw_cap = read_orgtre_raw()

    ons_ranked = [n for n, _ in ons.most_common()]
    top_given = top_tokens(ons_ranked, TOP_NAMES)
    for n in ons_hist:
        top_given |= name_tokens(n)
    top_surnames = top_tokens([n for n, _ in census], TOP_NAMES)

    # ---- dictionary sets from SCOWL ---------------------------------------
    dictionary: set[str] = set()      # lower-case entries: ordinary words
    inflectable: set[str] = set()     # the same, smaller tiers only
    core: set[str] = set()            # the same, everyday tiers only
    capitalised: set[str] = set()     # everyday words written with a capital
    contractions: set[str] = set()
    for (cat, size), words in scowl.items():
        kind = cat.rsplit("-", 1)[-1]
        if cat.startswith("special") or "variant_2" in cat or "variant_3" in cat:
            continue
        if kind == "words" and size <= SCOWL_MAX_SIZE:
            dictionary.update(w for w in words if WORD_RE.fullmatch(w))
            if size <= SCOWL_INFLECTION_MAX_SIZE:
                inflectable.update(w for w in words if WORD_RE.fullmatch(w))
            if size <= SCOWL_CORE_MAX_SIZE:
                core.update(w for w in words if WORD_RE.fullmatch(w))
        elif kind == "contractions" and size <= SCOWL_CONTRACTION_MAX_SIZE:
            contractions.update(w.lower() for w in words if WORD_RE.fullmatch(w.lower()))
        elif kind == "upper" and size <= SCOWL_UPPER_MAX_SIZE:
            capitalised.update(w.lower() for w in words
                               if re.fullmatch(r"[A-Z][a-z]{2,}", w))
    capitalised -= CAPITALISED_NOT_WORDS

    # ---- common words -----------------------------------------------------
    # A word that is also a frequent name (first TOP_NAMES given names or
    # surnames) is only an "ordinary word" when
    #   - it is a lower-case dictionary entry, and
    #   - books write it in lower case often enough compared with the
    #     capitalised form ("will", "mark", "rose", "river", "king", "hill"
    #     pass; "frank", "john", "jack", "smith", "baker" do not). When the
    #     case-sensitive list has neither form, the word passes if it is in the
    #     everyday SCOWL tiers or the larger list shows it mostly in lower case.
    # Days, months, nationalities and religions always count as ordinary words.
    dropped_as_names: list[str] = []

    def lower_case_enough(w: str) -> bool:
        low, cap = raw_lower.get(w), raw_cap.get(w)
        if low is not None:
            return low >= LOWER_CASE_RATIO * (cap or 0)
        if cap is not None:
            return False
        return w in core or g_lower.get(w, False)

    def ordinary(w: str) -> bool:
        if w in capitalised or w in ALWAYS_ORDINARY:
            keep = True
        elif w in top_given or w in top_surnames:
            keep = w in dictionary and lower_case_enough(w)
        else:
            keep = True
        if not keep:
            dropped_as_names.append(w)
        return keep

    ranked: list[str] = []
    seen: set[str] = set()

    def consider(w: str, need_dictionary: bool) -> None:
        if w in seen or not WORD_RE.fullmatch(w):
            return
        if len(w) == 1 and w not in ("a", "i"):
            return
        in_dict = w in dictionary or w in contractions
        if need_dictionary and not (in_dict or w in capitalised):
            return
        seen.add(w)
        if ordinary(w):
            ranked.append(w)

    orgtre_not_in_dictionary = [w for w in orgtre
                                if WORD_RE.fullmatch(w) and w not in dictionary
                                and w not in contractions and w not in capitalised]
    for w in orgtre:                 # hand-cleaned top 10,000, in frequency order
        consider(w, need_dictionary=True)
    n_from_orgtre = len(ranked)
    # Then the rest of Google Books by frequency. That list holds dictionary
    # headwords only, so regular inflected forms are added from SCOWL with an
    # assumed share of the base word's frequency.
    estimate: dict[str, int] = dict(g_count)
    n_inflected = 0
    for w, c in g_count.items():
        if w not in dictionary:
            continue
        for f in inflections(w):
            if f in inflectable and f not in g_count:
                if f not in estimate:
                    n_inflected += 1
                estimate[f] = max(estimate.get(f, 0), int(c * INFLECTION_SHARE))
    for w in sorted(estimate, key=lambda x: (-estimate[x], x)):
        consider(w, need_dictionary=True)

    supplement = sorted(set(UK_LETTER_WORDS))
    bad = [w for w in supplement if not WORD_RE.fullmatch(w)]
    if bad:
        sys.exit(f"supplement words in the wrong form: {bad}")
    base = set(ranked[:COMMON_TARGET])
    supplement_missing = [w for w in supplement if w not in base]
    forced = set(supplement) | contractions | EXTRA_CONTRACTIONS | {"a", "i"}
    common = set(forced)
    for w in ranked:
        if len(common) >= COMMON_TARGET:
            break
        common.add(w)
    common_top = set(ranked[:COMMON_TOP])

    # ---- names ------------------------------------------------------------
    weight: Counter = Counter()       # rough number of people, for reporting only
    by_source: dict[str, set[str]] = {}

    def add(source: str, name: str, people: int) -> None:
        toks = name_tokens(name)
        by_source.setdefault(source, set()).update(toks)
        for t in toks:
            if people > weight[t]:
                weight[t] = people

    for name, people in census[:CENSUS_TOP]:
        add("US Census 2010 surnames", name, people)
    for name, births in ons.items():
        if births >= ONS_MIN_TOTAL:
            add("ONS baby names 1996 onwards", name, births)
    for name in ons_hist:
        add("ONS historic top 100", name, 1000)
    for name, n in cso.items():
        if n >= CSO_MIN_TOTAL:
            add("CSO Ireland baby names", name, n)
    for kind in ("family", "given"):
        for name, n in wikidata[kind].items():
            if n >= WIKIDATA_MIN_COUNT:
                add(f"Wikidata {kind} names", name, n)

    all_names: set[str] = set().union(*by_source.values())
    overlap = sorted(all_names & common_top, key=lambda t: (-weight[t], t))
    names = all_names - common_top

    # ---- write ------------------------------------------------------------
    write_list(OUT_NAMES, names)
    write_list(OUT_WORDS, common)

    # ---- report -----------------------------------------------------------
    p = print
    p("\n== names.txt ==")
    p(f"tokens: {len(names):,}   bytes: {OUT_NAMES.stat().st_size:,}   gzip: {gz_size(OUT_NAMES):,}")
    for source, toks in by_source.items():
        only = toks - set().union(*(v for k, v in by_source.items() if k != source))
        p(f"  {source}: {len(toks):,} tokens before the overlap filter, {len(only):,} only here")
    p(f"  with a non-ASCII letter: {sum(1 for t in names if not t.isascii()):,}")
    p(f"removed because in the first {COMMON_TOP:,} common words: {len(overlap):,}")
    p("  30 examples (most frequent names first): " + ", ".join(overlap[:30]))
    wanted = ["will", "may", "mark", "bill", "rose", "grace", "hope", "art", "page"]
    p("  check: " + ", ".join(f"{w}={'removed' if w in overlap else 'NOT removed'}" for w in wanted))
    p(f"wikidata lists used: {len(wikidata_used)} of {len(WIKIDATA_LISTS)}: " + ", ".join(wikidata_used))
    if wikidata_missing:
        p("wikidata lists missing: " + ", ".join(wikidata_missing))

    p("\n== common-words.txt ==")
    p(f"words: {len(common):,}   bytes: {OUT_WORDS.stat().st_size:,}   gzip: {gz_size(OUT_WORDS):,}")
    p(f"  from the cleaned top-10,000 list: {n_from_orgtre:,}")
    orgtre_set = set(orgtre)
    derived = sorted(w for w in common if w not in g_count and w not in orgtre_set and w not in forced)
    p(f"  inflected forms taken from SCOWL with an estimated frequency: {len(derived):,}"
      f" (of {n_inflected:,} candidates) e.g. {', '.join(derived[:15])}")
    cut = ranked[:COMMON_TARGET][-1]
    p(f"  last word by rank: {cut} (estimated count {estimate.get(cut, 0):,})")
    top_cleaned = set(orgtre[:COMMON_TOP])
    in_top = [w for w in sorted(set(dropped_as_names), key=dropped_as_names.index) if w in top_cleaned]
    p(f"  cleaned-list top-{COMMON_TOP:,} words left out as names: {len(in_top)}: {', '.join(in_top)}")
    p(f"  cleaned-list words left out because not in the dictionary: {len(orgtre_not_in_dictionary):,}"
      f" e.g. {', '.join(orgtre_not_in_dictionary[:25])}")
    uniq_dropped = sorted(set(dropped_as_names), key=dropped_as_names.index)
    p(f"  left out as names (frequent name, not an ordinary lower-case word): {len(uniq_dropped):,}"
      f" e.g. {', '.join(uniq_dropped[:40])}")
    p(f"  UK letter words checked: {len(supplement)}; missing from the top {COMMON_TARGET:,} and added: "
      f"{len(supplement_missing)}")
    p("    added: " + ", ".join(supplement_missing))
    p(f"  contractions included: {len(contractions | EXTRA_CONTRACTIONS)}"
      f" ({len(EXTRA_CONTRACTIONS - contractions)} of them added by hand)")
    p(f"  words that are in both files (name or word, depending on context): {len(names & common):,}")
    p(f"  dictionary entries (SCOWL sizes up to {SCOWL_MAX_SIZE}): {len(dictionary):,}")
    still = sorted((top_given | top_surnames) & common - dictionary - contractions)
    p(f"  frequent names in the list that are not dictionary entries: {len(still)} {still[:20]}")


def main() -> None:
    args = set(sys.argv[1:])
    unknown = args - {"--offline", "--fetch-only", "--no-wikidata"}
    if unknown:
        sys.exit(f"unknown option {unknown}; see the top of this file")
    offline = "--offline" in args
    RAW.mkdir(parents=True, exist_ok=True)
    fetch_files(offline)
    missing = fetch_wikidata(offline, "--no-wikidata" in args)
    if "--fetch-only" in args:
        print("wikidata lists missing: " + (", ".join(missing) or "none"))
        return
    build(missing)


if __name__ == "__main__":
    main()
