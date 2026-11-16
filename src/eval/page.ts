import { detect, type Detection, type Extractor } from '../airlock';
import { applyUnhide, hideFirst } from '../hidefirst';
import { loadWordLists } from '../wordlists';
import { on } from '../flags';
import { initFirebase } from '../firebase';
import { canaryLog, createModels, labelLog, onDeviceCalls, type Models } from '../models';
import { FIXTURES as MAIN_SET, type Fixture } from './fixtures';
import { HOLDOUT } from './holdout';
import { HOLDOUT2 } from './holdout2';
import { HOLDOUT3 } from './holdout3';
import { HOLDOUT4 } from './holdout4';
import { HOLDOUT5 } from './holdout5';
import { HOLDOUT6 } from './holdout6';
import { LONG_CLEAN, LONG_DEV } from './long';
import { scoreDoc, summarise, verdict, type DocScore, type Summary } from './score';

/**
 * Benchmark page for the scrub step. Runs every labelled letter through the
 * same code path as the app (patterns, then the on-device model through
 * Firebase AI Logic) and reports what was still readable afterwards.
 *
 * Nothing here calls the cloud model.
 */

export interface EvalReport {
  startedAt: string;
  finishedAt: string;
  userAgent: string;
  firebaseConfigured: boolean;
  onDevice: 'ready' | 'unavailable';
  onDeviceError?: string;
  /** Un-hide calls made, and how many were discarded because a canary came back restorable or the reply was malformed. */
  canaries?: { calls: number; fired: number; malformed: number };
  /** Items whose label changed with the line they were shown on. Diagnostic plans only. */
  labelDiffs?: unknown;
  summary: Summary;
  verdict: ReturnType<typeof verdict>;
  docs: DocScore[];
}

declare global {
  interface Window {
    __airlockEval?: EvalReport;
  }
}

// ?set=NAME picks the letters. Sets that live in the repo are imported; the
// outside sets are read at run time from the git-ignored outside-data/ folder.
const DEV_ALL = [...MAIN_SET, ...HOLDOUT, ...HOLDOUT2, ...HOLDOUT3, ...HOLDOUT4, ...HOLDOUT5, ...HOLDOUT6];
const SETS: Record<string, Fixture[]> = {
  holdout: HOLDOUT,
  holdout2: HOLDOUT2,
  holdout3: HOLDOUT3,
  holdout4: HOLDOUT4,
  holdout5: HOLDOUT5,
  holdout6: HOLDOUT6,
  'dev-all': DEV_ALL,
  'long-dev': LONG_DEV,
  'long-clean': LONG_CLEAN,
};
const LAZY: Record<string, () => Promise<Fixture[]>> = {
  'final-set': async () => (await import('./final-set')).FINAL_SET,
  'stress-ambiguous': async () => (await import('./stress')).STRESS_AMBIGUOUS,
  'stress-medical': async () => (await import('./stress')).STRESS_MEDICAL,
  'stress-base': async () => (await import('./stress')).STRESS_BASE,
  'stress-lower': async () => (await import('./stress')).STRESS_LOWER,
  'stress-upper': async () => (await import('./stress')).STRESS_UPPER,
  'stress-instructions': async () => (await import('./stress')).STRESS_INSTRUCTIONS,
  'stress-messy': async () => (await import('./stress')).STRESS_MESSY,
  'stress-traps': async () => (await import('./stress')).STRESS_TRAPS,
  'stress-instructions-wide': async () => (await import('./stress')).STRESS_INSTRUCTIONS_WIDE,
  'outside-dev': async () => (await fetch('/outside-data/outside-dev.json')).json() as Promise<Fixture[]>,
  'outside-final': async () => (await fetch('/outside-data/outside-final.json')).json() as Promise<Fixture[]>,
  'final-medical': async () => (await import('./final-medical')).FINAL_MEDICAL,
  // Real court judgments (Text Anonymization Benchmark). Local only: see CLAUDE.md rule 4.
  'tab-train10': async () => (await fetch('/outside-data/tab/tab-train10.json')).json() as Promise<Fixture[]>,
  'tab-test100': async () => (await fetch('/outside-data/tab/tab-test100.json')).json() as Promise<Fixture[]>,
};
const SET_NAME = new URLSearchParams(location.search).get('set') ?? '';
const loadFixtures = async (): Promise<Fixture[]> => (LAZY[SET_NAME] ? LAZY[SET_NAME]() : (SETS[SET_NAME] ?? MAIN_SET));

const $ = (id: string) => document.getElementById(id)!;
const runBtn = $('run') as HTMLButtonElement;
const progress = $('progress');

let models: Models | null = null;
try {
  const ai = initFirebase();
  if (ai) models = createModels(ai);
} catch (err) {
  console.error('Firebase init failed', err);
}
$('env').textContent = models
  ? 'Firebase AI Logic connected.'
  : 'No Firebase config: only the fixed patterns will run.';

const pct = (n: number | null) => (n === null ? 'n/a' : `${(n * 100).toFixed(1)}%`);

function cell(text: string, className = ''): HTMLTableCellElement {
  const td = document.createElement('td');
  td.textContent = text;
  td.className = className;
  return td;
}

function row(cells: Array<string | [string, string]>): HTMLTableRowElement {
  const tr = document.createElement('tr');
  for (const c of cells) tr.append(typeof c === 'string' ? cell(c) : cell(c[0], c[1]));
  return tr;
}

function render(report: EvalReport): void {
  const s = report.summary;
  const v = $('verdict');
  v.textContent = `${report.verdict.level.toUpperCase()}: ${report.verdict.reason}`;
  v.className = `verdict ${report.verdict.level}`;

  const kinds = $('kinds');
  kinds.replaceChildren(
    row(['Subject details', String(s.subject.total), pct(s.subject.total ? s.subject.hiddenByPatterns / s.subject.total : null), pct(s.subject.recall)]),
    row(['Staff and third parties', String(s.other.total), pct(s.other.total ? s.other.hiddenByPatterns / s.other.total : null), pct(s.other.recall)]),
    ...Object.entries(s.byKind)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kind, t]) => row([kind, String(t.total), pct(t.total ? t.hiddenByPatterns / t.total : null), pct(t.recall)])),
    row(['Everything', String(s.all.total), pct(s.all.total ? s.all.hiddenByPatterns / s.all.total : null), pct(s.all.recall)]),
  );

  $('docs').replaceChildren(
    ...report.docs.map((d) => {
      const missed = d.items.filter((i) => !i.hidden).map((i) => i.value);
      const lost = d.keep.filter((k) => !k.kept).map((k) => k.value);
      return row([
        d.title,
        d.modelUsed ? 'yes' : ['no', 'bad'],
        `${d.items.filter((i) => i.hidden).length}/${d.items.length}`,
        missed.length ? [missed.join(' · '), 'bad'] : 'none',
        lost.length ? [lost.join(' · '), 'warn'] : 'none',
        `${d.modelSpansUsed}/${d.modelSpansRaw}`,
        `${d.ms} ms`,
      ]);
    }),
  );

  $('extra').textContent =
    `Useful facts kept: ${s.keep.kept}/${s.keep.total} (${pct(s.keep.rate)}). ` +
    `Model spans used: ${s.model.spansUsed} of ${s.model.spansRaw} returned. ` +
    `Median time per letter: ${s.medianMs} ms.`;
  $('json').textContent = JSON.stringify(report, null, 2);
}

async function run(): Promise<void> {
  runBtn.disabled = true;
  delete document.body.dataset.done;
  const startedAt = new Date().toISOString();

  let onDevice: EvalReport['onDevice'] = 'unavailable';
  let onDeviceError: string | undefined;
  if (models) {
    try {
      progress.textContent = 'Preparing the on-device model…';
      await models.prepareOnDevice((f) => {
        progress.textContent = `Downloading the on-device model: ${Math.round(f * 100)}%`;
      });
      onDevice = 'ready';
    } catch (err) {
      onDeviceError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.warn('On-device model unavailable', err);
    }
  }

  const docs: DocScore[] = [];
  const FIXTURES = await loadFixtures();
  // The no-restore rule uses the name list, so hide-first always loads it.
  if ((models?.arm ?? 'a0') !== 'a0' || on('names') || on('nameslc') || on('lc')) await loadWordLists();
  for (const [i, fixture] of FIXTURES.entries()) {
    progress.textContent = `Letter ${i + 1} of ${FIXTURES.length}: ${fixture.title}`;
    let raw = 0;
    const counting: Extractor | undefined =
      onDevice === 'ready' && models
        ? async (chunk) => {
            const spans = await models!.extract(chunk);
            raw += spans.length;
            return spans;
          }
        : undefined;
    const started = performance.now();
    const callsBefore = onDeviceCalls();
    let detection: Detection;
    let safeMs: number | undefined;
    let restoredProtected = 0;
    let blocked: Record<string, string> | undefined;
    const canariesBefore = canaryLog.fired;
    const arm = models?.arm ?? 'a0';
    if (arm === 'a0') {
      detection = await detect(fixture.text, counting, models?.pieceChars);
    } else {
      // Hide first: safe as soon as the patterns and the marker have run.
      const first = hideFirst(fixture.text, arm !== 'a1');
      safeMs = Math.round(performance.now() - started);
      blocked = first.blocked;
      let entities = first.entities;
      if ((arm === 'a3' || arm === 'a4') && onDevice === 'ready' && models) {
        const result = await models.unhide(fixture.text, first.marks);
        raw += result.restore.length;
        // The model may only restore marked items. Anything else it names is counted and ignored.
        const marks = new Set(first.marks);
        restoredProtected = result.restore.filter((v) => !marks.has(v)).length;
        entities = applyUnhide(fixture.text, first, result);
      }
      detection = { entities, modelUsed: true };
    }
    const scored = scoreDoc(fixture, detection, Math.round(performance.now() - started), raw);
    scored.safeMs = safeMs;
    scored.labels = labelLog.splice(0);
    scored.restoredProtected = restoredProtected;
    scored.blocked = blocked;
    scored.canaryFired = canaryLog.fired - canariesBefore;
    scored.sources = Object.fromEntries(detection.entities.map((e) => [e.value, e.source]));
    scored.calls = onDeviceCalls() - callsBefore;
    docs.push(scored);
  }

  const summary = summarise(docs);
  const report: EvalReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    firebaseConfigured: models !== null,
    onDevice,
    onDeviceError,
    canaries: { ...canaryLog },
    labelDiffs: (window as { __airlockLabelDiffs?: unknown }).__airlockLabelDiffs,
    summary,
    verdict: verdict(summary),
    docs,
  };
  window.__airlockEval = report;
  render(report);
  progress.textContent = 'Done.';
  document.body.dataset.done = '1';
  runBtn.disabled = false;
}

runBtn.onclick = () => void run();
