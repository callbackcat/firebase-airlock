// npm run e2e
//
// Drives the real app once and checks the claim it makes, at the network level:
//
//   1. With the page offline, the scrub still runs on the device.
//   2. Nothing leaves the machine while scrubbing.
//   3. The request that does go to the cloud contains none of the hidden values.
//   4. The answer comes back and real values are restored locally.
//
// Saves a report and a screenshot to eval-results/. Exit code 0 when every
// check passes, 1 when one fails, 3 when the script itself broke.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promptApiState, ROOT, startChrome, startDevServer } from './chrome.mjs';

const isLocal = (url) => /^(https?:\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]|data:|blob:|chrome)/.test(url);
const host = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 40);
  }
};

let server;
let chrome;
let code = 3;
try {
  server = await startDevServer();
  chrome = await startChrome();
  console.log(`Chrome ${chrome.version}\nPage ${server.url}\n`);

  const page = await chrome.browser.newPage();
  const requests = [];
  let phase = 'load';
  page.on('request', (r) => {
    if (!isLocal(r.url())) requests.push({ phase, method: r.method(), url: r.url(), body: r.postData() ?? '' });
  });
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto(server.url, { waitUntil: 'networkidle0' });
  console.log(await promptApiState(page));
  const pills = () => page.$$eval('#status .pill', (ps) => ps.map((p) => p.textContent));
  const firebase = (await pills()).some((t) => t.includes('connected'));

  // Scrub once online so the model is initialised (first use may download it).
  const scrub = async () => {
    await page.$eval('#scrub-note', (n) => (n.textContent = ''));
    await page.click('#sample');
    await page.waitForFunction(() => /Scrubbed/.test(document.getElementById('scrub-note').textContent), {
      timeout: Number(process.env.EVAL_TIMEOUT_MIN ?? 45) * 60_000,
    });
    return page.$eval('#scrub-note', (n) => n.textContent);
  };
  phase = 'warm-up scrub';
  const warm = await scrub();
  const modelRan = warm.includes('on device');

  // Scrub again with the page offline.
  phase = 'offline scrub';
  await page.setOfflineMode(true);
  const offline = await scrub();
  await page.setOfflineMode(false);
  const offlineOk = offline.includes('on device');

  const hiddenValues = await page.$$eval('#entities tbody td.v:not(.off)', (tds) => tds.map((td) => td.textContent));
  const outgoing = await page.$eval('#preview', (n) => n.textContent);

  // Send the scrubbed text to the cloud.
  let answer = '';
  let restored = [];
  let sendNote = '';
  phase = 'cloud call';
  const canSend = await page.$eval('#send', (b) => !b.disabled);
  if (canSend) {
    await page.click('#send');
    await page.waitForFunction(
      () => document.querySelector('#receipt dd') || /failed|Blocked/.test(document.getElementById('send-note').textContent),
      { timeout: 120_000 },
    );
    sendNote = await page.$eval('#send-note', (n) => n.textContent);
    answer = await page.$eval('#answer', (n) => n.textContent);
    restored = await page.$$eval('#answer .restored', (ns) => ns.map((n) => n.textContent));
  } else {
    sendNote = await page.$eval('#send-note', (n) => n.textContent);
  }
  phase = 'after';

  const duringScrub = requests.filter((r) => r.phase === 'offline scrub');
  const cloudCalls = requests.filter((r) => r.phase === 'cloud call' && r.body);
  const leaked = hiddenValues.filter((v) => cloudCalls.some((r) => r.body.includes(v)));
  const gotAnswer = Boolean(answer) && !/will appear here/.test(answer);

  const checks = [
    ['Firebase AI Logic is configured', firebase, firebase ? '' : 'no VITE_FIREBASE_CONFIG'],
    ['On-device model ran the scrub', modelRan, warm],
    ['Scrub works with the page offline', offlineOk, offline],
    ['No request left the machine during the offline scrub', duringScrub.length === 0, duringScrub.map((r) => host(r.url)).join(', ')],
    ['Hidden values found to check', hiddenValues.length > 0, `${hiddenValues.length} values`],
    ['A cloud request was made', cloudCalls.length > 0, cloudCalls.map((r) => host(r.url)).join(', ') || sendNote],
    ['No hidden value appears in any cloud request body', cloudCalls.length > 0 && leaked.length === 0, leaked.join(' · ')],
    ['An answer came back', gotAnswer, sendNote],
    ['Real values were restored locally', restored.length > 0, restored.join(' · ')],
  ];

  console.log('');
  for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  console.log(`\nHosts contacted: ${[...new Set(requests.map((r) => `${host(r.url)} [${r.phase}]`))].join(', ') || 'none'}`);

  const dir = path.join(ROOT, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(dir, `e2e-${stamp}.png`), fullPage: true });
  writeFileSync(
    path.join(dir, `e2e-${stamp}.json`),
    JSON.stringify(
      {
        chromeVersion: chrome.version,
        checks: checks.map(([name, ok, detail]) => ({ name, ok, detail })),
        hiddenValues,
        outgoing,
        answer,
        // Query strings are dropped and App Check bodies omitted, because the
        // debug token travels there. Model request bodies hold placeholders
        // and prompt text, never the vault.
        requests: requests.map((r) => ({
          phase: r.phase,
          method: r.method,
          url: r.url.split('?')[0],
          body: /appcheck/i.test(r.url) ? '[omitted]' : r.body.slice(0, 4000),
        })),
        consoleErrors,
      },
      null,
      2,
    ),
  );
  console.log(`Saved eval-results/e2e-${stamp}.json and .png`);
  code = checks.every(([, ok]) => ok) ? 0 : 1;
} catch (err) {
  console.error(`\nHarness error: ${err?.stack ?? err}`);
} finally {
  await chrome?.close();
  await server?.close();
}
process.exit(code);
