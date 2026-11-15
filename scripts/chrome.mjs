// Shared helpers for the test scripts: start the dev server and a real Chrome.
//
// Chrome is started as a plain process and attached to over the DevTools
// protocol. It is NOT launched through Puppeteer, because automation launchers
// add --disable-features flags that can switch off the on-device model.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
    '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome-beta', '/usr/bin/google-chrome-unstable'],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = (CANDIDATES[process.platform] ?? []).find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to the Chrome binary.');
  return found;
}

export async function startDevServer() {
  const server = await createServer({
    root: ROOT,
    configFile: process.env.AIRLOCK_VITE_CONFIG || undefined,
    logLevel: 'warn',
    server: { port: Number(process.env.PORT ?? 5173), strictPort: false },
  });
  await server.listen();
  const url = server.resolvedUrls?.local?.[0];
  if (!url) throw new Error('Dev server did not report a local URL.');
  return { url, close: () => server.close() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Environment:
 *   CHROME_PATH        Chrome binary (default: first installed channel found)
 *   CHROME_PROFILE     profile directory (default: .chrome-profile in the repo)
 *   CHROME_FEATURES    value for --enable-features, if you need one
 *   CHROME_EXTRA_ARGS  extra flags, space separated
 *   CHROME_DEBUG_PORT  DevTools port (default 9333)
 */
export async function startChrome() {
  const profile = path.resolve(process.env.CHROME_PROFILE ?? path.join(ROOT, '.chrome-profile'));
  mkdirSync(profile, { recursive: true });
  const port = Number(process.env.CHROME_DEBUG_PORT ?? 9333);
  const args = [
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    ...(process.env.CHROME_FEATURES ? [`--enable-features=${process.env.CHROME_FEATURES}`] : []),
    ...(process.env.CHROME_EXTRA_ARGS ? process.env.CHROME_EXTRA_ARGS.split(/\s+/).filter(Boolean) : []),
    'about:blank',
  ];
  const binary = chromePath();
  const child = spawn(binary, args, { stdio: 'ignore' });
  child.on('error', (err) => console.error('Chrome failed to start:', err.message));

  const endpoint = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try {
      ready = (await fetch(`${endpoint}/json/version`)).ok;
    } catch {
      await sleep(500);
    }
  }
  if (!ready) {
    child.kill();
    throw new Error(`Chrome did not open its DevTools port ${port}. Is another Chrome using this profile?`);
  }

  const browser = await puppeteer.connect({ browserURL: endpoint, defaultViewport: null });
  return {
    browser,
    binary,
    profile,
    version: await browser.version(),
    async close() {
      if (process.env.KEEP_OPEN) return void browser.disconnect();
      await browser.close().catch(() => {});
      child.kill();
    },
  };
}

/** What the browser itself says about the on-device model. Diagnostic only. */
export async function promptApiState(page) {
  return page.evaluate(async () => {
    if (!('LanguageModel' in self)) return 'LanguageModel is not defined (Prompt API off or unsupported)';
    try {
      return `LanguageModel.availability() = ${await self.LanguageModel.availability()}`;
    } catch (err) {
      return `LanguageModel.availability() threw: ${err}`;
    }
  });
}
