// node scripts/run-screenshots.mjs
//
// Saves a screenshot of every state of the app, light and dark, to
// docs/screenshots/. Uses the fictional sample letter and the development
// server's ?demo= switch to force states that are hard to reach by hand.
// SHOT_SIZE=1920x1080 changes the window (default 1440x900).

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, startChrome, startDevServer } from './chrome.mjs';

const [W, H] = (process.env.SHOT_SIZE ?? '1440x900').split('x').map(Number);
const out = path.join(ROOT, 'docs', 'screenshots');
mkdirSync(out, { recursive: true });
const tid = (id) => `[data-testid="${id}"]`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = await startDevServer();
const chrome = await startChrome();
try {
  const page = await chrome.browser.newPage();
  await page.setViewport({ width: W, height: H });

  const open = async (query, theme) => {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.goto(`${server.url}${query}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(tid('app'));
  };
  const shot = async (name, theme) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await page.screenshot({ path: path.join(out, `${name}-${theme}-${W}.png`), fullPage: true });
    console.log(`saved ${name}-${theme}-${W}.png`);
  };
  const setText = async (text) => {
    await page.evaluate(
      (sel, value) => {
        const el = document.querySelector(sel);
        const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      tid('source-input'),
      text,
    );
    await page.click(tid('hide-now'));
  };
  const settled = () => page.waitForFunction((sel) => ['done', 'no-model'].includes(document.querySelector(sel).dataset.phase), { timeout: 180_000 }, tid('app'));
  const sample = async () => (await import('vite')).default;

  const { SAMPLE } = await page.evaluate(async () => ({ SAMPLE: '' })).then(async () => {
    await open('', 'light');
    return page.evaluate(async () => ({ SAMPLE: (await import('/src/sample.ts')).SAMPLE_LETTER }));
  });
  void sample;

  for (const theme of ['light', 'dark']) {
    await open('', theme);
    await shot('01-empty', theme);

    await page.click(tid('load-sample'));
    await page.waitForFunction((sel) => document.querySelector(sel).dataset.phase === 'restoring', {}, tid('app')).catch(() => undefined);
    await shot('02-safe-model-working', theme);
    await settled();
    await shot('03-model-finished', theme);

    await page.click(tid('vault-open'));
    await page.waitForSelector(tid('vault-sheet'));
    await sleep(500);
    await shot('04-vault', theme);
    await page.keyboard.press('Escape');
    await page.waitForSelector(tid('vault-sheet'), { hidden: true, timeout: 4000 }).catch(async () => {
      await page.click(`${tid('vault-sheet')} button[aria-label="Close"]`);
      await page.waitForSelector(tid('vault-sheet'), { hidden: true, timeout: 4000 });
    });
    await sleep(400);

    await page.click(tid('ask-explain'));
    await page.waitForFunction((a, e) => document.querySelector(a) || document.querySelector(e), { timeout: 120_000 }, tid('answer-card'), tid('cloud-error'));
    await shot('05-answer', theme);
    if (await page.$(tid('answer-view-raw'))) {
      await page.click(tid('answer-view-raw'));
      await sleep(300);
      await shot('06-answer-as-written', theme);
    }

    await open('', theme);
    await setText(SAMPLE.toLowerCase());
    await settled();
    await shot('07-no-capitals', theme);

    await open('', theme);
    await setText(SAMPLE.toUpperCase());
    await settled();
    await shot('08-all-capitals', theme);

    await open('?demo=downloading', theme);
    await page.click(tid('load-sample'));
    await sleep(800);
    await shot('09-model-downloading', theme);

    await open('?demo=unavailable', theme);
    await page.click(tid('load-sample'));
    await page.waitForFunction((sel) => document.querySelector(sel).dataset.phase === 'no-model', {}, tid('app'));
    await shot('10-model-unavailable', theme);

    await open('?demo=slow', theme);
    await page.click(tid('load-sample'));
    await sleep(800);
    await shot('11-slow-machine', theme);

    await open('?demo=cloud-error', theme);
    await page.click(tid('load-sample'));
    await settled();
    await page.click(tid('ask-explain'));
    await page.waitForSelector(tid('cloud-error'));
    await shot('12-cloud-error', theme);
  }
} finally {
  await chrome.close();
  await server.close();
}
process.exit(0);
