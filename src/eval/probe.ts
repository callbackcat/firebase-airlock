import { getGenerativeModel, InferenceMode, InferenceSource, type AI } from 'firebase/ai';
import { detectWithRegex, expandNameParts, redact } from '../airlock';
import { initFirebase } from '../firebase';
import { LABEL_SYSTEM, SCRUB_SYSTEM, entitySchema, labelSchema } from '../models';
import { findSuspects } from '../suspects';
import { FIXTURES } from './fixtures';

/**
 * Timing probe for the on-device model. It answers one question: where does
 * the time in a call go? Every call is streamed, so each one gives two
 * numbers: time to the first piece of output (starting a session and reading
 * the input) and time from there to the end (writing the answer).
 *
 * Only tuning letters are used. Nothing here calls the cloud model.
 */

export interface ProbeRow {
  name: string;
  what: string;
  inputChars: number;
  outputChars: number[];
  firstMs: number[];
  totalMs: number[];
  error?: string;
}

export interface ProbeReport {
  startedAt: string;
  userAgent: string;
  rows: ProbeRow[];
  parallel?: { sequentialMs: number[]; togetherMs: number[] };
  error?: string;
}

declare global {
  interface Window {
    __airlockProbe?: ProbeReport;
  }
}

const REPEATS = Number(new URLSearchParams(location.search).get('n') ?? 5);
const $ = (id: string) => document.getElementById(id)!;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

interface Options {
  system?: string;
  constraint?: object;
  /** Leave the constraint out of what the model reads. */
  omitConstraint?: boolean;
}

function make(ai: AI, o: Options) {
  const promptOptions: Record<string, unknown> = {};
  if (o.constraint) promptOptions.responseConstraint = o.constraint;
  if (o.omitConstraint) promptOptions.omitResponseConstraintInput = true;
  return getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_ON_DEVICE,
    onDeviceParams: {
      createOptions: o.system
        ? { initialPrompts: [{ role: 'system', content: [{ type: 'text', value: o.system }] }] }
        : {},
      promptOptions,
    },
  });
}

async function timed(model: ReturnType<typeof make>, input: string) {
  const started = performance.now();
  const result = await model.generateContentStream(input);
  let first = 0;
  let text = '';
  for await (const chunk of result.stream) {
    if (!first) first = performance.now() - started;
    text += chunk.text();
  }
  const total = performance.now() - started;
  const response = await result.response;
  if (response.inferenceSource !== InferenceSource.ON_DEVICE) throw new Error('Probe call did not run on device.');
  return { first: Math.round(first || total), total: Math.round(total), chars: text.length };
}

async function measure(
  ai: AI,
  name: string,
  what: string,
  input: string,
  o: Options,
  progress: (s: string) => void,
): Promise<ProbeRow> {
  const row: ProbeRow = { name, what, inputChars: input.length, outputChars: [], firstMs: [], totalMs: [] };
  try {
    const model = make(ai, o);
    for (let i = 0; i < REPEATS; i++) {
      progress(`${name} ${i + 1}/${REPEATS}`);
      const t = await timed(model, input);
      row.firstMs.push(t.first);
      row.totalMs.push(t.total);
      row.outputChars.push(t.chars);
    }
  } catch (err) {
    row.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
  return row;
}

async function run(): Promise<void> {
  const report: ProbeReport = { startedAt: new Date().toISOString(), userAgent: navigator.userAgent, rows: [] };
  const progress = (s: string) => ($('progress').textContent = s);
  try {
    const ai = initFirebase();
    if (!ai) throw new Error('No Firebase config.');

    // One page of letter, and the same letter repeated to about 4,000 characters.
    const page = FIXTURES[0].text;
    let long = page;
    for (let i = 1; long.length < 3600 && i < FIXTURES.length; i++) long += `\n\n${FIXTURES[i].text}`;
    long = long.slice(0, 4000);

    // What the label pass reads for that page: the masked letter and its items.
    const known = detectWithRegex(page);
    known.push(...expandNameParts(known));
    const masked = redact(page, known).redacted;
    const items = [...new Set(findSuspects(masked).map((s) => s.text))].slice(0, 40);
    const listed = items.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const labelInput = `Document:\n\n${masked}\n\nItems:\n${listed}`;
    // The same items with only the line each one sits on.
    const lines = masked.split('\n');
    const withLines = items
      .map((c, i) => `${i + 1}. ${c} | ${(lines.find((l) => l.includes(c)) ?? '').trim().slice(0, 160)}`)
      .join('\n');
    const letters = new RegExp(`^[PANOLX]{${items.length}}$`);

    progress('Loading the model…');
    await make(ai, {}).initializeDeviceModel();
    const cold = await timed(make(ai, { constraint: /^[A-Z]$/ }), 'Hi');
    report.rows.push({ name: 'cold', what: 'Very first call after the page opened', inputChars: 2, outputChars: [cold.chars], firstMs: [cold.first], totalMs: [cold.total] });

    const one = /^[A-Z]$/;
    const plan: Array<[string, string, string, Options]> = [
      ['A', 'One word in, one character out, no system prompt', 'Hi', { constraint: one }],
      ['A-system', 'One word in, one character out, with the label system prompt', 'Hi', { system: LABEL_SYSTEM, constraint: one }],
      ['B-page', 'One page in, one character out', `Document:\n\n${page}`, { constraint: one }],
      ['B-4000', '4,000 characters in, one character out', `Document:\n\n${long}`, { constraint: one }],
      ['C-400', 'One word in, 400 forced characters out', 'Write.', { constraint: /^[a-z ]{400}$/ }],
      ['pass1', 'Real first pass: scrub prompt, one page, entity list', `Document:\n\n${page}`, { system: SCRUB_SYSTEM, constraint: entitySchema }],
      ['pass1-omit', 'Same, with the schema left out of the input', `Document:\n\n${page}`, { system: SCRUB_SYSTEM, constraint: entitySchema, omitConstraint: true }],
      ['pass2', 'Real label pass: masked page plus items, JSON labels', labelInput, { system: LABEL_SYSTEM, constraint: labelSchema(items.length) }],
      ['pass2-omit', 'Same, with the schema left out of the input', labelInput, { system: LABEL_SYSTEM, constraint: labelSchema(items.length), omitConstraint: true }],
      ['pass2-letters', 'Label pass answering one letter per item', labelInput, { system: LABEL_SYSTEM, constraint: letters, omitConstraint: true }],
      ['pass2-lines', 'Label pass reading only the line of each item, one letter per item', `Items, each with the line it appears on:\n${withLines}`, { system: LABEL_SYSTEM, constraint: letters, omitConstraint: true }],
    ];
    for (const [name, what, input, o] of plan) report.rows.push(await measure(ai, name, what, input, o, progress));

    // Two reading calls one after the other, then the same two at once.
    const a = make(ai, { constraint: one });
    const b = make(ai, { constraint: one });
    const input = `Document:\n\n${page}`;
    const parallel = { sequentialMs: [] as number[], togetherMs: [] as number[] };
    for (let i = 0; i < REPEATS; i++) {
      progress(`parallel ${i + 1}/${REPEATS}`);
      let t = performance.now();
      await timed(a, input);
      await timed(b, input);
      parallel.sequentialMs.push(Math.round(performance.now() - t));
      t = performance.now();
      await Promise.all([timed(a, input), timed(b, input)]);
      parallel.togetherMs.push(Math.round(performance.now() - t));
    }
    report.parallel = parallel;
  } catch (err) {
    report.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  const tbody = $('rows');
  tbody.replaceChildren(
    ...report.rows.map((r) => {
      const tr = document.createElement('tr');
      for (const v of [r.name, r.what, r.inputChars, median(r.outputChars), median(r.firstMs), median(r.totalMs), r.error ?? '']) {
        const td = document.createElement('td');
        td.textContent = String(v);
        tr.append(td);
      }
      return tr;
    }),
  );
  progress(report.error ? `Stopped: ${report.error}` : 'Done.');
  window.__airlockProbe = report;
  document.body.dataset.done = '1';
}

($('run') as HTMLButtonElement).onclick = () => void run();
