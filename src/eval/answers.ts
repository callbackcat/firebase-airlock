import { detect, redact, restore, type Entity } from '../airlock';
import { initFirebase } from '../firebase';
import { applyUnhide, hideFirst } from '../hidefirst';
import { createModels, TASKS, type Models, type Task } from '../models';
import { ANSWER_FACTS, type AnswerFacts } from './answer-facts';
import { FIXTURES } from './fixtures';
import { HOLDOUT } from './holdout';

/**
 * Is the cloud answer still good after scrubbing? For 20 development letters
 * and the three tasks, this gets an answer for the raw letter and for each
 * way of scrubbing it, puts the real values back, and scores the answer
 * against a short list of facts it must contain.
 *
 * Every cloud call goes through the app's own Firebase AI Logic path. Only
 * fictional letters are used, so sending the raw letter is allowed here.
 * Calls are spaced out and capped.
 *
 *   ?mode=quality  answers for raw / a0 / hide-first before and after restores
 *   ?mode=system   the current cloud instruction against a stricter one
 *   ?mode=infer    what the cloud model can still guess about the subject
 */

type Condition = 'raw' | 'a0' | 'hf-before' | 'hf-after';

interface Scored {
  letter: string;
  task: Task;
  condition: Condition;
  strict: boolean;
  answer: string;
  required: boolean[];
  mustNot: boolean[];
  refusal: boolean;
  issued: number;
  exact: number;
  altered: number;
  invented: string[];
  unused: number;
  judge?: string;
  error?: string;
}

export interface AnswerReport {
  mode: string;
  startedAt: string;
  cloudCalls: number;
  stopped?: string;
  answers: Scored[];
  guesses?: unknown[];
}

declare global {
  interface Window {
    __airlockAnswers?: AnswerReport;
  }
}

const QUERY = new URLSearchParams(location.search);
const MODE = QUERY.get('mode') ?? 'quality';
const LIMIT = Number(QUERY.get('letters') ?? 20);
const MAX_CALLS = Number(QUERY.get('max') ?? 320);
const GAP_MS = 2200;
const $ = (id: string) => document.getElementById(id)!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LETTERS = [...FIXTURES, ...HOLDOUT].slice(0, LIMIT);
const REFUSAL = /\b(?:I(?:'m| am) (?:sorry|unable)|I can(?:'|no)t (?:help|assist|provide|comply)|cannot (?:help|assist) with|not able to (?:help|assist))\b/i;

const hit = (answer: string, sources: string[]) => sources.some((s) => new RegExp(s, 'i').test(answer));

async function run(): Promise<void> {
  const report: AnswerReport = { mode: MODE, startedAt: new Date().toISOString(), cloudCalls: 0, answers: [] };
  const progress = (s: string) => ($('progress').textContent = s);
  let models: Models | null = null;
  try {
    const ai = initFirebase();
    if (!ai) throw new Error('No Firebase config.');
    models = createModels(ai);
    await models.prepareOnDevice();

    let last = 0;
    const cloud = async <T,>(call: () => Promise<T>): Promise<T> => {
      if (models!.cloudCalls() >= MAX_CALLS) throw new Error(`Call cap of ${MAX_CALLS} reached.`);
      const wait = last + GAP_MS - performance.now();
      if (wait > 0) await sleep(wait);
      last = performance.now();
      return call();
    };

    for (const [n, letter] of LETTERS.entries()) {
      const facts: AnswerFacts | undefined = ANSWER_FACTS.find((f) => f.id === letter.id);
      if (!facts) continue;
      progress(`Letter ${n + 1} of ${LETTERS.length}: scrubbing`);

      // The four versions of the letter.
      const a0 = redact(letter.text, (await detect(letter.text, models.extract, models.pieceChars)).entities);
      const first = hideFirst(letter.text, true);
      const before = redact(letter.text, first.entities);
      const afterEntities: Entity[] = applyUnhide(letter.text, first, await models.unhide(letter.text, first.marks));
      const after = redact(letter.text, afterEntities);
      const versions: Record<Condition, { text: string; vault: Record<string, string> }> = {
        raw: { text: letter.text, vault: {} },
        a0: { text: a0.redacted, vault: a0.vault },
        'hf-before': { text: before.redacted, vault: before.vault },
        'hf-after': { text: after.redacted, vault: after.vault },
      };

      const score = async (task: Task, condition: Condition, strict: boolean, judged: boolean): Promise<void> => {
        const v = versions[condition];
        const row: Scored = {
          letter: letter.id, task, condition, strict, answer: '', required: [], mustNot: [], refusal: false,
          issued: Object.keys(v.vault).length, exact: 0, altered: 0, invented: [], unused: 0,
        };
        try {
          progress(`Letter ${n + 1} of ${LETTERS.length}: ${task} / ${condition}${strict ? ' / strict' : ''} (${models!.cloudCalls()} cloud calls)`);
          const raw = (await cloud(() => models!.ask(task, v.text, strict))).text;
          const back = restore(raw, v.vault);
          row.answer = back.text;
          row.exact = back.exact;
          row.altered = back.altered;
          row.invented = back.invented;
          row.unused = back.unused;
          row.required = facts.required.map((f) => hit(back.text, f.any));
          row.mustNot = facts.mustNot.map((f) => f.any.length > 0 && hit(back.text, f.any));
          row.refusal = REFUSAL.test(back.text) && back.text.length < 400;
          if (judged) {
            row.judge = await cloud(() =>
              models!.cloudPlain(
                `You are marking an answer about a letter. Marking rule: the answer passes only if it gets this right: ${facts.judge}\n` +
                  `Reply with PASS or FAIL as the first word, then one short sentence.\n\nLETTER:\n${letter.text}\n\nTASK: ${TASKS[task]}\n\nANSWER:\n${back.text}`,
              ),
            );
          }
        } catch (err) {
          row.error = err instanceof Error ? err.message : String(err);
          if (/quota|429|RESOURCE_EXHAUSTED|Call cap/i.test(row.error)) {
            report.answers.push(row);
            throw err;
          }
        }
        report.answers.push(row);
      };

      if (MODE === 'quality') {
        for (const task of Object.keys(TASKS) as Task[]) {
          for (const condition of ['raw', 'a0', 'hf-before', 'hf-after'] as Condition[]) {
            await score(task, condition, false, task === 'explain');
          }
        }
      } else if (MODE === 'system') {
        for (const condition of ['a0', 'hf-after'] as Condition[]) {
          await score('actions', condition, false, false);
          await score('actions', condition, true, false);
        }
      } else if (MODE === 'infer') {
        report.guesses ??= [];
        for (const condition of ['a0', 'hf-after'] as Condition[]) {
          const v = versions[condition];
          progress(`Letter ${n + 1} of ${LETTERS.length}: guessing from ${condition}`);
          let guess: Record<string, string> = {};
          let error: string | undefined;
          try {
            const text = await cloud(() =>
              models!.cloudPlain(
                'Below is a fictional test letter from which personal details were removed (placeholders in square brackets). ' +
                  'From the text that is left, guess as well as you can who the letter is about. ' +
                  'Reply with JSON only, with the keys name, town, employer, age_band (one of under-18, 18-39, 40-64, 65-plus) and condition (a health condition, or none). ' +
                  'Use "unknown" where you cannot guess.\n\n' + v.text,
              ),
            );
            guess = JSON.parse(text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')) as Record<string, string>;
          } catch (err) {
            error = err instanceof Error ? err.message : String(err);
            if (/quota|429|RESOURCE_EXHAUSTED|Call cap/i.test(error)) throw err;
          }
          const original = letter.text.toLowerCase();
          const scrubbed = v.text.toLowerCase();
          const subjectNames = letter.gold.filter((g) => g.kind === 'PERSON' && g.who !== 'other').map((g) => g.value.toLowerCase());
          const known = (value: unknown): value is string => typeof value === 'string' && !/^(unknown|none|n\/a)$/i.test(value.trim());
          const seen = (value: unknown) => ({
            inLetter: known(value) && original.includes(value.toLowerCase()),
            readable: known(value) && scrubbed.includes(value.toLowerCase()),
          });
          report.guesses.push({
            letter: letter.id,
            condition,
            guess,
            error,
            // A right guess of the name: it contains a labelled part of the subject's name.
            nameRight: known(guess.name) && subjectNames.some((s) => guess.name.toLowerCase().includes(s)),
            // For the rest: is the guess in the original letter, and had the scrub left it readable?
            town: seen(guess.town),
            employer: seen(guess.employer),
            condition_: seen(guess.condition),
            ageBand: guess.age_band,
          });
        }
      }
    }
  } catch (err) {
    report.stopped = err instanceof Error ? err.message : String(err);
  }
  report.cloudCalls = models?.cloudCalls() ?? 0;
  window.__airlockAnswers = report;
  progress(report.stopped ? `Stopped: ${report.stopped}` : `Done. ${report.cloudCalls} cloud calls.`);
  document.body.dataset.done = '1';
}

($('run') as HTMLButtonElement).onclick = () => void run();
