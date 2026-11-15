/**
 * What the scrub may have missed. Looks at the text that is about to leave the
 * device and marks anything that could still be personal: capitalised words
 * that are not ordinary sentence openings, and long numbers or codes.
 *
 * This is a review aid, not a detector. It is deliberately noisy: it also
 * marks organisation names and headings. The person reviewing decides.
 * No model, no network: plain string work on the redacted text.
 */
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

  // Capitalised words.
  const openers: Suspect[] = [];
  for (const m of text.matchAll(/(?<![\p{L}\p{N}'’])\p{Lu}[\p{L}'’-]*(?![\p{L}\p{N}])/gu)) {
    const word = m[0];
    if (word.length < 2 || ORDINARY.has(word.toLowerCase().replace(/['’]s$/, ''))) continue;
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
