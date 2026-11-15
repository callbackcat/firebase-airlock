// node scripts/run-paste.mjs
//
// Measures what the person waits for: from pasting a letter to the scrub being
// done. Each run starts a fresh Chrome, so the model is cold.
//   instant  paste the moment the page has loaded
//   touched  touch the page, wait 20 s (the warm-up runs), then paste
// PASTE_RUNS sets the number of runs of each (default 3).

import process from 'node:process';
import { startChrome, startDevServer } from './chrome.mjs';

const RUNS = Number(process.env.PASTE_RUNS ?? 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { instant: [], touched: [] };

const server = await startDevServer();
try {
  for (let i = 0; i < RUNS; i++) {
    for (const mode of ['instant', 'touched']) {
      const chrome = await startChrome();
      try {
        const page = await chrome.browser.newPage();
        await page.goto(server.url, { waitUntil: 'networkidle0' });
        if (mode === 'touched') {
          await page.mouse.click(5, 5);
          await sleep(20_000);
        }
        const ms = await page.evaluate(async () => {
          const { SAMPLE_LETTER } = await import('/src/sample.ts');
          const input = document.getElementById('input');
          const note = document.getElementById('scrub-note');
          const started = performance.now();
          input.value = SAMPLE_LETTER;
          input.dispatchEvent(new Event('paste', { bubbles: true }));
          while (!/^Scrubbed/.test(note.textContent)) await new Promise((r) => setTimeout(r, 50));
          return { ms: Math.round(performance.now() - started), note: note.textContent };
        });
        results[mode].push(ms.ms);
        console.log(`${mode.padEnd(8)} ${ms.ms} ms   ${ms.note}`);
      } finally {
        await chrome.close();
        await sleep(1500);
      }
    }
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  for (const [mode, xs] of Object.entries(results)) {
    console.log(`${mode}: median ${median(xs)} ms, range ${Math.min(...xs)}-${Math.max(...xs)}`);
  }
} finally {
  await server.close();
}
process.exit(0);
