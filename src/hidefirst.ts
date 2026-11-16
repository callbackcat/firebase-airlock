import {
  ORG_WORD,
  detectWithRegex,
  expandNameParts,
  redact,
  shortForms,
  validateModelEntities,
  type Entity,
  type RawEntity,
} from './airlock';
import { on } from './flags';
import { findSuspects, notAName } from './suspects';
import { isCommonWord, isListedName, wordListsLoaded } from './wordlists';

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
  if (ROLE_INSIDE.test(item)) return true;
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
    if (/\[PERSON_\d+\][ \t]$/.test(before) || /^[ \t]\[PERSON_\d+\]/.test(after)) return true;
    if (ROLE_BEFORE.test(before)) return true;
    if (EPONYM_TAIL.test(after)) eponyms++;
    at += item.length;
  }
  return listed && !(uses > 0 && eponyms === uses);
}

export function hideFirst(text: string, safeRules: boolean): HideFirst {
  const regex = detectWithRegex(text);
  const known = [...regex, ...expandNameParts(regex)];
  known.push(...shortForms(text, known));
  const masked = redact(text, known).redacted;

  const seen = new Set<string>();
  const marked: Entity[] = [];
  const protectedMarks: Entity[] = [];
  for (const s of findSuspects(masked)) {
    const key = s.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Safe rules: an organisation word in the name, a word that is also
    // written in lower case, a word followed by a dose.
    if (safeRules && s.reason === 'name' && (ORG_WORD.test(s.text) || notAName(masked, s.text))) continue;
    if (s.reason === 'name' && neverRestore(masked, s.text)) {
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
  return { entities: [...known, ...listed, ...marked], marks: marked.map((m) => m.value) };
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
