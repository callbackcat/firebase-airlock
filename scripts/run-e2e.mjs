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
  const tid = (id) => `[data-testid="${id}"]`;
  const firebase = (await page.$eval(tid('app'), (n) => n.dataset.cloud)) === 'on';

  // Scrub once online so the model is initialised (first use may download it).
  const scrub = async () => {
    const before = Number(await page.$eval(tid('app'), (n) => n.dataset.run));
    await page.click(tid('step-1'));
    await page.waitForSelector(tid('load-sample'));
    await page.click(tid('load-sample'));
    await page.waitForFunction(
      (sel, was) => {
        const app = document.querySelector(sel);
        return Number(app.dataset.run) > was && (app.dataset.phase === 'done' || app.dataset.phase === 'no-model');
      },
      { timeout: Number(process.env.EVAL_TIMEOUT_MIN ?? 45) * 60_000 },
      tid('app'),
      before,
    );
    return page.$eval(tid('status-line'), (n) => n.textContent);
  };
  phase = 'warm-up scrub';
  const warm = await scrub();
  const modelRan = warm.includes('on-device model finished');

  // Scrub again with the page offline.
  phase = 'offline scrub';
  await page.setOfflineMode(true);
  const offline = await scrub();
  await page.setOfflineMode(false);
  const offlineOk = offline.includes('on-device model finished');

  // The hidden values are listed in the vault sheet.
  await page.click(tid('vault-open'));
  await page.waitForSelector(tid('vault-value'));
  const hiddenValues = await page.$$eval(tid('vault-value'), (ns) => ns.map((n) => n.textContent));
  await page.keyboard.press('Escape');
  const outgoing = await page.$eval(tid('outgoing-text'), (n) => n.textContent);

  // Send the scrubbed text to the cloud.
  let answer = '';
  let restored = [];
  let sendNote = '';
  phase = 'cloud call';
  await page.click(tid('continue'));
  await page.waitForSelector(tid('ask-explain'));
  const canSend = await page.$eval(tid('ask-explain'), (b) => !b.disabled);
  if (canSend) {
    await page.click(tid('ask-explain'));
    await page.waitForFunction((a, e) => document.querySelector(a) || document.querySelector(e), { timeout: 120_000 }, tid('answer-card'), tid('cloud-error'));
    sendNote = (await page.$(tid('cloud-error'))) ? await page.$eval(tid('cloud-error'), (n) => n.textContent) : '';
    if (!sendNote) {
      answer = await page.$eval(tid('answer-restored'), (n) => n.textContent);
      restored = await page.$$eval(tid('answer-restored-value'), (ns) => ns.map((n) => n.textContent));
    }
  } else {
    sendNote = await page.$eval(tid('ask-note'), (n) => n.textContent);
  }
  phase = 'after';

  const duringScrub = requests.filter((r) => r.phase === 'offline scrub');
  const cloudCalls = requests.filter((r) => r.phase === 'cloud call' && r.body);
  const leaked = hiddenValues.filter((v) => cloudCalls.some((r) => r.body.includes(v)));
  const gotAnswer = Boolean(answer);
  // The only traffic allowed off this machine is to Firebase and the Google APIs it calls.
  const otherHosts = [...new Set(requests.map((r) => host(r.url)))].filter((h) => !/(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com|google\.com|gstatic\.com)$/.test(h));

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
    ['No request to any third-party origin', otherHosts.length === 0, otherHosts.join(', ')],
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
