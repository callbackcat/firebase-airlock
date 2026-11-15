/**
 * Airlock core: find personal data, swap it for placeholders, put it back later.
 *
 * This file has no Firebase or DOM imports on purpose. The on-device model is
 * injected as an `Extractor`, so the whole pipeline can be unit-tested and
 * reused around any model call.
 */

export const ENTITY_KINDS = [
  'PERSON',
  'ADDRESS',
  'POSTCODE',
  'EMAIL',
  'PHONE',
  'DOB',
  'ID_NUMBER',
  'ACCOUNT',
  'CARD',
  'OTHER',
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];
export type EntitySource = 'regex' | 'model' | 'manual';

export interface Entity {
  kind: EntityKind;
  value: string;
  source: EntitySource;
  /** True when this was worked out from another entity (a part of a full name). */
  derived?: boolean;
}

export interface PlacedEntity extends Entity {
  placeholder: string;
  count: number;
}

export interface Redaction {
  /** The text that is safe to send: originals replaced by placeholders. */
  redacted: string;
  /** placeholder -> original value. Never leaves the device. */
  vault: Record<string, string>;
  entities: PlacedEntity[];
}

/** What the on-device model returns before validation. */
export interface RawEntity {
  kind: string;
  value: string;
}

/** Runs one chunk of text through a model and returns the spans it found. */
export type Extractor = (chunk: string) => Promise<RawEntity[]>;

// ---------------------------------------------------------------------------
// 1. Deterministic layer: patterns a regex catches more reliably than a model
// ---------------------------------------------------------------------------

interface Detector {
  kind: EntityKind;
  pattern: RegExp;
  /** Use capture group 1 as the value (for patterns that need context). */
  group?: boolean;
  accept?: (value: string) => boolean;
}

const luhn = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

// UK-leaning on purpose: the demo documents are UK letters. Add locales here.
const DETECTORS: Detector[] = [
  { kind: 'EMAIL', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: 'CARD', pattern: /\b\d(?:[ -]?\d){12,18}\b/g, accept: luhn },
  { kind: 'ACCOUNT', pattern: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,3})?\b/g },
  { kind: 'ACCOUNT', pattern: /\b\d{2}-\d{2}-\d{2}\b/g },
  {
    kind: 'ACCOUNT',
    pattern: /account(?:\s+(?:no|number))?\.?\s*:?\s*(\d{8})\b/gi,
    group: true,
  },
  { kind: 'ID_NUMBER', pattern: /\b\d{3} \d{3} \d{4}\b/g },
  {
    kind: 'ID_NUMBER',
    pattern: /\b[A-CEGHJ-PR-TW-Z]{2} ?\d{2} ?\d{2} ?\d{2} ?[A-D]\b/g,
  },
  {
    // Anything introduced by a label: "Our ref: AB/123/C", "Policy number: X-9",
    // "Employee number 0042". The value is capitals and digits and must hold a digit.
    kind: 'ID_NUMBER',
    pattern:
      /\b(?:[Rr]ef(?:erence)?|REF(?:ERENCE)?|[Nn]umber|NUMBER|[Nn]o\.|NO\.|ID)(?:\s*:\s*|\s+)([A-Z0-9]+(?:[\/-][A-Z0-9]+)*(?: \d+[A-Z0-9]*)?)/g,
    group: true,
    accept: (v) => v.length >= 4 && /\d/.test(v),
  },
  // UK vehicle registration, current format.
  { kind: 'OTHER', pattern: /\b[A-Z]{2}\d{2} ?[A-Z]{3}\b/g },
  {
    kind: 'PHONE',
    pattern: /(?:\+44 ?\d{2,4}|\(?0\d{2,4}\)?)[ -]?\d{3,4}[ -]?\d{3,4}\b/g,
  },
  { kind: 'POSTCODE', pattern: /\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/g },
  {
    kind: 'DOB',
    pattern:
      /(?:date of birth|d\.?o\.?b\.?|born(?: on)?)\s*:?\s*(\d{1,2}(?:[\/.-]\d{1,2}[\/.-]|\s+[A-Za-z]{3,9}\s+)\d{2,4})/gi,
    group: true,
  },
];

export function detectWithRegex(text: string): Entity[] {
  const found: Entity[] = [];
  for (const d of DETECTORS) {
    for (const m of text.matchAll(d.pattern)) {
      const value = (d.group ? m[1] : m[0])?.trim();
      if (!value) continue;
      if (d.accept && !d.accept(value)) continue;
      found.push({ kind: d.kind, value, source: 'regex' });
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// 2. Model layer: names, addresses and anything else that needs reading
// ---------------------------------------------------------------------------

/**
 * Split text so each request stays well inside the on-device context window
 * (9,216 tokens shared by input and output). Splits on blank lines first.
 */
export function chunkText(text: string, maxChars = 4000): string[] {
  const chunks: string[] = [];
  let current = '';
  const push = () => {
    if (current.trim()) chunks.push(current);
    current = '';
  };
  for (const para of text.split(/(\n\s*\n)/)) {
    if (current.length + para.length > maxChars) push();
    if (para.length > maxChars) {
      for (let i = 0; i < para.length; i += maxChars) {
        chunks.push(para.slice(i, i + maxChars));
      }
      continue;
    }
    current += para;
  }
  push();
  return chunks;
}

const isKind = (k: string): k is EntityKind =>
  (ENTITY_KINDS as readonly string[]).includes(k);

/**
 * Keep only spans that literally occur in the source text. A small model will
 * sometimes paraphrase or invent a value; an invented value redacts nothing
 * and would only pollute the vault.
 */
export function validateModelEntities(text: string, raw: RawEntity[]): Entity[] {
  const out: Entity[] = [];
  for (const r of raw) {
    if (!r || typeof r.value !== 'string') continue;
    const value = r.value.trim();
    if (value.length < 2) continue;
    const hit = matcher(value).exec(text);
    if (!hit) continue;
    const kind = String(r.kind ?? '').toUpperCase();
    out.push({ kind: isKind(kind) ? kind : 'OTHER', value: hit[0], source: 'model' });
  }
  return out;
}

const TITLES = new Set([
  'mr', 'mrs', 'ms', 'miss', 'mx', 'dr', 'prof', 'professor', 'sir', 'dame', 'lord', 'lady', 'rev', 'cllr',
]);
// A name part that is also an everyday capitalised word would hide useful facts.
const NOT_A_NAME_PART = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
  'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'and', 'the',
]);

/**
 * A letter names someone in full once ("Mr Oluwaseun Adebayo") and by one part
 * afterwards ("Dear Mr Adebayo", "Dear Oluwaseun"). The model usually returns
 * only the full form, so add each part of a person's name as its own entity.
 */
export function expandNameParts(entities: Entity[]): Entity[] {
  const out: Entity[] = [];
  for (const e of entities) {
    if (e.kind !== 'PERSON') continue;
    for (const raw of e.value.split(/[\s,&]+/)) {
      const part = raw.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      const key = part.toLowerCase();
      if (part.length < 3 || !/^\p{Lu}/u.test(part)) continue;
      if (TITLES.has(key) || NOT_A_NAME_PART.has(key)) continue;
      if (normalise(part) === normalise(e.value)) continue;
      out.push({ kind: 'PERSON', value: part, source: e.source, derived: true });
    }
  }
  return out;
}

export interface Detection {
  entities: Entity[];
  /** False when no extractor was given or it failed: regex-only coverage. */
  modelUsed: boolean;
  modelError?: string;
}

export async function detect(text: string, extract?: Extractor): Promise<Detection> {
  const entities = detectWithRegex(text);
  if (!extract) return { entities, modelUsed: false };
  try {
    for (const chunk of chunkText(text)) {
      entities.push(...validateModelEntities(text, await extract(chunk)));
    }
    entities.push(...expandNameParts(entities));
    return { entities, modelUsed: true };
  } catch (err) {
    return {
      entities: entities.filter((e) => e.source !== 'model'),
      modelUsed: false,
      modelError: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Redact and rehydrate
// ---------------------------------------------------------------------------

export const normalise = (v: string) => v.toLowerCase().replace(/\s+/g, ' ').trim();

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Case-insensitive, whitespace-tolerant matcher for one value. A name wrapped
 * across two lines still matches, and "Ann" does not match inside "Annual".
 */
function matcher(value: string, flags = 'iu'): RegExp {
  const body = value.trim().split(/\s+/).map(escapeRegExp).join('\\s+');
  const startsWord = /^[\p{L}\p{N}]/u.test(value.trim());
  const endsWord = /[\p{L}\p{N}]$/u.test(value.trim());
  return new RegExp(
    (startsWord ? '(?<![\\p{L}\\p{N}])' : '') + body + (endsWord ? '(?![\\p{L}\\p{N}])' : ''),
    flags,
  );
}

const SOURCE_RANK: Record<EntitySource, number> = { manual: 0, regex: 1, model: 2 };

export function redact(text: string, entities: Entity[]): Redaction {
  // One entry per distinct value. Manual beats regex beats model on kind.
  const unique = new Map<string, Entity>();
  for (const e of entities) {
    const key = normalise(e.value);
    if (!key) continue;
    const prev = unique.get(key);
    if (!prev || SOURCE_RANK[e.source] < SOURCE_RANK[prev.source]) unique.set(key, e);
  }

  // Every occurrence of every value, anywhere in the text.
  interface Span {
    start: number;
    end: number;
    key: string;
  }
  const spans: Span[] = [];
  for (const [key, e] of unique) {
    for (const m of text.matchAll(matcher(e.value, 'giu'))) {
      spans.push({ start: m.index, end: m.index + m[0].length, key });
    }
  }

  // Overlaps: the longer span wins ("14 Larch Close, Reading RG1 4QT" beats "RG1 4QT").
  spans.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const kept: Span[] = [];
  for (const s of spans) {
    if (!kept.some((k) => s.start < k.end && k.start < s.end)) kept.push(s);
  }
  kept.sort((a, b) => a.start - b.start);

  // Number placeholders in reading order so the redacted text reads naturally.
  const counters = new Map<EntityKind, number>();
  const placed = new Map<string, PlacedEntity>();
  const vault: Record<string, string> = {};
  let redacted = '';
  let cursor = 0;
  for (const s of kept) {
    let p = placed.get(s.key);
    if (!p) {
      const e = unique.get(s.key)!;
      const n = (counters.get(e.kind) ?? 0) + 1;
      counters.set(e.kind, n);
      p = { ...e, value: text.slice(s.start, s.end), placeholder: `[${e.kind}_${n}]`, count: 0 };
      placed.set(s.key, p);
      vault[p.placeholder] = p.value;
    }
    p.count++;
    redacted += text.slice(cursor, s.start) + p.placeholder;
    cursor = s.end;
  }
  redacted += text.slice(cursor);

  return { redacted, vault, entities: [...placed.values()] };
}

const PLACEHOLDER = /\[([A-Z]+(?:_[A-Z]+)*_\d+)\]/gi;

export interface Segment {
  text: string;
  /** Set when this segment is a placeholder, normalised to "[KIND_N]". */
  placeholder?: string;
}

/** Split text into plain runs and placeholders. Used for display and rehydration. */
export function splitByPlaceholders(text: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (m.index > cursor) out.push({ text: text.slice(cursor, m.index) });
    out.push({ text: m[0], placeholder: `[${m[1].toUpperCase()}]` });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

/** Put the real values back. Placeholders the vault does not know are left as-is. */
export function rehydrate(text: string, vault: Record<string, string>): string {
  return splitByPlaceholders(text)
    .map((s) => (s.placeholder && vault[s.placeholder] !== undefined ? vault[s.placeholder] : s.text))
    .join('');
}

/**
 * Last check before anything is sent: no value held in the vault may still be
 * readable in the outgoing text. Returns the values that leaked (ideally none).
 */
export function findLeaks(outgoing: string, vault: Record<string, string>): string[] {
  return Object.values(vault).filter((v) => matcher(v).test(outgoing));
}
