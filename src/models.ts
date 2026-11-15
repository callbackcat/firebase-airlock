import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
  type AI,
  type GenerativeModel,
} from 'firebase/ai';
import {
  ORG_WORD,
  detectWithRegex,
  expandNameParts,
  redact,
  validateModelEntities,
  type Extractor,
  type RawEntity,
} from './airlock';
import { findSuspects } from './suspects';

/**
 * Two model instances, two rules:
 *
 *   scrub  ONLY_ON_DEVICE  sees the raw document. Never falls back to cloud.
 *   cloud  ONLY_IN_CLOUD   sees placeholders only.
 *
 * Both go through Firebase AI Logic. The split is the product: if the scrub
 * model could fall back to the cloud, the raw document would leave the device.
 */

const MODEL_KINDS = ['PERSON', 'ADDRESS', 'EMAIL', 'PHONE', 'DOB', 'ID_NUMBER', 'ACCOUNT', 'OTHER'];

const MAX_ENTITIES = 40;
// How long one on-device call may take before it is cancelled. The limit
// follows the machine: five times its usual call, never under 15 s (a fast
// laptop answers in about 3 s) and never over 2 minutes. Until one call has
// finished there is nothing to go on, so the first is given a minute.
const MIN_TIMEOUT_MS = 15_000;
const MAX_TIMEOUT_MS = 120_000;
const FIRST_TIMEOUT_MS = 60_000;
/** A first pass slower than this means a slow machine: skip the second pass. */
const SLOW_FIRST_PASS_MS = 20_000;

// Plain JSON Schema, passed to Chrome as the output constraint. The caps are
// there because a small model sometimes runs away: maxItems stops an endless
// list, maxLength stops an endless value.
const entitySchema = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      maxItems: MAX_ENTITIES,
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: MODEL_KINDS },
          value: { type: 'string', maxLength: 80 },
        },
        required: ['kind', 'value'],
        additionalProperties: false,
      },
    },
  },
  required: ['entities'],
  additionalProperties: false,
};

/**
 * Options handed to Chrome's prompt() for each on-device call. The SDK passes
 * this object through untouched, so setting `signal` on it before a call is
 * how a call that overruns gets cancelled for real, not just ignored.
 */
interface PromptOptions {
  responseConstraint: object;
  signal?: AbortSignal;
}

const SCRUB_SYSTEM = `You find personal data in documents so it can be removed.
List every span that could identify a private individual or their accounts:
names of people (with their title if one is attached), street addresses,
email addresses, phone numbers, dates of birth, patient/customer/reference
numbers, bank details, and anything else that points to one specific person.
Copy each value exactly as written in the document, character for character.

Be thorough about two things that are easy to miss:
- Every person named anywhere, not only the recipient: the member of staff
  who signed the letter, a partner, a child, a neighbour, a witness.
- Every part of an address as its own entry, one per line of the address:
  the house or building name, the flat number, the street, and any address
  mentioned inside a sentence.

Example: in a letter addressed to "Mrs Ingrid Solberg, Flat 2, Heron House,
9 Quarry Bank" and signed "Tobias Lindqvist, Case Officer", list PERSON
"Mrs Ingrid Solberg", ADDRESS "Flat 2, Heron House", ADDRESS "Heron House",
ADDRESS "9 Quarry Bank" and PERSON "Tobias Lindqvist".

Do not list organisations, job titles, appointment dates or amounts of money.
If there is nothing to list, return an empty list.`;

// Second on-device pass. It reads the letter after the first pass, with what
// was already found replaced by placeholders, and lists what is still readable.
// A small model lists fewer items on some runs; a fresh look at the remainder
// catches most of what the first pass dropped.
const REVIEW_SYSTEM = `You check a document after personal data was removed.
Removed values now appear as placeholders in square brackets, such as
[PERSON_1] or [ADDRESS_2]. Ignore the placeholders.
List every piece of personal data that is STILL readable: any person's name
(first name alone, surname alone, initial and surname, nicknames, relatives,
staff who signed), any street address, house or building name, flat number,
email address, phone number, date of birth, and any reference, account,
policy, employee, job or tracking number.
Copy each value exactly as written in the document, character for character.
Do not list organisations, job titles, appointment dates or amounts of money.
If nothing personal is still readable, return an empty list.`;

// The other kind of second pass. Instead of writing values out, the model is
// given the items the review step marked and may only pick from that list. It
// cannot invent a value or run on, and it only reads what is still in doubt.
const PICK_SYSTEM = `You check a document after personal data was removed.
Removed values appear as placeholders in square brackets, such as [PERSON_1].
After the document there is a list of words and numbers that are still
readable in it. Pick every item on the list that is personal data:
- a person's name or part of one (first name, surname, initial and surname,
  nickname), including staff, relatives and anyone else who is named
- part of a home address: a house or building name, a street, a flat
- a reference, account, policy, order, tracking or membership number, a
  password or a code that belongs to one person
Do not pick organisations, departments, job titles, towns, countries,
products, medicines, headings, days, months or amounts of money.
Give each item you pick exactly as it is written in the list.`;

// A third kind of second pass. Picking from a list hid everything personal but
// also most organisations: asked "which of these are personal?", a small
// model says yes to nearly all of them. Here it must give every marked item
// one label, with "organisation", "place" and "other" on offer, and only the
// personal labels are hidden. The answer has a fixed size, so it cannot run on.
const LABEL_SYSTEM = `You check a document after personal data was removed.
Removed values appear as placeholders in square brackets, such as [PERSON_1].
After the document there is a numbered list of words and numbers that are
still readable in it. Give every item exactly one label:
PERSON: a human being's name or part of one (first name, surname, initial and
  surname, nickname). Staff, relatives and anyone else who is named count.
ADDRESS: part of where a private person lives: a house or building name, a
  street, a flat.
PERSONAL_NUMBER: a reference, account, policy, order, tracking, membership,
  passport or customer number, a password, or a code that belongs to one person.
ORGANISATION: a company, shop, clinic, school, council, charity, government
  body, department, team, scheme, law, benefit, product or brand.
PLACE: a town, city, region, country, ward or public building.
OTHER: anything else, such as a heading, job title, medicine, day, month,
  amount, course code or ordinary word.
Judge each item by how it is used in the document.`;

const LABELS = ['PERSON', 'ADDRESS', 'PERSONAL_NUMBER', 'ORGANISATION', 'PLACE', 'OTHER'] as const;
const LABEL_KIND: Partial<Record<(typeof LABELS)[number], string>> = {
  PERSON: 'PERSON',
  ADDRESS: 'ADDRESS',
  PERSONAL_NUMBER: 'ID_NUMBER',
};

/** One required label per numbered item: {"1": "PERSON", "2": "ORGANISATION", ...}. */
const labelSchema = (count: number) => {
  const keys = Array.from({ length: count }, (_, i) => String(i + 1));
  return {
    type: 'object',
    properties: Object.fromEntries(keys.map((k) => [k, { type: 'string', enum: LABELS }])),
    required: keys,
    additionalProperties: false,
  };
};

/** Which second pass runs. Set VITE_PASS2 to compare them in the benchmark. */
const PASS2 = ((import.meta.env.VITE_PASS2 as string | undefined) ?? 'label') as
  | 'review'
  | 'pick'
  | 'label'
  | 'both'
  | 'none';

const pickSchema = (candidates: string[]) => ({
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      maxItems: candidates.length,
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['PERSON', 'ADDRESS', 'ID_NUMBER', 'OTHER'] },
          value: { type: 'string', enum: candidates },
        },
        required: ['kind', 'value'],
        additionalProperties: false,
      },
    },
  },
  required: ['entities'],
  additionalProperties: false,
});

const CLOUD_SYSTEM = `You help people deal with letters and paperwork.
Personal details in the document were replaced with placeholders such as
[PERSON_1] or [ADDRESS_1] before it reached you. Treat every placeholder as
the real value it stands for. When you mention one, write it exactly as given,
brackets included. Never guess or ask what is behind a placeholder.
Be concrete and brief. Plain text, no markdown.`;

export const TASKS = {
  explain: 'Explain in plain English what this letter says and what it means for the recipient.',
  actions: 'List what the recipient needs to do, in order, with any deadlines and what happens if they miss them.',
  reply: 'Draft a polite, firm reply from the recipient that addresses the letter and asks for anything they are entitled to ask for.',
} as const;

export type Task = keyof typeof TASKS;

export interface Models {
  /** True when the last scrub skipped its second pass because this device is slow. */
  secondPassSkipped(): boolean;
  /** Call from a click handler. Resolves when the on-device model is usable. */
  prepareOnDevice(onProgress?: (fraction: number) => void): Promise<void>;
  extract: Extractor;
  transcribe(image: File): Promise<string>;
  ask(task: Task, redacted: string): Promise<{ text: string; source: string }>;
}

function assertOnDevice(source: string | undefined): void {
  // ONLY_ON_DEVICE should make this impossible. Checked anyway: a raw
  // document reaching the cloud is the one failure this app cannot have.
  if (source !== InferenceSource.ON_DEVICE) {
    throw new Error(`Scrub ran on "${source ?? 'unknown'}", expected on-device.`);
  }
}

export function createModels(ai: AI): Models {
  const lister = (system: string) => {
    const promptOptions: PromptOptions = { responseConstraint: entitySchema };
    const model = getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_ON_DEVICE,
      onDeviceParams: {
        createOptions: {
          initialPrompts: [{ role: 'system', content: [{ type: 'text', value: system }] }],
        },
        promptOptions,
      },
    });
    return { model, promptOptions };
  };
  const scrub = lister(SCRUB_SYSTEM);
  const review = lister(REVIEW_SYSTEM);
  const picker = lister(PICK_SYSTEM);
  const labeller = lister(LABEL_SYSTEM);

  const list = async (
    target: ReturnType<typeof lister>,
    text: string,
    constraint: object = entitySchema,
  ): Promise<RawEntity[]> => {
    const parsed = (await callJson(target, text, constraint)) as { entities?: RawEntity[] };
    return Array.isArray(parsed.entities) ? parsed.entities.slice(0, MAX_ENTITIES) : [];
  };

  // Durations of calls that finished, newest last. The time limit follows them.
  const durations: number[] = [];
  const timeLimit = (): number => {
    if (!durations.length) return FIRST_TIMEOUT_MS;
    const sorted = [...durations].sort((a, b) => a - b);
    const usual = sorted[Math.floor(sorted.length / 2)];
    return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, usual * 5));
  };
  let skippedSecondPass = false;

  const callJson = async (
    target: ReturnType<typeof lister>,
    text: string,
    constraint: object,
  ): Promise<unknown> => {
    // A small model sometimes loops until it hits its output limit, which
    // takes minutes and holds up every call queued behind it. Cancel it.
    const abort = new AbortController();
    target.promptOptions.signal = abort.signal;
    target.promptOptions.responseConstraint = constraint;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const limitMs = timeLimit();
    const started = performance.now();
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        abort.abort();
        reject(new Error(`On-device call took longer than ${Math.round(limitMs / 1000)} s.`));
      }, limitMs);
    });
    try {
      const result = await Promise.race([
        target.model.generateContent(`Document:\n\n${text}`, { signal: abort.signal }),
        timeout,
      ]);
      assertOnDevice(result.response.inferenceSource);
      const parsed: unknown = JSON.parse(result.response.text());
      durations.push(performance.now() - started);
      if (durations.length > 20) durations.shift();
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  };

  // Reads a photographed or scanned letter. Also pinned to the device.
  const vision: GenerativeModel = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE });

  const cloud: GenerativeModel = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: (import.meta.env.VITE_CLOUD_MODEL as string | undefined) ?? 'gemini-3.5-flash-lite',
      systemInstruction: CLOUD_SYSTEM,
    },
  });

  return {
    secondPassSkipped: () => skippedSecondPass,

    async prepareOnDevice(onProgress) {
      await scrub.model.initializeDeviceModel(onProgress);
    },

    async extract(chunk) {
      // First pass: one retry, because a failed call is usually a one-off.
      const firstStarted = performance.now();
      let first: RawEntity[];
      try {
        first = await list(scrub, chunk);
      } catch (err) {
        console.warn('Scrub pass failed, retrying once', err);
        first = await list(scrub, chunk);
      }
      // Mask what the patterns and the first pass found, then look again.
      const known = [...detectWithRegex(chunk), ...validateModelEntities(chunk, first)];
      known.push(...expandNameParts(known));
      const found = [...first];
      // On a slow machine one pass is already a long wait. Stop here; the
      // review marks still show the reader what is left.
      skippedSecondPass = performance.now() - firstStarted > SLOW_FIRST_PASS_MS;
      if (skippedSecondPass) return found;
      const masked = redact(chunk, known).redacted;
      // The second pass is a bonus. Losing it must not lose the first pass.
      if (PASS2 === 'review' || PASS2 === 'both') {
        try {
          found.push(...(await list(review, masked)));
        } catch (err) {
          console.warn('Review pass failed, keeping the first pass', err);
        }
      }
      if (PASS2 === 'pick' || PASS2 === 'both') {
        const candidates = [...new Set(findSuspects(masked).map((s) => s.text))].slice(0, MAX_ENTITIES);
        if (candidates.length) {
          try {
            const listed = candidates.map((c) => `- ${c}`).join('\n');
            found.push(...(await list(picker, `${masked}\n\nList:\n${listed}`, pickSchema(candidates))));
          } catch (err) {
            console.warn('Pick pass failed, keeping the first pass', err);
          }
        }
      }
      if (PASS2 === 'label') {
        const candidates = [...new Set(findSuspects(masked).map((s) => s.text))].slice(0, MAX_ENTITIES);
        if (candidates.length) {
          try {
            const listed = candidates.map((c, i) => `${i + 1}. ${c}`).join('\n');
            const labels = (await callJson(
              labeller,
              `${masked}\n\nItems:\n${listed}`,
              labelSchema(candidates.length),
            )) as Record<string, string>;
            candidates.forEach((value, i) => {
              const kind = LABEL_KIND[labels[String(i + 1)] as (typeof LABELS)[number]];
              // A small model calls some organisations people. The name gives those away.
              if (kind && !ORG_WORD.test(value)) found.push({ kind, value });
            });
          } catch (err) {
            console.warn('Label pass failed, keeping the first pass', err);
          }
        }
      }
      return found;
    },

    async transcribe(image) {
      const data = await toBase64(image);
      const result = await vision.generateContent([
        'Transcribe all the text in this image exactly. Keep the line breaks. Output only the text.',
        { type: 'inlineData', inlineData: { data, mimeType: image.type } },
      ]);
      assertOnDevice(result.response.inferenceSource);
      return result.response.text();
    },

    async ask(task, redacted) {
      const result = await cloud.generateContent(`${TASKS[task]}\n\nDocument:\n\n${redacted}`);
      return {
        text: result.response.text(),
        source: result.response.inferenceSource ?? 'unknown',
      };
    },
  };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
