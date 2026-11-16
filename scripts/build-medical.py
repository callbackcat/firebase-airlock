"""Build src/data/medical.txt: medicines, conditions, tests, procedures and
terms named after people, as lower-case phrases, one per line.

Source: Wikidata (https://www.wikidata.org), English labels and aliases.
Licence: CC0 1.0 ("All structured data from the main, Property, Lexeme, and
EntitySchema namespaces is available under the Creative Commons CC0 License",
https://www.wikidata.org/wiki/Wikidata:Licensing).

    python scripts/build-medical.py

Raw query results go to outside-data/wordlists-raw/wikidata-medical/ (git-
ignored) and are reused when present.
"""
import gzip
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'outside-data', 'wordlists-raw', 'wikidata-medical')
OUT = os.path.join(HERE, '..', 'src', 'data', 'medical.txt')
ENDPOINT = 'https://query.wikidata.org/sparql'

LABELS = """
  {{ ?i rdfs:label ?l . FILTER(LANG(?l) = "en") }} UNION {{ ?i skos:altLabel ?l . FILTER(LANG(?l) = "en") }}
"""

# name -> the part of the WHERE clause that picks the items
QUERIES = {
    # Anything with an ATC code is a medicine.
    'medicines-atc': '?i wdt:P267 ?code .',
    'medicines-class': 'VALUES ?c { wd:Q12140 wd:Q28885102 wd:Q8386 } ?i wdt:P31 ?c .',
    'diseases': '?i wdt:P31 wd:Q12136 .',
    'diseases-rare': '?i wdt:P31 wd:Q929833 .',
    'syndromes': '?i wdt:P31 wd:Q179630 .',
    'symptoms-signs': 'VALUES ?c { wd:Q169872 wd:Q1441305 } ?i wdt:P31 ?c .',
    'tests-procedures': 'VALUES ?c { wd:Q2671652 wd:Q796194 wd:Q39833 wd:Q24034552 } ?i wdt:P31 ?c .',
    # Medical things named after a person, whatever their class: keep those with a health-related identifier.
    'eponyms-mesh': '?i wdt:P138 ?p . ?p wdt:P31 wd:Q5 . ?i wdt:P486 ?mesh .',
    'eponyms-icd': '?i wdt:P138 ?p . ?p wdt:P31 wd:Q5 . { ?i wdt:P494 ?icd } UNION { ?i wdt:P7807 ?icd11 } UNION { ?i wdt:P2892 ?umls } .',
    'vaccines-bacteria': 'VALUES ?c { wd:Q134808 } ?i wdt:P31 ?c .',
    # Everything with an ICD-10 code is a condition.
    'icd10': '?i wdt:P494 ?icd .',
    # MeSH tree numbers: C diseases, E techniques and equipment, D chemicals and drugs.
    'mesh-diseases': '?i wdt:P672 ?tree . FILTER(STRSTARTS(?tree, "C"))',
    'mesh-techniques': '?i wdt:P672 ?tree . FILTER(STRSTARTS(?tree, "E0"))',
    'mesh-drugs': '?i wdt:P672 ?tree . FILTER(STRSTARTS(?tree, "D"))',
}


def run(name, where):
    path = os.path.join(RAW, name + '.json')
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return json.load(open(path, encoding='utf8'))
    query = 'SELECT DISTINCT ?l WHERE { %s %s }' % (where, LABELS.format())
    url = ENDPOINT + '?' + urllib.parse.urlencode({'query': query, 'format': 'json'})
    req = urllib.request.Request(url, headers={'User-Agent': 'wordlist-builder/1.0 (generic client)', 'Accept': 'application/sparql-results+json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            labels = [b['l']['value'] for b in data['results']['bindings']]
            json.dump(labels, open(path, 'w', encoding='utf8'), ensure_ascii=False)
            time.sleep(65)
            return labels
        except Exception as err:  # noqa: BLE001
            print('  %s: attempt %d failed: %s' % (name, attempt + 1, str(err)[:100]), file=sys.stderr)
            time.sleep(70)
    return []


def clean(label):
    s = label.strip().lower().replace('’', "'").replace('‘', "'")
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s)  # a trailing "(disorder)" and the like
    s = ' '.join(s.split())
    if not (3 <= len(s) <= 48) or len(s.split()) > 4:
        return None
    if not re.fullmatch(r"[a-zÀ-ɏ][a-zÀ-ɏ0-9' .,/+-]*", s):
        return None
    if re.fullmatch(r'[a-z]\d+.*', s) or s.isdigit():
        return None
    return s


def main():
    os.makedirs(RAW, exist_ok=True)
    phrases = set()
    counts = {}
    for name, where in QUERIES.items():
        labels = run(name, where)
        kept = {c for c in (clean(x) for x in labels) if c}
        # The two largest sources are mostly obscure: keep their short, plain entries only.
        if name == 'mesh-drugs':
            kept = {k for k in kept if len(k.split()) <= 2 and re.fullmatch(r"[a-zÀ-ɏ' -]+", k)}
        if name == 'diseases-rare':
            kept = {k for k in kept if len(k.split()) <= 3}
        counts[name] = (len(labels), len(kept))
        phrases |= kept
    out = sorted(phrases)
    with io.open(OUT, 'w', encoding='utf8', newline='\n') as f:
        f.write('\n'.join(out) + '\n')
    size = len(gzip.compress(('\n'.join(out)).encode('utf8')))
    for name, (raw, kept) in counts.items():
        print('%-20s %6d labels, %6d kept' % (name, raw, kept))
    print('medical.txt: %d phrases, %d single words, %.0f KB raw, %.0f KB gzip' % (len(out), sum(1 for p in out if ' ' not in p), os.path.getsize(OUT) / 1024, size / 1024))


if __name__ == '__main__':
    main()
