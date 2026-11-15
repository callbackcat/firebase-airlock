import { findLeaks, redact, type Detection, type EntityKind } from '../airlock';
import { findSuspects, type Suspect } from '../suspects';
import type { Fixture, Gold } from './fixtures';
import { MEDICAL_KEEP } from './medical';

/** True when `value` can no longer be read in `text`. */
const hidden = (text: string, value: string) => findLeaks(text, { x: value }).length === 0;

export interface ItemScore extends Gold {
  /** Hidden by the fixed patterns alone, with no model. */
  hiddenByPatterns: boolean;
  /** Hidden by patterns plus the on-device model. */
  hidden: boolean;
  /** Not hidden, but marked for the reviewer to look at. */
  flagged: boolean;
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
  keep: Array<{ value: string; kept: boolean; medical: boolean; high: boolean }>;
  /** Every value that was hidden, and whether it was personal. For precision. */
  hiddenValues: Array<{ value: string; personal: boolean; quasi: boolean }>;
  /** Quasi-identifiers and whether each is still readable. */
  quasi: Array<{ value: string; readable: boolean }>;
  /** Characters in the document. */
  chars: number;
  /** Milliseconds until the text was safe to send. Equal to `ms` unless the scrub hides first. */
  safeMs?: number;
  /** On-device calls made for this letter. */
  calls?: number;
  /** How many spans the review step marks in the outgoing text. */
  suspects: number;
  /** Words in the outgoing text, to put the number of suspects in proportion. */
  words: number;
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
  const suspects = findSuspects(full);

  return {
    id: fixture.id,
    title: fixture.title,
    modelUsed: detection.modelUsed,
    modelError: detection.modelError,
    ms,
    modelSpansRaw,
    modelSpansUsed: detection.entities.filter((e) => e.source === 'model' && !e.derived).length,
    items: fixture.gold.map((item) => ({
      ...item,
      hiddenByPatterns: hidden(patternsOnly, item.value),
      hidden: hidden(full, item.value),
      flagged: !hidden(full, item.value) && coveredBy(full, item.value, suspects),
    })),
    keep: fixture.keep.map((value) => ({
      value,
      kept: !hidden(full, value),
      medical: fixture.medical ? fixture.medical.includes(value) : MEDICAL_KEEP.has(value),
      high: fixture.medicalHigh?.includes(value) ?? false,
    })),
    hiddenValues: hiddenValues(fixture, detection),
    quasi: (fixture.quasi ?? []).map((value) => ({ value, readable: !hidden(full, value) })),
    chars: fixture.text.length,
    suspects: suspects.length,
    words: full.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * What was hidden, value by value. A hidden value counts as personal when it
 * overlaps a labelled detail in either direction ("Mrs Eleanor Whitfield"
 * covers "Whitfield"), and as a quasi-identifier when it overlaps one of those.
 */
function hiddenValues(fixture: Fixture, detection: Detection): DocScore['hiddenValues'] {
  const lower = fixture.text.toLowerCase();
  const seen = new Set<string>();
  const out: DocScore['hiddenValues'] = [];
  const overlaps = (a: string, list: string[]) => list.some((b) => a.includes(b) || b.includes(a));
  const gold = fixture.gold.map((g) => g.value.toLowerCase());
  const quasi = (fixture.quasi ?? []).map((q) => q.toLowerCase());
  for (const e of detection.entities) {
    const key = e.value.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key) || !lower.replace(/\s+/g, ' ').includes(key)) continue;
    seen.add(key);
    const personal = overlaps(key, gold);
    out.push({ value: e.value, personal, quasi: !personal && overlaps(key, quasi) });
  }
  return out;
}

/** True when every place `value` is still readable sits inside a marked span. */
function coveredBy(text: string, value: string, suspects: Suspect[]): boolean {
  let from = 0;
  let seen = false;
  for (;;) {
    const at = text.indexOf(value, from);
    if (at < 0) return seen;
    seen = true;
    const end = at + value.length;
    // A suspect that overlaps the value draws the eye to it.
    if (!suspects.some((s) => s.start < end && at < s.end)) return false;
    from = end;
  }
}

export interface Tally {
  total: number;
  hiddenByPatterns: number;
  hidden: number;
  /** Missed by the scrub but marked for review. */
  flagged: number;
  /** (hidden + flagged) / total: what a reviewer who checks every mark would catch. */
  reviewRecall: number | null;
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
  /** The same for medicines, conditions, tests, procedures and doses only. */
  medical: { total: number; kept: number; rate: number | null };
  /** On-device calls, all letters together. */
  calls: number;
  model: { spansRaw: number; spansUsed: number };
  medianMs: number;
  /** Review marks per letter, and per 100 words, on average. */
  suspects: { perLetter: number; per100Words: number };
  misses: Array<{ doc: string; kind: EntityKind; value: string; who: string; flagged: boolean }>;
  overRedacted: Array<{ doc: string; value: string }>;
}

function tally(items: ItemScore[]): Tally {
  const total = items.length;
  const h = items.filter((i) => i.hidden).length;
  return {
    total,
    hiddenByPatterns: items.filter((i) => i.hiddenByPatterns).length,
    hidden: h,
    flagged: items.filter((i) => i.flagged).length,
    reviewRecall: total ? (h + items.filter((i) => i.flagged).length) / total : null,
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
  const medical = keep.filter((k) => k.medical);
  const medicalKept = medical.filter((k) => k.kept).length;

  return {
    docs: docs.length,
    docsWithModel: docs.filter((d) => d.modelUsed).length,
    all: tally(items),
    subject: tally(items.filter((i) => i.who !== 'other')),
    other: tally(items.filter((i) => i.who === 'other')),
    byKind,
    keep: { total: keep.length, kept, rate: keep.length ? kept / keep.length : null },
    medical: { total: medical.length, kept: medicalKept, rate: medical.length ? medicalKept / medical.length : null },
    calls: docs.reduce((n, d) => n + (d.calls ?? 0), 0),
    model: {
      spansRaw: docs.reduce((n, d) => n + d.modelSpansRaw, 0),
      spansUsed: docs.reduce((n, d) => n + d.modelSpansUsed, 0),
    },
    medianMs: times.length ? times[Math.floor(times.length / 2)] : 0,
    suspects: {
      perLetter: docs.length ? docs.reduce((n, d) => n + d.suspects, 0) / docs.length : 0,
      per100Words: (100 * docs.reduce((n, d) => n + d.suspects, 0)) / Math.max(1, docs.reduce((n, d) => n + d.words, 0)),
    },
    misses: docs.flatMap((d) =>
      d.items
        .filter((i) => !i.hidden)
        .map((i) => ({ doc: d.id, kind: i.kind, value: i.value, who: i.who ?? 'subject', flagged: i.flagged })),
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
