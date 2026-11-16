// node scripts/run-answers.mjs
//
// Answer quality after scrubbing (see src/eval/answers.ts). Uses the cloud
// model, through the app's own path, on fictional letters only.
//   ANSWERS_MODE     quality (default), system or infer
//   ANSWERS_LETTERS  how many of the 20 letters (default 12)
//   ANSWERS_MAX      cap on cloud calls for this run (default 160)
// Calls are at least seven seconds apart. A quota error stops the run.
// The full report, answers included, goes to eval-results/ (git-ignored).

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, startChrome, startDevServer } from './chrome.mjs';

const MODE = process.env.ANSWERS_MODE ?? 'quality';
const LETTERS = Number(process.env.ANSWERS_LETTERS ?? 12);
const MAX = Number(process.env.ANSWERS_MAX ?? 160);
const pct = (k, n) => (n ? `${((100 * k) / n).toFixed(1)}%` : 'n/a');

let server;
let chrome;
let code = 3;
try {
  server = await startDevServer();
  chrome = await startChrome();
  const page = await chrome.browser.newPage();
  await page.goto(`${server.url}answers.html?mode=${MODE}&letters=${LETTERS}&max=${MAX}`, { waitUntil: 'networkidle0' });
  await page.click('#run');
  const deadline = Date.now() + 90 * 60_000;
  let last = '';
  while (!(await page.evaluate(() => document.body.dataset.done === '1'))) {
    if (Date.now() > deadline) throw new Error('Answer run did not finish in 90 minutes.');
    const now = await page.$eval('#progress', (n) => n.textContent);
    if (now !== last && /scrubbing|Stopped|Done/.test(now)) console.log(`  ${now}`);
    last = now;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const report = await page.evaluate(() => window.__airlockAnswers);
  const dir = path.join(ROOT, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `answers-${MODE}-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));

  console.log(`\nCloud calls: ${report.cloudCalls}${report.stopped ? `  STOPPED: ${report.stopped}` : ''}`);
  const groups = new Map();
  for (const a of report.answers) {
    const key = `${a.condition}${a.strict ? ' strict' : ''}`;
    const g = groups.get(key) ?? { n: 0, req: 0, reqN: 0, bad: 0, refusal: 0, errors: 0, issued: 0, exact: 0, altered: 0, invented: 0, unused: 0, pass: 0, judged: 0, byTask: {} };
    g.n++;
    if (a.error) g.errors++;
    g.req += a.required.filter(Boolean).length;
    g.reqN += a.required.length;
    g.bad += a.mustNot.filter(Boolean).length;
    g.refusal += a.refusal ? 1 : 0;
    g.issued += a.issued;
    g.exact += a.exact;
    g.altered += a.altered;
    g.invented += a.invented.length;
    g.unused += a.unused;
    if (a.judge) {
      g.judged++;
      if (/^\W*PASS/i.test(a.judge)) g.pass++;
    }
    const t = (g.byTask[a.task] ??= { req: 0, reqN: 0 });
    t.req += a.required.filter(Boolean).length;
    t.reqN += a.required.length;
    groups.set(key, g);
  }
  console.table(
    Object.fromEntries(
      [...groups].map(([k, g]) => [
        k,
        {
          answers: g.n,
          'facts present': pct(g.req, g.reqN),
          ...Object.fromEntries(Object.entries(g.byTask).map(([t, v]) => [t, pct(v.req, v.reqN)])),
          'judge pass': g.judged ? `${g.pass}/${g.judged}` : '',
          'wrong claims': g.bad,
          refusals: g.refusal,
          errors: g.errors,
          'placeholders issued': g.issued,
          'unused per answer': (g.unused / Math.max(1, g.n)).toFixed(1),
          exact: g.exact,
          altered: g.altered,
          invented: g.invented,
        },
      ]),
    ),
  );
  if (report.guesses) {
    const by = {};
    for (const g of report.guesses) {
      const b = (by[g.condition] ??= { n: 0, name: 0, town: 0, townReadable: 0, employer: 0, employerReadable: 0, condition: 0, conditionReadable: 0 });
      b.n++;
      if (g.nameRight) b.name++;
      for (const k of ['town', 'employer']) {
        if (g[k].inLetter) b[k]++;
        if (g[k].readable) b[`${k}Readable`]++;
      }
      if (g.condition_.inLetter) b.condition++;
      if (g.condition_.readable) b.conditionReadable++;
    }
    console.table(by);
  }
  console.log(`Saved ${path.relative(ROOT, file)}`);
  code = report.stopped ? 1 : 0;
} catch (err) {
  console.error(`\nHarness error: ${err?.stack ?? err}`);
} finally {
  await chrome?.close();
  await server?.close();
}
process.exit(code);
