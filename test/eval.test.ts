import { describe, expect, it } from 'vitest';
import { detect, type Extractor } from '../src/airlock';
import { FIXTURES } from '../src/eval/fixtures';
import { HOLDOUT } from '../src/eval/holdout';
import { scoreDoc, summarise, verdict } from '../src/eval/score';

describe('fixtures', () => {
  it('has unique ids', () => {
    expect(new Set([...FIXTURES, ...HOLDOUT].map((f) => f.id)).size).toBe(FIXTURES.length + HOLDOUT.length);
  });

  it.each([...FIXTURES, ...HOLDOUT].map((f) => [f.id, f] as const))('%s: every label appears in the letter', (_id, f) => {
    for (const item of f.gold) expect(f.text, `gold "${item.value}"`).toContain(item.value);
    for (const value of f.keep) expect(f.text, `keep "${value}"`).toContain(value);
  });
});

describe('scoring', () => {
  it('reports no-model when only patterns ran, and names never count as hidden', async () => {
    const docs = [];
    for (const f of FIXTURES) docs.push(scoreDoc(f, await detect(f.text), 1, 0));
    const s = summarise(docs);
    expect(verdict(s).level).toBe('no-model');
    expect(s.byKind.PERSON?.hidden).toBe(0);
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
    const f = FIXTURES.find((x) => x.id === 'council-tax')!;
    const sloppy: Extractor = async () => [
      { kind: 'PERSON', value: 'Mr Oluwaseun Adebayo' },
      { kind: 'OTHER', value: 'Harrowden Borough Council' },
      { kind: 'PERSON', value: 'Someone Else Entirely' },
    ];
    const d = scoreDoc(f, await detect(f.text, sloppy), 1, 3);
    const s = summarise([d]);
    expect(d.modelSpansRaw).toBe(3);
    expect(d.modelSpansUsed).toBe(2);
    expect(s.overRedacted).toEqual([{ doc: 'council-tax', value: 'Harrowden Borough Council' }]);
    // "Dear Mr Adebayo" is a different span from "Mr Oluwaseun Adebayo"; name parts cover it.
    expect(s.misses.map((m) => m.value)).not.toContain('Adebayo');
    expect(s.misses.map((m) => m.value)).not.toContain('Oluwaseun');
    // The signing officer was never returned by the extractor, so she still leaks.
    expect(s.misses.map((m) => m.value)).toContain('Ramanathan');
    expect(verdict(s).level).toBe('fail');
  });
});
