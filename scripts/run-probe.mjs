// node scripts/run-probe.mjs
//
// Opens probe.html in a real Chrome and measures where the time in one
// on-device call goes. Saves the report to eval-results/probe-*.json.
// PROBE_N sets how many times each call is repeated (default 5).
// PROBE_MODE picks the measurement: base, ceiling, formats or idle.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, startChrome, startDevServer } from './chrome.mjs';

const N = Number(process.env.PROBE_N ?? 5);
const TIMEOUT_MIN = Number(process.env.EVAL_TIMEOUT_MIN ?? 30);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const range = (xs) => (xs.length ? `${Math.min(...xs)}-${Math.max(...xs)}` : '');

let server;
let chrome;
let code = 3;
try {
  server = await startDevServer();
  chrome = await startChrome();
  console.log(`Chrome ${chrome.version}  features: ${process.env.CHROME_FEATURES ?? 'default'}\n`);
  const page = await chrome.browser.newPage();
  await page.goto(`${server.url}probe.html?n=${N}&mode=${process.env.PROBE_MODE ?? 'base'}`, { waitUntil: 'networkidle0' });
  await page.click('#run');
  const deadline = Date.now() + TIMEOUT_MIN * 60_000;
  let last = '';
  while (!(await page.evaluate(() => document.body.dataset.done === '1'))) {
    if (Date.now() > deadline) throw new Error(`Probe did not finish in ${TIMEOUT_MIN} minutes.`);
    const now = await page.$eval('#progress', (n) => n.textContent);
    if (now !== last) process.stdout.write(`\r  ${(last = now)}          `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const report = await page.evaluate(() => window.__airlockProbe);
  report.chromeVersion = chrome.version;
  report.chromeFeatures = process.env.CHROME_FEATURES ?? '';
  const dir = path.join(ROOT, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `probe-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));

  console.log('\n');
  console.table(
    Object.fromEntries(
      report.rows.map((r) => [
        r.name,
        {
          in: r.inputChars,
          out: median(r.outputChars),
          'first ms': median(r.firstMs),
          'total ms': median(r.totalMs),
          'total range': range(r.totalMs),
          error: r.error ?? '',
        },
      ]),
    ),
  );
  if (report.parallel) {
    console.log(
      `Two reading calls: one after the other ${median(report.parallel.sequentialMs)} ms, at once ${median(report.parallel.togetherMs)} ms`,
    );
  }
  if (report.error) console.log(`Probe stopped: ${report.error}`);
  console.log(`Saved ${path.relative(ROOT, file)}`);
  code = report.error ? 1 : 0;
} catch (err) {
  console.error(`\nHarness error: ${err?.stack ?? err}`);
} finally {
  await chrome?.close();
  await server?.close();
}
process.exit(code);
