import {
  ORG_WORD,
  detectWithRegex,
  isUpperCaseText,
  expandNameParts,
  redact,
  shortForms,
  validateModelEntities,
  type Entity,
  type RawEntity,
} from './airlock';
import { on } from './flags';
import { findSuspects, notAName } from './suspects';
import { isCommonWord, isListedName, isMedicalPhrase, wordListsLoaded } from './wordlists';

/**
 * Hide first. Everything the patterns find and everything the marker
 * underlines is hidden at once, with no model. The text is then safe to send
 * in a few milliseconds. The model's job afterwards is to say which hidden
 * items are safe to show again (an organisation, a town, a medicine), so a
 * model mistake costs a useful fact and not a leak.
 *
 * The published design with the highest recall on clinical notes works this
 * way: remove what is not known to be safe, then win back precision.
 */
export interface HideFirst {
  /** Everything hidden: pattern hits, parts of them, and marked items. */
  entities: Entity[];
  /** The values hidden only because they were marked. The model may restore these and no others. */
  marks: string[];
  /** Marked items the model is not asked about, with the rule that keeps them hidden. */
  blocked: Record<string, string>;
}

// Words that introduce a person. A marked item that contains one of these
// before a capitalised word, or stands straight after one, is a name.
const ROLE = 'Dr|Mr|Mrs|Ms|Miss|Mx|Prof|Professor|Nurse|Sister|Matron|Midwife|Judge|Officer|Cllr|Councillor|Signed|Seen by|Cc';
const ROLE_INSIDE = new RegExp(`(?:^|\\s)(?:${ROLE})\\.?\\s+\\p{Lu}`, 'iu');
const ROLE_BEFORE = new RegExp(`(?<![\\p{L}])(?:${ROLE})\\.?:?,?[ \\t]+$`, 'iu');
// A name in front of one of these is a condition, a test or a piece of kit
// named after someone ("Parkinson's disease", "Holter monitor"), not a person.
const EPONYM_TAIL =
  /^(?:['’]s?)?[ \t]+(?:disease|syndrome|sign|score|scale|test|scan|monitor|catheter|solution|manoeuvre|maneuver|valve|palsy|lymphoma|phenomenon|thyroiditis|fracture|classification|criteria|method|procedure|operation|reflex|tube|ulcer|sarcoma|tumou?r|virus|stain|law|chart)\b/i;

// What follows a medicine: a dose, a strength, a form or a frequency.
const DOSE_OR_FORM =
  /^[ \t]*(?:\d+(?:[.,/]\d+)?[ \t]?(?:mg|g|mcg|micrograms?|ml|units?|mmol|iu|%)(?![\p{L}])|\d+\/\d+\b|(?:tablets?|capsules?|caps|tabs|cream|ointment|gel|inhaler|injection|infusion|drops|patch(?:es)?|suspension|syrup|spray|sachets?|once|twice|daily|nightly|weekly|bd|tds|qds|od|prn|mr|xl|sr)(?![\p{L}]))/iu;
const HEAD_WORD = /^(?:['’]s?)?[ \t]+(?:disease|syndrome)(?![\p{L}])/iu;
const norm = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

/**
 * True when a marked item is medical vocabulary and can be shown without
 * asking the model: a medicine, a condition, a test or a term named after a
 * person. Decided in code, so no text in the document and no model mistake
 * can change it, and a canary discard does not undo it.
 *
 *  - Every use of the item must sit inside a whole phrase on the medical
 *    list ("Parkinson's disease", "Holter monitor", "Metformin").
 *  - Or be followed by "disease" or "syndrome", and hold no word from the
 *    name list. No other head word counts: a line, a test, a scan, a sign
 *    and a scale all follow ordinary names too.
 *  - A single listed word that is also on the name list ("Senna") counts
 *    only when a dose, strength, form or frequency follows it.
 *  - Never after a title or role word, never next to a hidden name, and
 *    never when the same word is a hidden name elsewhere in the document.
 */
export function medicalSafe(masked: string, item: string, nameWords: Set<string>): boolean {
  if (!wordListsLoaded() || ROLE_INSIDE.test(item)) return false;
  const words = norm(item).split(/[^\p{L}]+/u).filter((w) => w.length >= 3);
  if (!words.length || words.some((w) => nameWords.has(w))) return false;
  const onNameList = words.some((w) => isListedName(w) && !isCommonWord(w));
  const base = norm(item);
  const bare = base.replace(/'s?$/, '');
  let uses = 0;
  let at = 0;
  for (;;) {
    at = masked.indexOf(item, at);
    if (at < 0) break;
    uses++;
    const before = masked.slice(Math.max(0, at - 40), at);
    const after = masked.slice(at + item.length, at + item.length + 60);
    at += item.length;
    if (/\[PERSON_\d+\][ \t]$/.test(before) || /^[ \t]\[PERSON_\d+\]/.test(after)) return false;
    if (ROLE_BEFORE.test(before)) return false;
    // The words straight after and straight before, up to the next punctuation mark.
    const next = (/^[ \t]+([\p{L}\p{N}'’ -]{0,50})/u.exec(after)?.[1] ?? '').split(/\s+/).filter(Boolean).slice(0, 3).map(norm);
    const prev = norm(/([\p{L}'’-]+)[ \t]+$/u.exec(before)?.[1] ?? '');
    let ok = false;
    // The item on its own. A single word counts only when it is five letters
    // or more, is not a possessive ("Crohn's secretary"), is not the name in
    // an eponym ("Crohn" alone is a person), and is not followed by another
    // capitalised word ("Metformin Okafor"). If it is also on the name list
    // it needs a dose or form after it.
    const single = words.length === 1;
    const possessive = /['’]s?$/.test(item);
    const eponymName = single && (isMedicalPhrase(`${bare}'s disease`) || isMedicalPhrase(`${bare} disease`) || isMedicalPhrase(`${bare} syndrome`) || isMedicalPhrase(`${bare}'s syndrome`));
    const beforeName = /^[ \t]+\p{Lu}\p{Ll}/u.test(after);
    if (isMedicalPhrase(base) && !possessive) {
      if (!single) ok = true;
      else if (base.length >= 5 && !eponymName && !beforeName && (!onNameList || DOSE_OR_FORM.test(after))) ok = true;
    }
    // The item as the start, or the middle, of a longer phrase on the list.
    for (let n = 1; !ok && n <= next.length; n++) {
      const tail = next.slice(0, n).join(' ');
      if (isMedicalPhrase(`${base} ${tail}`) || isMedicalPhrase(`${bare} ${tail}`)) ok = true;
      else if (prev && (isMedicalPhrase(`${prev} ${base} ${tail}`) || isMedicalPhrase(`${prev} ${bare} ${tail}`))) ok = true;
    }
    if (!ok && prev && isMedicalPhrase(`${prev} ${base}`)) ok = true;
    if (!ok && !onNameList && HEAD_WORD.test(after)) ok = true;
    if (!ok) return false;
  }
  return uses > 0;
}

/**
 * True when a single marked word stands the way a person's name stands, so
 * the model's "medical" label is not enough to show it: a possessive
 * ("Crohn's secretary"), the surname of an eponym on its own ("Crohn"), or a
 * word straight before another capitalised word ("Metformin Okafor"). A
 * whole phrase on the medical list has already been shown by medicalSafe;
 * this is for what is left.
 */
export function standsLikeAName(masked: string, item: string): boolean {
  if (!wordListsLoaded()) return false;
  const words = norm(item).split(/[^\p{L}]+/u).filter((w) => w.length >= 3);
  if (words.length !== 1 && !/['’]s?$/.test(item)) return false;
  const bare = norm(item).replace(/'s?$/, '');
  if (/['’]s?$/.test(item)) return true;
  if (isMedicalPhrase(`${bare}'s disease`) || isMedicalPhrase(`${bare} disease`) || isMedicalPhrase(`${bare} syndrome`) || isMedicalPhrase(`${bare}'s syndrome`)) return true;
  let at = 0;
  for (;;) {
    at = masked.indexOf(item, at);
    if (at < 0) return false;
    if (/^[ \t]+\p{Lu}\p{Ll}/u.test(masked.slice(at + item.length, at + item.length + 12))) return true;
    at += item.length;
  }
}

/**
 * True when the model must not be allowed to show a marked item again,
 * whatever it says about it. In any letter case:
 *  - it holds a word from the name list (unless every use is an eponym);
 *  - it stands next to a name that is already hidden;
 *  - it contains, or stands straight after, a title or role word.
 * A line of text inside a document can talk a small model into calling a
 * person an organisation or a medical term. These rules do not depend on it.
 */
export function neverRestore(masked: string, item: string): boolean {
  return restoreBlock(masked, item) !== null;
}

/** Why an item may not be restored, or null when the model may decide. */
export function restoreBlock(masked: string, item: string): 'role word' | 'next to a hidden name' | 'name list' | null {
  if (ROLE_INSIDE.test(item)) return 'role word';
  let listed = false;
  if (wordListsLoaded()) {
    for (const word of item.split(/[^\p{L}]+/u)) {
      if (word.length >= 3 && isListedName(word) && !isCommonWord(word)) listed = true;
    }
  }
  let uses = 0;
  let eponyms = 0;
  let at = 0;
  for (;;) {
    at = masked.indexOf(item, at);
    if (at < 0) break;
    uses++;
    const before = masked.slice(Math.max(0, at - 24), at);
    const after = masked.slice(at + item.length, at + item.length + 24);
    if (/\[PERSON_\d+\][ \t]$/.test(before) || /^[ \t]\[PERSON_\d+\]/.test(after)) return 'next to a hidden name';
    if (ROLE_BEFORE.test(before)) return 'role word';
    if (EPONYM_TAIL.test(after)) eponyms++;
    at += item.length;
  }
  return listed && !(uses > 0 && eponyms === uses) ? 'name list' : null;
}

export function hideFirst(original: string, safeRules: boolean): HideFirst {
  // A document in capitals gives the capital-letter rule nothing to go on:
  // every word looks like a name. Handle it as lower-case text instead.
  const text = on('updoc') && isUpperCaseText(original) ? original.toLowerCase() : original;
  const regex = detectWithRegex(text);
  const known = [...regex, ...expandNameParts(regex)];
  known.push(...shortForms(text, known));
  const masked = redact(text, known).redacted;

  const seen = new Set<string>();
  const marked: Entity[] = [];
  const protectedMarks: Entity[] = [];
  // Words that are a hidden person's name somewhere in this document.
  const nameWords = new Set<string>();
  for (const e of known) {
    if (e.kind !== 'PERSON') continue;
    for (const w of e.value.toLowerCase().split(/[^\p{L}]+/u)) if (w.length >= 3) nameWords.add(w);
  }
  const blocked: Record<string, string> = {};
  for (const s of findSuspects(masked)) {
    const key = s.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Safe rules: an organisation word in the name, a word that is also
    // written in lower case, a word followed by a dose.
    if (safeRules && s.reason === 'name' && (ORG_WORD.test(s.text) || notAName(masked, s.text))) continue;
    // Medical vocabulary is shown, in code, before any other rule looks at it.
    if (s.reason === 'name' && on('medsafe') && medicalSafe(masked, s.text, nameWords)) continue;
    const block = s.reason === 'name' ? restoreBlock(masked, s.text) : null;
    if (block) {
      blocked[s.text] = block;
      // Hidden for good: source 'list' is never handed to the model.
      protectedMarks.push({ kind: 'PERSON', value: s.text, source: 'list' });
      continue;
    }
    marked.push({ kind: s.reason === 'number' ? 'ID_NUMBER' : 'OTHER', value: s.text, source: 'mark' });
  }
  // Name list: a word that is a known given name or surname. The capital-letter
  // rule above already marks a capitalised one; what the list adds is a name
  // typed without a capital. A list hit is hidden and stays hidden: the model
  // may restore marks, never these.
  const listed: Entity[] = [...protectedMarks];
  if (wordListsLoaded() && (on('names') || on('nameslc') || on('lc'))) {
    const blank = masked.replace(/\[[A-Z]+(?:_[A-Z]+)*_\d+\]/g, (m) => ' '.repeat(m.length));
    const chatLike = (blank.match(/^[ \t]*[\p{L}][\p{L}'’ -]{1,24}:(?=\s)/gmu) ?? []).length >= 4;
    for (const m of blank.matchAll(/(?<![\p{L}\p{N}'’@._-])\p{L}{3,}(?![\p{L}\p{N}@_])/gu)) {
      const word = m[0];
      const key = word.toLowerCase();
      if (seen.has(key)) continue;
      const lower = word === key;
      // A short word straight after a number or a slash is a unit: "30 min", "mmol/mol".
      const unit = /[\d/]\s?$/.test(blank.slice(Math.max(0, m.index - 2), m.index));
      const name = isListedName(word) && !isCommonWord(word) && !unit;
      if (name && on('medsafe') && medicalSafe(masked, word, nameWords)) continue;
      if (name && (on('names') || (on('nameslc') && lower))) {
        seen.add(key);
        // A capitalised one was marked above; take it out of the model's hands.
        const at = marked.findIndex((e) => e.value.toLowerCase() === key);
        if (at >= 0) marked.splice(at, 1);
        listed.push({ kind: 'PERSON', value: word, source: 'list' });
      } else if (on('lc') && chatLike && lower && !isCommonWord(word) && !ORG_WORD.test(word)) {
        // Chat-like text: a lower-case word that is no ordinary English word. The model may restore it.
        seen.add(key);
        marked.push({ kind: 'OTHER', value: word, source: 'mark' });
      }
    }
  }
  return { entities: [...known, ...listed, ...marked], marks: marked.map((m) => m.value), blocked };
}

export interface Unhide {
  /** Marked values the model says are safe to show. */
  restore: string[];
  /** What the model says each value that stays hidden is. */
  kinds: Map<string, string>;
  /** Personal details the marks did not catch. */
  add: RawEntity[];
}

/** The hidden set after the model has had its say. Pattern hits are never restored. */
export function applyUnhide(text: string, first: HideFirst, result: Unhide): Entity[] {
  const marks = new Set(first.marks);
  const restore = new Set(result.restore.filter((v) => marks.has(v)));
  const out: Entity[] = [];
  for (const e of first.entities) {
    if (e.source === 'mark') {
      if (restore.has(e.value)) continue;
      const kind = result.kinds.get(e.value);
      out.push(kind === 'PERSON' || kind === 'ADDRESS' || kind === 'ID_NUMBER' ? { ...e, kind } : e);
    } else {
      out.push(e);
    }
  }
  out.push(...validateModelEntities(text, result.add));
  // Once a name is hidden, its parts are hidden wherever they stand.
  const parts = expandNameParts(out).filter((p) => !restore.has(p.value));
  return [...out, ...parts, ...shortForms(text, [...out, ...parts])];
}
