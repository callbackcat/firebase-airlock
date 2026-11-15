import { detect, type Extractor } from '../airlock';
import { initFirebase } from '../firebase';
import { createModels, type Models } from '../models';
import { FIXTURES as MAIN_SET } from './fixtures';
import { HOLDOUT } from './holdout';
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
  summary: Summary;
  verdict: ReturnType<typeof verdict>;
  docs: DocScore[];
}

declare global {
  interface Window {
    __airlockEval?: EvalReport;
  }
}

// ?set=holdout runs the letters that were never used for tuning.
const FIXTURES = new URLSearchParams(location.search).get('set') === 'holdout' ? HOLDOUT : MAIN_SET;

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
    const detection = await detect(fixture.text, counting);
    docs.push(scoreDoc(fixture, detection, Math.round(performance.now() - started), raw));
  }

  const summary = summarise(docs);
  const report: EvalReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    firebaseConfigured: models !== null,
    onDevice,
    onDeviceError,
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
