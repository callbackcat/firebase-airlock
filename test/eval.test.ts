import { describe, expect, it } from 'vitest';
import { detect, type Extractor } from '../src/airlock';
import { FIXTURES } from '../src/eval/fixtures';
import { HOLDOUT } from '../src/eval/holdout';
import { HOLDOUT2 } from '../src/eval/holdout2';
import { HOLDOUT3 } from '../src/eval/holdout3';
import { HOLDOUT4 } from '../src/eval/holdout4';
import { scoreDoc, summarise, verdict } from '../src/eval/score';

const ALL = [...FIXTURES, ...HOLDOUT, ...HOLDOUT2, ...HOLDOUT3, ...HOLDOUT4];

describe('fixtures', () => {
  it('has unique ids', () => {
    expect(new Set(ALL.map((f) => f.id)).size).toBe(ALL.length);
  });

  it.each(ALL.map((f) => [f.id, f] as const))('%s: every label appears in the letter', (_id, f) => {
    for (const item of f.gold) expect(f.text, `gold "${item.value}"`).toContain(item.value);
    for (const value of f.keep) expect(f.text, `keep "${value}"`).toContain(value);
  });
});

describe('scoring', () => {
  it('reports no-model when only patterns ran, whatever the patterns hid', async () => {
    const docs = [];
    for (const f of FIXTURES) docs.push(scoreDoc(f, await detect(f.text), 1, 0));
    const s = summarise(docs);
    expect(verdict(s).level).toBe('no-model');
    expect(s.byKind.PERSON?.recall).toBeLessThan(1);
    expect(s.byKind.POSTCODE?.recall).toBe(1);
    expect(s.byKind.EMAIL?.recall).toBe(1);
    expect(s.keep.rate).toBe(1);
  });

  it('passes with an extractor that returns exactly the labels', async () => {
    const docs = [];
    for (const f of FIXTURES) {
      const perfect: Extractor = async () => f.gold.map((g) => ({ kind: g.kind, value: g.value }));
      docs.push(scoreDoc(f, await detect(f.text, perfect), 1, f.gold.length));
    }
    const s = summarise(docs);
    expect(s.all.recall).toBe(1);
    expect(s.misses).toEqual([]);
    expect(s.keep.rate).toBe(1);
    expect(verdict(s).level).toBe('pass');
  });

  it('counts over-redaction and misses', async () => {
    const f = {
      id: 'synthetic',
      title: 'Synthetic',
      text: 'Hartwell Housing Trust\n\nThe flat was let to Tomas Varga. Ask for Varga or for Quill at the desk.\nRent is £500.',
      gold: [
        { kind: 'PERSON' as const, value: 'Tomas', who: 'subject' as const },
        { kind: 'PERSON' as const, value: 'Varga', who: 'subject' as const },
        { kind: 'PERSON' as const, value: 'Quill', who: 'other' as const },
      ],
      keep: ['Hartwell Housing Trust', '£500'],
    };
    const sloppy: Extractor = async () => [
      { kind: 'PERSON', value: 'Tomas Varga' },
      { kind: 'OTHER', value: 'Hartwell Housing Trust' },
      { kind: 'PERSON', value: 'Someone Else Entirely' },
    ];
    const d = scoreDoc(f, await detect(f.text, sloppy), 1, 3);
    const s = summarise([d]);
    expect(d.modelSpansRaw).toBe(3);
    expect(d.modelSpansUsed).toBe(2);
    expect(s.overRedacted).toEqual([{ doc: 'synthetic', value: 'Hartwell Housing Trust' }]);
    // "Ask for Varga" is a different span from "Tomas Varga"; name parts cover it.
    expect(s.misses.map((m) => m.value)).toEqual(['Quill']);
    expect(s.subject.recall).toBe(1);
    expect(s.other.recall).toBe(0);
  });
});
