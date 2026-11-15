/**
 * What the scrub may have missed. Looks at the text that is about to leave the
 * device and marks anything that could still be personal: capitalised words
 * that are not ordinary sentence openings, and long numbers or codes.
 *
 * This is a review aid, not a detector. It is deliberately noisy: it also
 * marks organisation names and headings. The person reviewing decides.
 * No model, no network: plain string work on the redacted text.
 */
import { on } from './flags';

const DOSE =
  /^[ \t]*(?:\d+(?:[.,\/]\d+)?[ \t]?(?:mg|g|mcg|micrograms?|ml|units?|mmol|iu|%|tablets?|puffs?|drops?)\b|once|twice|three times|four times|daily|each (?:morning|night|evening)|at night|every \d|\d+\/\d+\b)/i;

/**
 * True when `value`, as it stands in `text`, is not a person's name: the same
 * word is also written in lower case somewhere in the document (a medicine or
 * an ordinary word), or it is directly followed by a dose or a frequency.
 */
export function notAName(text: string, value: string): boolean {
  if (DOSE.test(` ${value.replace(/^\S+/, '')}`) && /\s/.test(value)) return true;
  if (!/^\p{Lu}[\p{Ll}-]+$/u.test(value)) return false;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let at = 0;
  let everyUseHasDose = true;
  let uses = 0;
  for (;;) {
    at = text.indexOf(value, at);
    if (at < 0) break;
    uses++;
    if (!DOSE.test(text.slice(at + value.length, at + value.length + 24))) everyUseHasDose = false;
    at += value.length;
  }
  if (uses && everyUseHasDose) return true;
  return new RegExp(`(?<![\\p{L}\\p{N}'’-])${escaped.toLowerCase()}(?![\\p{L}\\p{N}'’-])`, 'u').test(text);
}

const NOT_SPEAKER = new Set('me you i we to from re subject note ps fyi ok yes no date time'.split(' '));
const GREETING = /(?<![\p{L}])(?:hi|hey|hello|hiya|thanks|thank you|cheers|ta|sorry|ok|okay|called|named|auntie|aunty|uncle|nurse|sister|ask for|its|it's|with|and) (\p{Ll}{3,})(?![\p{L}])/gu;

export interface Suspect {
  start: number;
  end: number;
  text: string;
  reason: 'name' | 'number';
}

const PLACEHOLDER = /\[[A-Z]+(?:_[A-Z]+)*_\d+\]/gi;

// Capitalised words that are not names wherever they stand.
const ORDINARY = new Set(
  `january february march april may june july august september october november december
monday tuesday wednesday thursday friday saturday sunday
i dear mr mrs ms miss mx dr prof sir yours sincerely faithfully regards kind best thanks thank hi hello
re subject from to date page flat top floor the a an we you your our if please this that it in on at
for not no yes uk gp nhs vat paye bacs ltd limited tel email ref reference number account notice
of and or with by as is are was were be been will would can may must should have has had do does did
pay paid payment total balance amount due net gross tax code sort mobile home address postcode name
title surname forename patient employee department urgency reason signed`.split(/\s+/),
);

const isLower = (ch: string | undefined) => !!ch && ch !== ch.toUpperCase() && ch === ch.toLowerCase();

export function findSuspects(outgoing: string): Suspect[] {
  // Blank out placeholders, keeping every offset where it was.
  const text = outgoing.replace(PLACEHOLDER, (m) => ' '.repeat(m.length));
  const found: Suspect[] = [];

  // Long numbers and codes: four or more digits, not money, a year or a date.
  for (const m of text.matchAll(/(?<![£$€\p{L}\p{N}.,])[A-Z0-9]+(?:[\/-][A-Z0-9]+)*(?![\p{L}\p{N}])/gu)) {
    const v = m[0];
    const digits = v.replace(/\D/g, '').length;
    // Four digits, or a shorter code that mixes capitals and digits ("XK7P", "R7KQ-22XM").
    const mixed = digits >= 1 && /[A-Z]/.test(v) && v.length >= 4;
    if (digits < 4 && !mixed) continue;
    if (/^(?:19|20)\d\d$/.test(v) || /^\d{4}\/\d{2}$/.test(v)) continue;
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v) && !/born|birth|d\.?o\.?b/i.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
    found.push({ start: m.index, end: m.index + v.length, text: v, reason: 'number' });
  }

  // Chat-like text is often all lower case, so the capital-letter rule below
  // sees nothing. Mark the speaker labels at the start of lines, and every
  // other use of those words.
  if (on('w1')) {
    const speakers = new Map<string, number>();
    for (const m of text.matchAll(/^[ \t]*([\p{L}][\p{L}'’ -]{1,24}):(?=\s)/gmu)) {
      const label = m[1].trim();
      speakers.set(label.toLowerCase(), (speakers.get(label.toLowerCase()) ?? 0) + 1);
    }
    const chatLike = [...speakers.values()].reduce((a, b) => a + b, 0) >= 3;
    if (chatLike) {
      const words = new Set<string>();
      for (const label of speakers.keys()) {
        for (const w of label.split(/\s+/)) if (w.length >= 3 && !NOT_SPEAKER.has(w) && !ORDINARY.has(w)) words.add(w);
      }
      // Names the speakers mention: "nurse called bisi", "thanks dele".
      for (const m of text.matchAll(GREETING)) {
        if (words.has(m[1])) continue;
        // Only when the word is not used widely: a name turns up a few times, "the" does not.
        if (!ORDINARY.has(m[1]) && /^(?:called|named|auntie|aunty|uncle|nurse|sister|ask for)/.test(m[0])) words.add(m[1]);
      }
      for (const w of words) {
        const re = new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu');
        for (const m of text.matchAll(re)) {
          if (m[0] !== m[0].toLowerCase()) continue;
          found.push({ start: m.index, end: m.index + m[0].length, text: m[0], reason: 'name' });
        }
      }
      // A lower-case word after a lower-case title: "dr mwangi", "mrs olatunji".
      for (const m of text.matchAll(/(?<![\p{L}])(?:dr|mr|mrs|ms|miss|prof)\.? (\p{Ll}{3,})(?![\p{L}])/gu)) {
        const start = m.index + m[0].length - m[1].length;
        found.push({ start, end: start + m[1].length, text: m[1], reason: 'name' });
      }
    }
  }

  // Capitalised words.
  const openers: Suspect[] = [];
  for (const m of text.matchAll(/(?<![\p{L}\p{N}'’])\p{Lu}[\p{L}'’-]*(?![\p{L}\p{N}])/gu)) {
    const word = m[0];
    if (word.length < 2 || ORDINARY.has(word.toLowerCase().replace(/['’]s$/, ''))) continue;
    if (on('m2') && notAName(outgoing, word)) continue;
    // An ordinary sentence opening: "We are writing", "Please pay".
    const head = text.slice(0, m.index);
    const before = head.trimEnd();
    const atStart = before === '' || /[.!?:;]$/.test(before) || head.slice(before.length).includes('\n');
    const after = text.slice(m.index + word.length);
    const nextWord = /^[ \t]+(\S)/.exec(after)?.[1];
    if (atStart && isLower(nextWord) && word !== word.toUpperCase()) {
      openers.push({ start: m.index, end: m.index + word.length, text: word, reason: 'name' });
      continue;
    }
    found.push({ start: m.index, end: m.index + word.length, text: word, reason: 'name' });
  }
  // A word marked somewhere else is marked at the start of a sentence too:
  // "Visited Walter Prendergast" makes "Walter is managing" a mark as well.
  const marked = new Set(found.filter((s) => s.reason === 'name').map((s) => s.text.toLowerCase()));
  found.push(...openers.filter((s) => marked.has(s.text.toLowerCase())));

  // Join neighbours separated by one space: "Priya Ramanathan", "HM 2209".
  found.sort((a, b) => a.start - b.start);
  const merged: Suspect[] = [];
  for (const s of found) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) continue;
    if (last && s.start === last.end + 1 && outgoing[last.end] === ' ') {
      last.end = s.end;
      last.text = outgoing.slice(last.start, last.end);
      if (s.reason === 'name') last.reason = 'name';
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}
