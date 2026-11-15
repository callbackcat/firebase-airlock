import { describe, expect, it } from 'vitest';
import { detect, detectWithRegex, redact } from '../src/airlock';
import { findSuspects } from '../src/suspects';

const marks = (text: string) => findSuspects(text).map((s) => s.text);

describe('review marks', () => {
  it('marks names and long numbers that are still readable', () => {
    const text = 'We spoke to Quill about order 4471902 on Tuesday.';
    expect(marks(text)).toEqual(['Quill', '4471902']);
  });

  it('leaves placeholders, sentence openings, money, years and dates alone', () => {
    const text = 'Dear [PERSON_1],\nPlease pay £1,284.60 by 1 December 2026. We wrote on 02/10/2026. Thank you.';
    expect(marks(text)).toEqual([]);
  });

  it('marks a date that follows a date-of-birth label', () => {
    expect(marks('Please include your date of birth (03/22/1979).')).toEqual(['03/22/1979']);
  });

  it('joins neighbouring words into one mark', () => {
    expect(marks('Signed by\nPriya Ramanathan\n')).toEqual(['Priya Ramanathan']);
  });

  it('gives offsets into the text it was given', () => {
    const text = 'Ask for Quill.';
    const [m] = findSuspects(text);
    expect(text.slice(m.start, m.end)).toBe('Quill');
  });
});

describe('name and address patterns', () => {
  const values = (text: string) => detectWithRegex(text).map((e) => e.value);

  it('finds a titled name, with initials and particles', () => {
    expect(values('seen by Dr Halina Brodzka, who')).toContain('Halina Brodzka');
    expect(values('Dear Mr van Aalst,')).toContain('van Aalst');
    expect(values("Dr Okoro's letter")).toContain('Okoro');
    expect(values('Dr P. Imrie, Castle Surgery')).toContain('P. Imrie');
  });

  it('finds relatives and the name under a sign-off', () => {
    expect(values('My daughter Wren has asthma.')).toContain('Wren');
    expect(values('Yours sincerely,\nT. Okonjo\nCase Officer')).toContain('T. Okonjo');
    expect(values('With best wishes,\nHarbour Medical Practice')).not.toContain('Harbour Medical Practice');
  });

  it('finds a street address inside a sentence', () => {
    expect(values('the boiler at 9b Pollard Row is broken')).toContain('9b Pollard Row');
    expect(values('You owe £12 for 3 months.')).toEqual([]);
  });

  it('finds reference numbers with looser labels', () => {
    expect(values('The job number is TR-55120.')).toContain('TR-55120');
    expect(values('Employee no: 220417')).toContain('220417');
    expect(values('Account #: 9911-300276')).toContain('9911-300276');
  });

  it('hides a short form of a name it already knows', async () => {
    const text = "Hi, it's Dr Benedikt Aune here. Call me. Ben";
    const found = await detect(text);
    expect(redact(text, found.entities).redacted).not.toMatch(/Ben\b/);
  });
});
