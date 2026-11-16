// node scripts/run-paint.mjs
//
// How long from pasting a 20-page document until the safe text is painted?
// Uses the fictional 20-page development document. Three pastes, each in a
// fresh page. PAINT_INPUT and PAINT_OUTPUT are the selectors of the text box
// and of the pane that shows what will be sent.

import process from 'node:process';
import { startChrome, startDevServer } from './chrome.mjs';

const INPUT = process.env.PAINT_INPUT ?? '[data-testid="source-input"]';
const OUTPUT = process.env.PAINT_OUTPUT ?? '[data-testid="outgoing-text"]';
const server = await startDevServer();
const chrome = await startChrome();
const times = [];
try {
  for (let i = 0; i < 3; i++) {
    const page = await chrome.browser.newPage();
    await page.goto(server.url, { waitUntil: 'networkidle0' });
    // Let the word lists load, as they would after the first touch.
    await page.mouse.click(5, 5);
    await new Promise((r) => setTimeout(r, 4000));
    const ms = await page.evaluate(
      async (inputSel, outputSel) => {
        const { LONG_DEV } = await import('/src/eval/long.ts');
        const text = LONG_DEV[2].text;
        const input = document.querySelector(inputSel);
        const output = document.querySelector(outputSel);
        const started = performance.now();
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('paste', { bubbles: true }));
        // Wait until the outgoing pane holds a placeholder, then for the next two frames.
        while (!/\[[A-Z_]+_\d+\]/.test(output.textContent ?? '')) await new Promise((r) => setTimeout(r, 5));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { ms: Math.round(performance.now() - started), chars: text.length };
      },
      INPUT,
      OUTPUT,
    );
    times.push(ms.ms);
    console.log(`paste to painted: ${ms.ms} ms (${ms.chars} characters)`);
    await page.close();
  }
  times.sort((a, b) => a - b);
  console.log(`median ${times[1]} ms, range ${times[0]}-${times[2]}`);
} finally {
  await chrome.close();
  await server.close();
}
process.exit(0);
