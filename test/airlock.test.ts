import { describe, expect, it } from 'vitest';
import {
  expandNameParts,
  chunkText,
  detect,
  detectWithRegex,
  findLeaks,
  redact,
  rehydrate,
  validateModelEntities,
  type Extractor,
} from '../src/airlock';
import { SAMPLE_LETTER } from '../src/sample';

const values = (text: string, kind: string) =>
  detectWithRegex(text)
    .filter((e) => e.kind === kind)
    .map((e) => e.value);

describe('regex layer', () => {
  it('finds emails, phones and postcodes', () => {
    const t = 'Mail a.b@example.com or call 0118 496 0123 / +44 7700 900123. RG1 4QT.';
    expect(values(t, 'EMAIL')).toEqual(['a.b@example.com']);
    expect(values(t, 'PHONE')).toEqual(['0118 496 0123', '+44 7700 900123']);
    expect(values(t, 'POSTCODE')).toEqual(['RG1 4QT']);
  });

  it('finds bank details but only accepts card numbers that pass Luhn', () => {
    const t = 'Sort code 20-00-00, account number 12345678. Card 4111 1111 1111 1111, ref 1234 5678 9012 3456.';
    expect(values(t, 'ACCOUNT')).toEqual(['20-00-00', '12345678']);
    expect(values(t, 'CARD')).toEqual(['4111 1111 1111 1111']);
  });

  it('only treats a date as a DOB when the text says so', () => {
    const t = 'Letter dated 02/11/2026. Date of birth: 03/07/1984.';
    expect(values(t, 'DOB')).toEqual(['03/07/1984']);
  });
});

describe('model layer', () => {
  it('drops spans the model invented and unknown kinds become OTHER', () => {
    const text = 'Dear Eleanor Whitfield, see you soon.';
    const out = validateModelEntities(text, [
      { kind: 'PERSON', value: 'Eleanor Whitfield' },
      { kind: 'PERSON', value: 'Eleanor Whitefield' },
      { kind: 'NICKNAME', value: 'eleanor' },
      { kind: 'PERSON', value: 'x' },
    ]);
    expect(out).toEqual([
      { kind: 'PERSON', value: 'Eleanor Whitfield', source: 'model' },
      { kind: 'OTHER', value: 'Eleanor', source: 'model' },
    ]);
  });

  it('chunks long text under the limit without losing characters', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ` + 'x'.repeat(300)).join('\n\n');
    const chunks = chunkText(text, 1000);
    expect(chunks.every((c) => c.length <= 1000)).toBe(true);
    expect(chunks.join('')).toBe(text);
  });

  it('falls back to regex-only when the model is unavailable', async () => {
    const failing: Extractor = async () => {
      throw new Error('on-device model unavailable');
    };
    const d = await detect('Dear Eleanor, mail me at e@example.com', failing);
    expect(d.modelUsed).toBe(false);
    expect(d.modelError).toMatch(/unavailable/);
    expect(d.entities.map((e) => e.value)).toEqual(['e@example.com']);
  });
});

describe('redact and rehydrate', () => {
  it('uses one placeholder per value, everywhere it appears', () => {
    const text = 'Eleanor Whitfield called. Tell ELEANOR\nWHITFIELD we rang back. Annual review for Ann.';
    const r = redact(text, [
      { kind: 'PERSON', value: 'Eleanor Whitfield', source: 'model' },
      { kind: 'PERSON', value: 'Ann', source: 'model' },
    ]);
    expect(r.redacted).toBe('[PERSON_1] called. Tell [PERSON_1] we rang back. Annual review for [PERSON_2].');
    expect(r.entities.find((e) => e.placeholder === '[PERSON_1]')?.count).toBe(2);
  });

  it('lets the longer span win when two overlap', () => {
    const text = 'Send it to 14 Larch Close, Reading RG1 4QT please.';
    const r = redact(text, [
      { kind: 'POSTCODE', value: 'RG1 4QT', source: 'regex' },
      { kind: 'ADDRESS', value: '14 Larch Close, Reading RG1 4QT', source: 'model' },
    ]);
    expect(r.redacted).toBe('Send it to [ADDRESS_1] please.');
    expect(Object.keys(r.vault)).toEqual(['[ADDRESS_1]']);
  });

  it('round-trips and tolerates a model changing placeholder case', () => {
    const text = 'Eleanor Whitfield, 0118 496 0123';
    const r = redact(text, [
      { kind: 'PERSON', value: 'Eleanor Whitfield', source: 'model' },
      ...detectWithRegex(text),
    ]);
    expect(rehydrate(r.redacted, r.vault)).toBe(text);
    expect(rehydrate('Call [phone_1] and ask for [PERSON_1] or [PERSON_9].', r.vault)).toBe(
      'Call 0118 496 0123 and ask for Eleanor Whitfield or [PERSON_9].',
    );
  });
});

describe('whole pipeline on the sample letter', () => {
  // Stands in for the on-device model: returns what a decent extractor would.
  const extract: Extractor = async () => [
    { kind: 'PERSON', value: 'Eleanor Whitfield' },
    { kind: 'PERSON', value: 'Ms Whitfield' },
    { kind: 'ADDRESS', value: '14 Larch Close' },
    { kind: 'PERSON', value: 'Dr Tomasz Bielak' },
    { kind: 'PERSON', value: 'Somebody Not In The Letter' },
  ];

  it('sends nothing identifying and restores the answer locally', async () => {
    const d = await detect(SAMPLE_LETTER, extract);
    expect(d.modelUsed).toBe(true);
    const r = redact(SAMPLE_LETTER, d.entities);

    const mustNotLeave = [
      'Whitfield',
      'Eleanor',
      'Larch Close',
      'RG1 4QT',
      '943 476 5919',
      '03/07/1984',
      '0118 496 0123',
      'eleanor.whitfield@example.com',
      '20-00-00',
      '12345678',
      'Bielak',
    ];
    for (const secret of mustNotLeave) expect(r.redacted).not.toContain(secret);
    expect(findLeaks(r.redacted, r.vault)).toEqual([]);

    // The parts the cloud needs to be useful are still there.
    expect(r.redacted).toContain('Northbridge Community Clinic');
    expect(r.redacted).toContain('Tuesday 8 December 2026');
    expect(r.redacted).toContain('£42.50');

    // A cloud model answering purely in placeholders.
    const person = r.entities.find((e) => e.value === 'Ms Whitfield')!.placeholder;
    const phone = r.entities.find((e) => e.kind === 'PHONE')!.placeholder;
    const cloudAnswer = `${person} should call ${phone} to rebook.`;
    expect(rehydrate(cloudAnswer, r.vault)).toBe('Ms Whitfield should call 0118 496 0123 to rebook.');
  });

  it('flags a leak if the outgoing text is edited to contain a vaulted value', async () => {
    const d = await detect(SAMPLE_LETTER, extract);
    const r = redact(SAMPLE_LETTER, d.entities);
    expect(findLeaks(r.redacted + ' PS from Eleanor Whitfield', r.vault)).toContain('Eleanor Whitfield');
  });
});

describe('name parts', () => {
  it('adds each part of a full name, without titles', () => {
    const parts = expandNameParts([{ kind: 'PERSON', value: 'Dr Jane Okafor-Reid', source: 'model' }]);
    expect(parts.map((p) => p.value)).toEqual(['Jane', 'Okafor-Reid']);
  });

  it('skips everyday words, initials and non-person entities', () => {
    const parts = expandNameParts([
      { kind: 'PERSON', value: 'May J. Hollis', source: 'model' },
      { kind: 'ADDRESS', value: '5 Hollis Street', source: 'model' },
    ]);
    expect(parts.map((p) => p.value)).toEqual(['Hollis']);
  });

  it('hides a surname used on its own later in the letter', async () => {
    const text = 'Mr Tomas Varga\n\nDear Mr Varga,\nYour appointment is on Tuesday.';
    const found = await detect(text, async () => [{ kind: 'PERSON', value: 'Mr Tomas Varga' }]);
    expect(redact(text, found.entities).redacted).not.toContain('Varga');
  });
});

describe('labelled references', () => {
  const values = (text: string) => detectWithRegex(text).map((e) => e.value);

  it('finds reference numbers introduced by a label', () => {
    expect(values('Our ref: QX/4410/BD')).toContain('QX/4410/BD');
    expect(values('Policy number: ZT-70031-K')).toContain('ZT-70031-K');
    expect(values('Staff number 007731 applies.')).toContain('007731');
    expect(values('Your reference 90417 22086')).toContain('90417 22086');
  });

  it('leaves words, short numbers and amounts alone', () => {
    expect(values('A number of people called about reference material.')).toEqual([]);
    expect(values('See page number 12 and pay £164.00 within 7 days.')).toEqual([]);
  });

  it('finds a UK vehicle registration', () => {
    expect(values('Vehicle: WP21 HGA was parked.')).toContain('WP21 HGA');
  });
});
