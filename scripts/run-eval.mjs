// npm run eval
//
// Opens eval.html in a real Chrome, runs the benchmark, saves the report to
// eval-results/ and prints a summary. Exit code: 0 pass, 1 marginal or fail,
// 2 the on-device model did not run, 3 the harness itself broke.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promptApiState, ROOT, startChrome, startDevServer } from './chrome.mjs';

const TIMEOUT_MIN = Number(process.env.EVAL_TIMEOUT_MIN ?? 45);
const pct = (n) => (n === null || n === undefined ? 'n/a' : `${(n * 100).toFixed(1)}%`);

let server;
let chrome;
let code = 3;
try {
  server = await startDevServer();
  chrome = await startChrome();
  console.log(`Chrome ${chrome.version}\nProfile ${chrome.profile}\nPage ${server.url}eval.html\n`);

  const page = await chrome.browser.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(`${server.url}eval.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#run');
  console.log(await page.$eval('#env', (n) => n.textContent));
  console.log(await promptApiState(page), '\n');

  await page.click('#run');
  const deadline = Date.now() + TIMEOUT_MIN * 60_000;
  let last = '';
  while (!(await page.evaluate(() => document.body.dataset.done === '1'))) {
    if (Date.now() > deadline) throw new Error(`Benchmark did not finish in ${TIMEOUT_MIN} minutes.`);
    const now = await page.$eval('#progress', (n) => n.textContent);
    if (now !== last) console.log(`  ${(last = now)}`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  const report = await page.evaluate(() => window.__airlockEval);
  report.chromeVersion = chrome.version;
  report.consoleErrors = consoleErrors;

  const dir = path.join(ROOT, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${report.startedAt.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));

  const s = report.summary;
  console.log(`\n${report.verdict.level.toUpperCase()}: ${report.verdict.reason}`);
  if (report.onDeviceError) console.log(`On-device error: ${report.onDeviceError}`);
  console.log('');
  console.table(
    Object.fromEntries(
      [
        ['Subject details', s.subject],
        ['Staff / third parties', s.other],
        ...Object.entries(s.byKind).sort(([a], [b]) => a.localeCompare(b)),
        ['Everything', s.all],
      ].map(([name, t]) => [
        name,
        { items: t.total, 'patterns alone': pct(t.total ? t.hiddenByPatterns / t.total : null), 'with model': pct(t.recall) },
      ]),
    ),
  );
  console.log(`Useful facts kept: ${s.keep.kept}/${s.keep.total} (${pct(s.keep.rate)})`);
  console.log(`Model spans used: ${s.model.spansUsed} of ${s.model.spansRaw} returned`);
  console.log(`Median time per letter: ${s.medianMs} ms`);
  if (s.misses.length) {
    console.log(`\nStill readable (${s.misses.length}):`);
    for (const m of s.misses) console.log(`  ${m.doc.padEnd(14)} ${m.kind.padEnd(10)} ${m.who.padEnd(8)} ${m.value}`);
  }
  if (s.overRedacted.length) {
    console.log(`\nUseful facts lost (${s.overRedacted.length}):`);
    for (const o of s.overRedacted) console.log(`  ${o.doc.padEnd(14)} ${o.value}`);
  }
  if (consoleErrors.length) console.log(`\nBrowser console errors:\n  ${consoleErrors.slice(0, 10).join('\n  ')}`);
  console.log(`\nSaved ${path.relative(ROOT, file)}`);

  code = { pass: 0, marginal: 1, fail: 1, 'no-model': 2 }[report.verdict.level] ?? 3;
} catch (err) {
  console.error(`\nHarness error: ${err?.stack ?? err}`);
} finally {
  await chrome?.close();
  await server?.close();
}
process.exit(code);
