"""Prepare the Text Anonymization Benchmark (TAB) for a local measurement.

TAB is real text: judgments of the European Court of Human Rights, with every
personal detail labelled by hand. It is used under CLAUDE.md rule 4's
exception: locally, git-ignored, on-device scrub only, no cloud call, and no
output holding its names is written to the repository.

    python scripts/fetch-tab.py

Downloads two files from GitHub at a pinned commit into outside-data/tab/
(skipped when already there) and writes:

    outside-data/tab/tab-train10.json   10 train documents, to debug the mapping
    outside-data/tab/tab-test100.json   100 test documents, measured once
    outside-data/tab/stats.json         counts only

Label mapping (TAB's own `identifier_type`):
    DIRECT   must be hidden            -> gold
    QUASI    counted, no pass or fail  -> quasi
    NO_MASK  should stay readable      -> keep

More than one annotator: a detail is DIRECT if any annotator marked it DIRECT,
otherwise QUASI if any marked it QUASI, otherwise NO_MASK. That is the
strictest reading for the scrub.

Entity level: TAB gives every mention an `entity_id`. Each written form of a
DIRECT entity becomes one gold item carrying that id; the summary counts an
entity as hidden only when all its forms are.
"""
import json
import os
import random
import sys
import urllib.request

COMMIT = '558e09e26d6b36f5f78440074e6a233946d98bd9'
BASE = 'https://raw.githubusercontent.com/NorskRegnesentral/text-anonymization-benchmark/' + COMMIT + '/'
SEED = 20261116
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'outside-data', 'tab')
KIND = {'PERSON': 'PERSON', 'CODE': 'ID_NUMBER', 'LOC': 'ADDRESS', 'DATETIME': 'DOB'}
RANK = {'DIRECT': 0, 'QUASI': 1, 'NO_MASK': 2}


def fetch(name):
    path = os.path.join(ROOT, name)
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        req = urllib.request.Request(BASE + name, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r, open(path, 'wb') as out:
            out.write(r.read())
    with open(path, encoding='utf8') as f:
        return json.load(f)


def convert(doc, doc_id):
    text = doc['text']
    # One entry per written form, with the strictest label any annotator gave it.
    forms = {}
    for annotator in sorted(doc['annotations']):
        for m in doc['annotations'][annotator]['entity_mentions']:
            value = text[m['start_offset']:m['end_offset']]
            if len(value.strip()) < 2 or m['identifier_type'] not in RANK:
                continue
            key = ' '.join(value.lower().split())
            old = forms.get(key)
            if old is None or RANK[m['identifier_type']] < RANK[old['id_type']]:
                forms[key] = {'value': value, 'id_type': m['identifier_type'], 'type': m['entity_type'], 'entity': m['entity_id']}
    direct = [f for f in forms.values() if f['id_type'] == 'DIRECT']
    quasi = [f for f in forms.values() if f['id_type'] == 'QUASI']
    masked = [' '.join(f['value'].lower().split()) for f in direct + quasi]
    keep = []
    for key, f in forms.items():
        if f['id_type'] != 'NO_MASK':
            continue
        # A span that holds a detail which must or may be hidden cannot be asked to stay readable.
        if any(m in key or key in m for m in masked):
            continue
        keep.append(f['value'])
    return {
        'id': doc_id,
        'title': 'court judgment',
        'text': text,
        'gold': [{'kind': KIND.get(f['type'], 'OTHER'), 'value': f['value'], 'who': 'subject', 'label': f['type'], 'entity': f['entity']} for f in direct],
        'keep': keep,
        'quasi': [f['value'] for f in quasi],
    }


def pick(docs, n, prefix):
    order = list(range(len(docs)))
    random.Random(SEED).shuffle(order)
    out = []
    for i in order:
        c = convert(docs[i], '%s-%03d' % (prefix, len(out) + 1))
        if c['gold']:
            out.append(c)
        if len(out) == n:
            break
    return out


def main():
    os.makedirs(ROOT, exist_ok=True)
    train = pick(fetch('echr_train.json'), 10, 'tab-train')
    test = pick(fetch('echr_test.json'), 100, 'tab-test')
    stats = {}
    for name, docs in (('tab-train10', train), ('tab-test100', test)):
        with open(os.path.join(ROOT, name + '.json'), 'w', encoding='utf8') as f:
            json.dump(docs, f, ensure_ascii=False)
        by_type = {}
        for d in docs:
            for g in d['gold']:
                by_type[g['label']] = by_type.get(g['label'], 0) + 1
        lengths = sorted(len(d['text']) for d in docs)
        stats[name] = {
            'documents': len(docs),
            'direct_forms': sum(len(d['gold']) for d in docs),
            'direct_entities': sum(len({g['entity'] for g in d['gold']}) for d in docs),
            'direct_forms_by_type': by_type,
            'quasi_forms': sum(len(d['quasi']) for d in docs),
            'no_mask_forms': sum(len(d['keep']) for d in docs),
            'chars_median': lengths[len(lengths) // 2],
            'chars_max': lengths[-1],
        }
    with open(os.path.join(ROOT, 'stats.json'), 'w', encoding='utf8') as f:
        json.dump({'commit': COMMIT, 'seed': SEED, 'sets': stats}, f, indent=2)
    json.dump(stats, sys.stdout, indent=2)


if __name__ == '__main__':
    main()
