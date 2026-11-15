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
import { findSuspects, notAName } from './suspects';

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

export function hideFirst(text: string, safeRules: boolean): HideFirst {
  const regex = detectWithRegex(text);
  const known = [...regex, ...expandNameParts(regex)];
  known.push(...shortForms(text, known));
  const masked = redact(text, known).redacted;

  const seen = new Set<string>();
  const marked: Entity[] = [];
  for (const s of findSuspects(masked)) {
    const key = s.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Safe rules: an organisation word in the name, a word that is also
    // written in lower case, a word followed by a dose.
    if (safeRules && s.reason === 'name' && (ORG_WORD.test(s.text) || notAName(masked, s.text))) continue;
    marked.push({ kind: s.reason === 'number' ? 'ID_NUMBER' : 'OTHER', value: s.text, source: 'mark' });
  }
  return { entities: [...known, ...marked], marks: marked.map((m) => m.value) };
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
