import { findLeaks, redact, type Detection, type EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/** True when `value` can no longer be read in `text`. */
const hidden = (text: string, value: string) => findLeaks(text, { x: value }).length === 0;

export interface ItemScore extends Gold {
  /** Hidden by the fixed patterns alone, with no model. */
  hiddenByPatterns: boolean;
  /** Hidden by patterns plus the on-device model. */
  hidden: boolean;
}

export interface DocScore {
  id: string;
  title: string;
  modelUsed: boolean;
  modelError?: string;
  ms: number;
  /** Spans the model returned, and how many survived validation. */
  modelSpansRaw: number;
  modelSpansUsed: number;
  items: ItemScore[];
  keep: Array<{ value: string; kept: boolean }>;
}

export function scoreDoc(
  fixture: Fixture,
  detection: Detection,
  ms: number,
  modelSpansRaw: number,
): DocScore {
  const patternsOnly = redact(
    fixture.text,
    detection.entities.filter((e) => e.source === 'regex'),
  ).redacted;
  const full = redact(fixture.text, detection.entities).redacted;

  return {
    id: fixture.id,
    title: fixture.title,
    modelUsed: detection.modelUsed,
    modelError: detection.modelError,
    ms,
    modelSpansRaw,
    modelSpansUsed: detection.entities.filter((e) => e.source === 'model').length,
    items: fixture.gold.map((item) => ({
      ...item,
      hiddenByPatterns: hidden(patternsOnly, item.value),
      hidden: hidden(full, item.value),
    })),
    keep: fixture.keep.map((value) => ({ value, kept: !hidden(full, value) })),
  };
}

export interface Tally {
  total: number;
  hiddenByPatterns: number;
  hidden: number;
  /** hidden / total, or null when there is nothing to count. */
  recall: number | null;
}

export interface Summary {
  docs: number;
  docsWithModel: number;
  all: Tally;
  /** Details of the person the letter is about. The number that matters most. */
  subject: Tally;
  /** Staff and third parties named in the letter. */
  other: Tally;
  byKind: Partial<Record<EntityKind, Tally>>;
  /** Share of useful facts that survived redaction. */
  keep: { total: number; kept: number; rate: number | null };
  model: { spansRaw: number; spansUsed: number };
  medianMs: number;
  misses: Array<{ doc: string; kind: EntityKind; value: string; who: string }>;
  overRedacted: Array<{ doc: string; value: string }>;
}

function tally(items: ItemScore[]): Tally {
  const total = items.length;
  const h = items.filter((i) => i.hidden).length;
  return {
    total,
    hiddenByPatterns: items.filter((i) => i.hiddenByPatterns).length,
    hidden: h,
    recall: total ? h / total : null,
  };
}

export function summarise(docs: DocScore[]): Summary {
  const items = docs.flatMap((d) => d.items);
  const keep = docs.flatMap((d) => d.keep);
  const byKind: Partial<Record<EntityKind, Tally>> = {};
  for (const kind of new Set(items.map((i) => i.kind))) {
    byKind[kind] = tally(items.filter((i) => i.kind === kind));
  }
  const times = docs.map((d) => d.ms).sort((a, b) => a - b);
  const kept = keep.filter((k) => k.kept).length;

  return {
    docs: docs.length,
    docsWithModel: docs.filter((d) => d.modelUsed).length,
    all: tally(items),
    subject: tally(items.filter((i) => i.who !== 'other')),
    other: tally(items.filter((i) => i.who === 'other')),
    byKind,
    keep: { total: keep.length, kept, rate: keep.length ? kept / keep.length : null },
    model: {
      spansRaw: docs.reduce((n, d) => n + d.modelSpansRaw, 0),
      spansUsed: docs.reduce((n, d) => n + d.modelSpansUsed, 0),
    },
    medianMs: times.length ? times[Math.floor(times.length / 2)] : 0,
    misses: docs.flatMap((d) =>
      d.items
        .filter((i) => !i.hidden)
        .map((i) => ({ doc: d.id, kind: i.kind, value: i.value, who: i.who ?? 'subject' })),
    ),
    overRedacted: docs.flatMap((d) =>
      d.keep.filter((k) => !k.kept).map((k) => ({ doc: d.id, value: k.value })),
    ),
  };
}

/**
 * A rough reading of the result. The thresholds are a starting judgement, not
 * a standard: a privacy tool that leaks one detail in ten is not doing its job.
 */
export function verdict(s: Summary): { level: 'pass' | 'marginal' | 'fail' | 'no-model'; reason: string } {
  if (s.docsWithModel < s.docs) {
    return {
      level: 'no-model',
      reason: `The on-device model ran on ${s.docsWithModel} of ${s.docs} letters. These numbers describe the fixed patterns, not the product.`,
    };
  }
  const recall = s.subject.recall ?? 0;
  const keepRate = s.keep.rate ?? 0;
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const line = `Subject details hidden: ${pct(recall)}. Useful facts kept: ${pct(keepRate)}.`;
  if (recall >= 0.95 && keepRate >= 0.9) return { level: 'pass', reason: line };
  if (recall >= 0.85 && keepRate >= 0.8) return { level: 'marginal', reason: line };
  return { level: 'fail', reason: line };
}
