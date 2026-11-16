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
/** 'mark': hidden because the marker underlined it, not because a pattern or the model said so. */
export type EntitySource = 'mark' | 'list' | 'regex' | 'model' | 'manual';

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
/** `partial` may be called with what has been found so far, in reading order. */
export type Extractor = (chunk: string, partial?: (found: RawEntity[]) => void) => Promise<RawEntity[]>;

// ---------------------------------------------------------------------------
// 1. Deterministic layer: patterns a regex catches more reliably than a model
// ---------------------------------------------------------------------------

interface Detector {
  kind: EntityKind;
  pattern: RegExp;
  /** Use capture group 1 as the value (for patterns that need context). */
  group?: boolean;
  accept?: (value: string) => boolean;
  /** Only runs when this switch is on. See flags.ts. */
  flag?: string;
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

import { on } from './flags';

// A line under a sign-off holding one of these is an organisation, not a person.
export const ORG_WORD =
  /\b(?:Heating|Health|Plan|Payment|Tax|Freight|Biotech|Talent|Advice|Regulations?|Ombudsman|Register|Fund|Benefit|Allowance|Credit|Authority|Commission|Institute|College|Church|Club|Partners|Associates|Logistics|Systems|Solutions|Foods?|Motors|Bakery Ltd|Practice|Clinic|Council|Team|Department|Services?|Ltd|Limited|LLP|Lettings|Surgery|Centre|Center|Bank|School|Office|Group|Solicitors|Insurance|Mutual|Energy|University|Hospital|Trust|Agency|Company|Support|Customer|Payroll|Accounts|Recovery|Revenue|Management|Association|Society|Pharmacy|Housing|Officer|Manager|Director|Adviser|Advisor|Representative)\b/i;

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
      /(?:\b(?:[Rr]ef(?:erence)?|REF(?:ERENCE)?|[Nn]umber|NUMBER|[Nn]o(?=[.:])\.?|NO(?=[.:])\.?|ID)|#)(?:\s+is)?\s*:?\s*([A-Z0-9]+(?:[\/-][A-Z0-9]+)*(?: \d+[A-Z0-9]*)*)/g,
    group: true,
    accept: (v) => v.length >= 4 && /\d/.test(v),
  },
  {
    // "Dr Tomasz Bielak", "Mr P. Underhill", "Ms Dlamini". Staff and third
    // parties are named this way and the model often leaves them out.
    kind: 'PERSON',
    pattern:
      /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr|Prof|mr|mrs|ms|miss|dr)\.? ((?:(?:ap|de|del|der|di|du|la|le|van|von|bin|al|el) )?(?:[A-Z]\. ?)?(?:\p{Lu}[\p{L}-]+(?:['’]\p{L}{2,})?|\p{Lu}['’]\p{L}{2,}[\p{L}-]*)(?: (?:(?:ap|de|del|der|di|du|la|le|van|von|bin|al|el) )?(?:[A-Z]\. ?)?(?:\p{Lu}[\p{L}-]+(?:['’]\p{L}{2,})?|\p{Lu}['’]\p{L}{2,}[\p{L}-]*)){0,3})/gu,
    group: true,
  },
  {
    // "my daughter Ottilie", "your sister Aoife".
    kind: 'PERSON',
    pattern:
      /\b(?:[Mm]y|[Yy]our|[Hh]is|[Hh]er|[Tt]heir|[Oo]ur) (?:daughter|son|wife|husband|partner|sister|brother|mother|father|mum|dad|child|friend|neighbou?r|carer|girlfriend|boyfriend|aunt|uncle|cousin|niece|nephew|grand(?:mother|father|son|daughter)|flatmate|housemate),? ((?:\p{Lu}[\p{L}-]+(?:['’]\p{L}{2,})?|\p{Lu}['’]\p{L}{2,}[\p{L}-]*)(?: \p{Lu}[\p{L}-]+)?)/gu,
    group: true,
  },
  {
    // The name on the line after a sign-off: "Yours sincerely,\nD. Whitcombe".
    kind: 'PERSON',
    pattern:
      /(?:Yours (?:sincerely|faithfully|truly)|(?:Kind|Best|Warm|Many) (?:regards|wishes|thanks)|With best wishes|Regards|Sincerely|Thanks|Thank you|Cheers),?[ \t]*\r?\n+[ \t]*((?:[A-Z]\.? ?)?\p{Lu}[\p{L}'’-]+(?: (?:[A-Z]\.? )?\p{Lu}[\p{L}'’-]+){0,2})[ \t]*(?=\r?\n|$)/gu,
    group: true,
    accept: (v) => !ORG_WORD.test(v),
  },
  {
    // A street address anywhere, including inside a sentence: "41 Sedge Row".
    kind: 'ADDRESS',
    pattern:
      /\b(?:(?:Flat|Apartment|Apt|Unit|Room) ?\d+[A-Za-z]?,? )?\d{1,4}[A-Za-z]? (?:\p{Lu}[\p{L}'’.]* ){1,3}(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Close|Drive|Way|Court|Ct|Place|Pl|Crescent|Gardens|Square|Terrace|Row|Yard|Walk|Fold|Lea|Hill|Grove|Mews|Rise|Park|Wharf|View|Green|Parade|Boulevard|Blvd|Bank|Gate|Chase|Croft|Meadows?|Mount|Vale|Villas|Quay|Wynd|Brae)\b/gu,
  },
  {
    // A building or street named without a number: "Bramble Cottage",
    // "Chapel Lane", "The Maltings". Not when it is part of a business name.
    kind: 'ADDRESS',
    pattern:
      /(?<![\p{L}\p{N}])(?:The )?(?:\p{Lu}[\p{L}'’]+ ){1,2}(?:Cottage|House|Lodge|Farm|Villa|Barn|Manor|Hall|Maltings|Bakery|Wharf|Mews|Court|Road|Street|Avenue|Lane|Close|Drive|Crescent|Gardens|Square|Terrace|Row|Yard|Walk|Fold|Grove|Rise|Parade|Croft|Quay)(?: (?:West|East|North|South))?(?![\p{L}\p{N}]| (?:Surgery|Practice|Clinic|School|Hospital|Pharmacy|Centre|Center|Station|Ltd|Limited|Group|Hotel|Dental|Medical|Primary|Academy))/gu,
    accept: (v) => !ORG_WORD.test(v),
  },
  {
    // "tell Mirek", "ask for Renata Vasquez", "speak to Shirin".
    kind: 'PERSON',
    pattern:
      /\b(?:tell|ask(?: for)?|ring|speak to|spoke to|talk to) (\p{Lu}\p{Ll}[\p{L}'’-]+(?: \p{Lu}\p{Ll}[\p{L}'’-]+)?)/gu,
    group: true,
    accept: (v) => !ORG_WORD.test(v) && !NOT_A_NAME_PART.has(v.toLowerCase()),
  },
  {
    // A role or a phrase that introduces a person: "Staff Nurse Bronagh
    // Tierney", "seen by K. Adeyemo", "cc Rhodri Maddocks".
    flag: 'o1',
    kind: 'PERSON',
    pattern:
      /(?:\b(?:Staff Nurse|Nurse Practitioner|Practice Nurse|Nurse|Sister|Matron|Midwife|Constable|Sergeant|Inspector|Councillor|Judge|Professor|Pharmacist|Physiotherapist|Surveyor|Engineer)|\b(?:[Ss]een by|[Ss]igned(?: by)?|[Rr]eviewed by|[Aa]ssessed by|[Rr]eferred by|[Cc]ompleted by|[Tt]aken by|[Cc]haired by|[Aa]pproved by|[Dd]rawn by|[Dd]ictated by|[Ll]ogged by|[Cc]c|CC|[Oo]n behalf of)):?,? ((?:\p{Lu}\. ?)?\p{Lu}\p{Ll}[\p{L}'’-]+(?: \p{Lu}\p{Ll}[\p{L}'’-]+){0,2})/gu,
    group: true,
    accept: (v) => !ORG_WORD.test(v) && !v.split(' ').some((w) => NOT_A_NAME_PART.has(w.toLowerCase())),
  },
  // Postcodes beyond the UK: Canada, Ireland (Eircode) and a US ZIP after a state.
  { flag: 'w2', kind: 'POSTCODE', pattern: /\b[ABCEGHJ-NPRSTVXY]\d[A-Z] ?\d[A-Z]\d\b/g },
  { flag: 'w2', kind: 'POSTCODE', pattern: /\b(?:[AC-FHKNPRTV-Y]\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}\b/g },
  { flag: 'w2', kind: 'POSTCODE', pattern: /\b[A-Z]{2} (\d{5}(?:-\d{4})?)\b/g, group: true },
  // Technical identifiers. Letters rarely hold them; support tickets, forms
  // and logs do. All are pattern hits, so the model can never restore them.
  { flag: 'tech', kind: 'OTHER', pattern: /\b[0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5}\b/g },
  {
    flag: 'tech',
    kind: 'OTHER',
    pattern: /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?![\d.]*\d)/g,
  },
  {
    // IPv6: five or more groups, or a "::" short form. Three groups would match a time of day.
    flag: 'tech',
    kind: 'OTHER',
    pattern:
      /(?<![0-9A-Fa-f:])(?:(?:[0-9A-Fa-f]{1,4}:){4,7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,6}:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})(?![0-9A-Fa-f:])/g,
  },
  // A signed web token: three base64 parts, the first starting "eyJ".
  { flag: 'tech', kind: 'OTHER', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}/g },
  {
    // Keys with a well-known prefix.
    flag: 'tech',
    kind: 'OTHER',
    pattern:
      /\b(?:(?:sk|pk|rk)[-_](?:live|test|proj)?[-_]?[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})\b/g,
  },
  {
    // A cookie header: everything after the label.
    flag: 'tech',
    kind: 'OTHER',
    pattern: /\b(?:Set-)?Cookie\s*:\s*([^\r\n]{6,300})/g,
    group: true,
  },
  {
    // name=value where the name says it is a credential: "auth_token=…", "sessionid=…".
    flag: 'tech',
    kind: 'OTHER',
    pattern: /\b[A-Za-z_.-]*(?:token|session|sess|sid|auth|cookie|secret|passw(?:or)?d|apikey|api_key)[A-Za-z_.-]*=[^\s;,"'<>]{6,}/gi,
  },
  {
    // A value introduced by a label: "password: Tr0ub4dor", "PIN is 4471", "CVC 318".
    flag: 'tech',
    kind: 'OTHER',
    pattern:
      /\b(?:password|passcode|passphrase|pass ?code|pwd|token|secret|api[ _-]?key|access key|private key|security code|cvc|cvv|cvv2|pin)\b(?: (?:is|was|code|number))?\s*[:=]?\s*["'“]?([^\s"'”,;]{3,80})/gi,
    group: true,
    // Not an ordinary word after the label ("password reset", "PIN number"): it must hold a digit or mix cases.
    accept: (v) => /\d/.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v.slice(1))) || /[^A-Za-z.]/.test(v),
  },
  {
    // A long unbroken run of letters and digits: a key, a hash, a device or session id.
    flag: 'tech',
    kind: 'OTHER',
    pattern: /(?<![A-Za-z0-9_-])[A-Za-z0-9][A-Za-z0-9_-]{18,}[A-Za-z0-9](?![A-Za-z0-9_-])/g,
    accept: (v) => v.replace(/\D/g, '').length >= 3 && v.replace(/[^A-Za-z]/g, '').length >= 3 && !/^(?:[a-z]+-)+[a-z]+-?\d{1,4}$/.test(v),
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
  // Last on purpose: when a specific pattern above found the same value, its kind wins.
  {
    // A bare code with no label: "PET/7730921/B", "004-88127", "DSP-2611-04481",
    // or number groups such as "0800 121 4433". Six or more digits in all, or
    // capitals mixed with four or more digits. Dates and money are left alone.
    kind: 'ID_NUMBER',
    pattern: /(?<![£$€\p{L}\p{N}.,\/-])[A-Z0-9]+(?:[\/-][A-Z0-9]+)*(?: \d{3,}[A-Z0-9]*)*(?![\p{L}\p{N}\/-]|[.,]\d)/gu,
    accept: (v) => {
      const digits = v.replace(/\D/g, '').length;
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v) || /^\d{4}\/\d{2}$/.test(v)) return false;
      return digits >= 6 || (digits >= 4 && /[A-Z]/.test(v) && v.length >= 7);
    },
  },
];

/** True when a document is typed almost without capitals, as a chat or a hurried form is. */
export function isLowerCaseText(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 80) return false;
  return letters.replace(/[^\p{Lu}]/gu, '').length / letters.length < 0.01;
}

/**
 * The patterns lean on capitals: a postcode, a titled name, a street. In a
 * document typed without any, they are also run over a copy with every word
 * capitalised and every code in capitals. The copy has the same length, and
 * hiding ignores case, so what is found there is hidden in the original.
 */
function recased(text: string): string[] {
  const title = text.replace(/(?<![\p{L}\p{N}'’])\p{Ll}/gu, (c) => c.toUpperCase());
  const codes = text.replace(/(?<![\p{L}\p{N}])(?=[\p{L}\p{N}]*\d)[\p{L}\p{N}]+/gu, (c) => c.toUpperCase());
  return [title, codes];
}

export function detectWithRegex(text: string): Entity[] {
  const found = detectIn(text);
  if (on('lcdoc') && isLowerCaseText(text)) {
    const seen = new Set(found.map((e) => e.value.toLowerCase()));
    for (const copy of recased(text)) {
      for (const e of detectIn(copy)) {
        if (seen.has(e.value.toLowerCase())) continue;
        seen.add(e.value.toLowerCase());
        found.push(e);
      }
    }
  }
  return found;
}

function detectIn(text: string): Entity[] {
  const found: Entity[] = [];
  for (const d of DETECTORS) {
    if (d.flag && !on(d.flag)) continue;
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
      // "Zubiri-Maddox" is also written "Zubiri" and "Maddox".
      if (on('o2') && part.includes('-')) {
        for (const half of part.split('-')) {
          if (half.length >= 4 && /^\p{Lu}/u.test(half) && !NOT_A_NAME_PART.has(half.toLowerCase())) {
            out.push({ kind: 'PERSON', value: half, source: e.source, derived: true });
          }
        }
      }
    }
  }
  return out;
}

/**
 * A short form of a name already found: "Leo" signing off a note from
 * "Leopold". Any capitalised word in the text that is the start of a known
 * name part is treated as that person.
 */
export function shortForms(text: string, entities: Entity[]): Entity[] {
  const parts = new Set<string>();
  for (const e of entities) {
    if (e.kind !== 'PERSON') continue;
    for (const p of e.value.split(/[\s,&]+/)) if (p.length >= 5) parts.add(p.toLowerCase());
  }
  if (!parts.size) return [];
  const out: Entity[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}\p{Ll}{2,}(?![\p{L}\p{N}])/gu)) {
    const word = m[0];
    const key = word.toLowerCase();
    if (seen.has(key) || parts.has(key) || NOT_A_NAME_PART.has(key)) continue;
    seen.add(key);
    if ([...parts].some((p) => p.startsWith(key))) {
      out.push({ kind: 'PERSON', value: word, source: 'regex', derived: true });
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

export async function detect(
  text: string,
  extract?: Extractor,
  pieceChars = 4000,
  /** Called as results arrive, each time with everything found so far. */
  onProgress?: (entities: Entity[]) => void,
): Promise<Detection> {
  const regex = detectWithRegex(text);
  const withDerived = (found: Entity[]): Entity[] => {
    const parts = expandNameParts(found);
    return [...found, ...parts, ...shortForms(text, [...found, ...parts])];
  };
  if (!extract) return { entities: withDerived(regex), modelUsed: false };
  try {
    const entities = [...regex];
    for (const chunk of chunkText(text, pieceChars)) {
      const sofar = [...entities];
      const partial = onProgress
        ? (found: RawEntity[]) => onProgress(withDerived([...sofar, ...validateModelEntities(text, found)]))
        : undefined;
      entities.push(...validateModelEntities(text, await extract(chunk, partial)));
      onProgress?.(withDerived(entities));
    }
    return { entities: withDerived(entities), modelUsed: true };
  } catch (err) {
    return {
      entities: withDerived(regex),
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

const SOURCE_RANK: Record<EntitySource, number> = { manual: 0, regex: 1, model: 2, list: 3, mark: 4 };

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
export interface Restored {
  text: string;
  /** Placeholders that came back exactly as issued. */
  exact: number;
  /** Placeholders that came back changed (other brackets, case, spaces, a possessive inside) and were still matched. */
  altered: number;
  /** Placeholders in the answer that were never issued. Shown as they are, never guessed. */
  invented: string[];
  /** Issued placeholders that do not appear in the answer at all. */
  unused: number;
}

// A cloud model sometimes changes a placeholder on the way back: "[Person 1]",
// "(PERSON_1)", "[PERSON_1's]", "PERSON_1". This matches those forms too.
const LOOSE_PLACEHOLDER =
  /[\[({<]\s*([A-Za-z]+(?:[ _-][A-Za-z]+)*)[ _-]?(\d+)\s*(['’]s)?\s*[\])}>]|(?<![\p{L}\p{N}_\[])([A-Z]+(?:_[A-Z]+)*)_(\d+)(?![\p{L}\p{N}_\]])/gu;

/**
 * Puts real values back into an answer, tolerating the ways a model alters a
 * placeholder, and reports what happened to each.
 */
export function restore(text: string, vault: Record<string, string>): Restored {
  const used = new Set<string>();
  const invented: string[] = [];
  let exact = 0;
  let altered = 0;
  const out = text.replace(LOOSE_PLACEHOLDER, (whole, kind: string | undefined, n: string | undefined, poss: string | undefined, bareKind: string | undefined, bareN: string | undefined) => {
    const key = `[${(kind ?? bareKind ?? '').toUpperCase().replace(/[ -]/g, '_')}_${n ?? bareN}]`;
    const value = vault[key];
    if (value === undefined) {
      // Only something shaped like one of ours counts as invented.
      if (/^\[[A-Z]+(?:_[A-Z]+)*_\d+\]$/.test(whole)) invented.push(whole);
      return whole;
    }
    used.add(key);
    if (whole === key) exact++;
    else altered++;
    return value + (poss ?? '');
  });
  return { text: out, exact, altered, invented, unused: Object.keys(vault).filter((k) => !used.has(k)).length };
}

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
