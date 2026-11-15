import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
  Schema,
  type AI,
  type GenerativeModel,
} from 'firebase/ai';
import {
  detectWithRegex,
  expandNameParts,
  redact,
  validateModelEntities,
  type Extractor,
  type RawEntity,
} from './airlock';

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

const entitySchema = Schema.object({
  properties: {
    entities: Schema.array({
      items: Schema.object({
        properties: {
          kind: Schema.enumString({ enum: MODEL_KINDS }),
          value: Schema.string(),
        },
      }),
    }),
  },
});

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
  const scrub: GenerativeModel = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_ON_DEVICE,
    onDeviceParams: {
      createOptions: {
        initialPrompts: [{ role: 'system', content: [{ type: 'text', value: SCRUB_SYSTEM }] }],
      },
      promptOptions: { responseConstraint: entitySchema },
    },
  });

  const review: GenerativeModel = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_ON_DEVICE,
    onDeviceParams: {
      createOptions: {
        initialPrompts: [{ role: 'system', content: [{ type: 'text', value: REVIEW_SYSTEM }] }],
      },
      promptOptions: { responseConstraint: entitySchema },
    },
  });

  const list = async (model: GenerativeModel, text: string): Promise<RawEntity[]> => {
    const result = await model.generateContent(`Document:\n\n${text}`);
    assertOnDevice(result.response.inferenceSource);
    const parsed = JSON.parse(result.response.text()) as { entities?: RawEntity[] };
    return Array.isArray(parsed.entities) ? parsed.entities : [];
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
    async prepareOnDevice(onProgress) {
      await scrub.initializeDeviceModel(onProgress);
    },

    async extract(chunk) {
      const first = await list(scrub, chunk);
      // Mask what the patterns and the first pass found, then look again.
      const known = [...detectWithRegex(chunk), ...validateModelEntities(chunk, first)];
      known.push(...expandNameParts(known));
      const second = await list(review, redact(chunk, known).redacted);
      return [...first, ...second];
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
