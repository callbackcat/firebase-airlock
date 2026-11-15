import {
  detect,
  findLeaks,
  normalise,
  redact,
  splitByPlaceholders,
  type Entity,
  type Redaction,
} from './airlock';
import { initFirebase } from './firebase';
import { findSuspects } from './suspects';
import { createModels, type Models, type Task } from './models';
import { SAMPLE_LETTER } from './sample';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

const input = $<HTMLTextAreaElement>('input');
const scrubBtn = $<HTMLButtonElement>('scrub');
const sendBtn = $<HTMLButtonElement>('send');
const scrubNote = $('scrub-note');
const sendNote = $('send-note');

type OnDevice = 'unknown' | 'ready' | 'unavailable';

const state = {
  models: null as Models | null,
  onDevice: 'unknown' as OnDevice,
  source: '',
  all: [] as Entity[],
  excluded: new Set<string>(),
  modelUsed: false,
  acknowledged: false,
  scrubMs: 0,
  /** How long the fixed patterns took. They are shown before the model is done. */
  patternMs: 0,
  /** True while the on-device model is still reading a letter already on screen. */
  pending: false,
  redaction: null as Redaction | null,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

try {
  const ai = initFirebase();
  if (ai) state.models = createModels(ai);
} catch (err) {
  console.error('Firebase init failed', err);
}
renderStatus();

function renderStatus(): void {
  const firebase = state.models
    ? el('span', { className: 'pill ok', textContent: 'Firebase AI Logic connected' })
    : el('span', { className: 'pill warn', textContent: 'No Firebase config: cloud step off' });
  const label: Record<OnDevice, [string, string]> = {
    unknown: ['pill', 'On-device model: not checked yet'],
    ready: ['pill ok', 'On-device model ready'],
    unavailable: ['pill warn', 'On-device model unavailable: patterns only'],
  };
  const [cls, text] = label[state.onDevice];
  $('status').replaceChildren(firebase, el('span', { className: cls, textContent: text }));
}

// ---------------------------------------------------------------------------
// Step 1: scrub on device
// ---------------------------------------------------------------------------

async function ensureOnDevice(): Promise<void> {
  if (state.onDevice !== 'unknown') return;
  if (!state.models) {
    state.onDevice = 'unavailable';
    renderStatus();
    return;
  }
  try {
    scrubNote.textContent = 'Preparing the on-device model…';
    await state.models.prepareOnDevice((f) => {
      scrubNote.textContent = `Downloading the on-device model: ${Math.round(f * 100)}%`;
    });
    state.onDevice = 'ready';
  } catch (err) {
    console.warn('On-device model unavailable', err);
    state.onDevice = 'unavailable';
  }
  renderStatus();
}

async function scrub(): Promise<void> {
  const text = input.value;
  if (!text.trim()) {
    scrubNote.textContent = 'Paste a document first.';
    return;
  }
  scrubBtn.disabled = true;
  try {
    // 1. Fixed patterns. They take a few milliseconds, so the reader sees
    //    most of the result at once instead of a blank panel.
    const started = performance.now();
    const quick = await detect(text);
    state.patternMs = Math.round(performance.now() - started);
    state.source = text;
    state.all = quick.entities;
    state.excluded.clear();
    state.modelUsed = false;
    state.acknowledged = false;
    state.pending = true;
    scrubNote.textContent = `Patterns applied in ${state.patternMs} ms. The on-device model is still reading…`;
    recompute();

    // 2. The on-device model. Its finds are added when they arrive. Sending is
    //    held back until then.
    await ensureOnDevice();
    const extract = state.onDevice === 'ready' ? state.models?.extract : undefined;
    let modelError: string | undefined;
    if (extract) {
      const result = await detect(text, extract);
      modelError = result.modelError;
      if (result.modelUsed) {
        // Keep anything hidden by hand while the model was running.
        const manual = state.all.filter((e) => e.source === 'manual');
        state.all = [...result.entities, ...manual];
        state.modelUsed = true;
      }
    }
    state.scrubMs = Math.round(performance.now() - started);
    state.pending = false;
    if (modelError) {
      console.warn('On-device extraction failed', modelError);
      state.onDevice = 'unavailable';
      renderStatus();
    }
    scrubNote.textContent = state.modelUsed
      ? `Scrubbed on device in ${state.scrubMs} ms (patterns shown after ${state.patternMs} ms).${state.models?.secondPassSkipped() ? ' This device is slow, so the second check was skipped: look at the underlined text.' : ''}`
      : `Scrubbed with patterns only in ${state.patternMs} ms.`;
    recompute();
  } finally {
    state.pending = false;
    scrubBtn.disabled = false;
    updateSend();
  }
}

function recompute(): void {
  const active = state.all.filter((e) => !state.excluded.has(normalise(e.value)));
  state.redaction = redact(state.source, active);
  renderPreview();
  renderEntities();
  renderAck();
  updateSend();
}

// ---------------------------------------------------------------------------
// Step 2: review what will leave
// ---------------------------------------------------------------------------

function renderPreview(): void {
  const r = state.redaction!;
  const preview = $('preview');
  preview.classList.remove('empty');
  // Mark what may have been missed. Clicking a mark hides that text everywhere.
  const suspects = findSuspects(r.redacted);
  const nodes: Node[] = [];
  let offset = 0;
  for (const s of splitByPlaceholders(r.redacted)) {
    const from = offset;
    offset += s.text.length;
    if (s.placeholder && r.vault[s.placeholder] !== undefined) {
      nodes.push(el('span', { className: 'chip', textContent: s.placeholder, title: r.vault[s.placeholder] }));
      continue;
    }
    let cursor = from;
    for (const mark of suspects) {
      if (mark.start < cursor || mark.end > offset) continue;
      if (mark.start > cursor) nodes.push(document.createTextNode(r.redacted.slice(cursor, mark.start)));
      const span = el('span', {
        className: 'suspect',
        textContent: mark.text,
        title: 'Still readable. Click to hide it.',
        tabIndex: 0,
      });
      span.setAttribute('role', 'button');
      const hide = () => hideValue(mark.text);
      span.onclick = hide;
      span.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          hide();
        }
      };
      nodes.push(span);
      cursor = mark.end;
    }
    if (cursor < offset) nodes.push(document.createTextNode(r.redacted.slice(cursor, offset)));
  }
  preview.replaceChildren(...nodes);

  $('suspect-note').textContent = suspects.length
    ? `${suspects.length} underlined ${suspects.length === 1 ? 'item is' : 'items are'} still readable and could be personal. Click any to hide it.`
    : '';
}

function hideValue(value: string): void {
  if (!value.trim() || !state.redaction) return;
  state.all.push({ kind: 'OTHER', value: value.trim(), source: 'manual' });
  state.excluded.delete(normalise(value));
  recompute();
}

function renderEntities(): void {
  const r = state.redaction!;
  const rows: HTMLTableRowElement[] = [];

  const toggle = (value: string, on: boolean) => {
    const key = normalise(value);
    if (on) state.excluded.delete(key);
    else state.excluded.add(key);
    recompute();
  };

  for (const e of r.entities) {
    const box = el('input', { type: 'checkbox', checked: true });
    box.setAttribute('aria-label', `Hide ${e.value}`);
    box.onchange = () => toggle(e.value, box.checked);
    rows.push(
      el('tr', {}, [
        el('td', {}, [box]),
        el('td', {}, [el('span', { className: 'chip', textContent: e.placeholder })]),
        el('td', { className: 'v', textContent: e.value }),
        el('td', { textContent: `${e.source}${e.count > 1 ? ` ×${e.count}` : ''}` }),
      ]),
    );
  }

  const seen = new Set<string>();
  for (const e of state.all) {
    const key = normalise(e.value);
    if (!state.excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    const box = el('input', { type: 'checkbox', checked: false });
    box.setAttribute('aria-label', `Hide ${e.value}`);
    box.onchange = () => toggle(e.value, box.checked);
    rows.push(
      el('tr', {}, [
        el('td', {}, [box]),
        el('td', { textContent: 'will be sent' }),
        el('td', { className: 'v off', textContent: e.value }),
        el('td', { textContent: e.source }),
      ]),
    );
  }

  const host = $('entities');
  if (!rows.length) {
    host.replaceChildren(el('p', { className: 'note', textContent: 'Nothing was found to hide.' }));
    return;
  }
  host.replaceChildren(
    el('table', {}, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', { textContent: 'Hide' }),
          el('th', { textContent: 'Cloud sees' }),
          el('th', { textContent: 'Real value' }),
          el('th', { textContent: 'Found by' }),
        ]),
      ]),
      el('tbody', {}, rows),
    ]),
  );
}

function renderAck(): void {
  const host = $('ack');
  if (state.modelUsed || state.pending) {
    host.replaceChildren();
    return;
  }
  const box = el('input', { type: 'checkbox', checked: state.acknowledged });
  box.onchange = () => {
    state.acknowledged = box.checked;
    updateSend();
  };
  host.replaceChildren(
    el('p', {
      className: 'note warn',
      textContent:
        'The on-device model did not run, so only fixed patterns (emails, phone numbers, postcodes, bank and ID numbers) were hidden. Names and street addresses were not checked. Hide them by hand below.',
    }),
    el('label', { className: 'ack' }, [box, 'I have checked the text above myself.']),
  );
}

function updateSend(): void {
  const r = state.redaction;
  let reason = '';
  if (!r) reason = '';
  else if (!state.models) reason = 'Add a Firebase config to enable the cloud step (see README).';
  else if (state.pending) reason = 'The on-device model is still reading. You can review what the patterns found.';
  else if (!state.modelUsed && !state.acknowledged) reason = 'Confirm you have checked the text.';
  sendBtn.disabled = !r || reason !== '';
  sendNote.textContent = reason;
}

function addManual(): void {
  const field = $<HTMLInputElement>('manual');
  const value = field.value.trim();
  if (!value || !state.redaction) return;
  state.all.push({ kind: 'OTHER', value, source: 'manual' });
  state.excluded.delete(normalise(value));
  field.value = '';
  recompute();
}

// ---------------------------------------------------------------------------
// Step 3: send the scrubbed text, restore the answer locally
// ---------------------------------------------------------------------------

async function send(): Promise<void> {
  const r = state.redaction;
  if (!r || !state.models) return;

  const leaks = findLeaks(r.redacted, r.vault);
  if (leaks.length) {
    sendNote.textContent = `Blocked: ${leaks.length} hidden value(s) are still readable in the outgoing text.`;
    return;
  }

  sendBtn.disabled = true;
  sendNote.textContent = 'Waiting for the cloud model…';
  const task = $<HTMLSelectElement>('task').value as Task;
  const started = performance.now();
  try {
    const { text, source } = await state.models.ask(task, r.redacted);
    const cloudMs = Math.round(performance.now() - started);
    renderAnswer(text, r);
    renderReceipt(r, source, cloudMs);
    sendNote.textContent = '';
  } catch (err) {
    sendNote.textContent = `Cloud request failed: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    updateSend();
  }
}

function renderAnswer(cloudText: string, r: Redaction): void {
  const answer = $('answer');
  answer.classList.remove('empty');
  answer.replaceChildren(
    ...splitByPlaceholders(cloudText).map((s) => {
      if (!s.placeholder) return document.createTextNode(s.text);
      const real = r.vault[s.placeholder];
      return real !== undefined
        ? el('span', { className: 'restored', textContent: real, title: `Cloud wrote ${s.placeholder}` })
        : el('span', { className: 'unknown', textContent: s.text, title: 'Not a placeholder from this document' });
    }),
  );
}

function renderReceipt(r: Redaction, cloudSource: string, cloudMs: number): void {
  const occurrences = r.entities.reduce((n, e) => n + e.count, 0);
  const rows: Array<[string, string]> = [
    ['Scrub', `${state.modelUsed ? 'on_device' : 'patterns only'} · ${state.scrubMs} ms`],
    ['Withheld', `${r.entities.length} values, ${occurrences} occurrences`],
    ['Sent', `${r.redacted.length} of ${state.source.length} characters`],
    ['Answer', `${cloudSource} · ${cloudMs} ms`],
    ['Restore', 'on this device, no model call'],
  ];
  $('receipt').replaceChildren(
    ...rows.flatMap(([k, v]) => [el('dt', { textContent: k }), el('dd', { textContent: v })]),
  );
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

scrubBtn.onclick = () => void scrub();
sendBtn.onclick = () => void send();
$('add').onclick = addManual;
$<HTMLInputElement>('manual').onkeydown = (e) => {
  if (e.key === 'Enter') addManual();
};
$('sample').onclick = () => {
  input.value = SAMPLE_LETTER;
  void scrub();
};

const photo = $<HTMLInputElement>('photo');
$('photo-btn').onclick = () => photo.click();
photo.onchange = async () => {
  const file = photo.files?.[0];
  photo.value = '';
  if (!file) return;
  await ensureOnDevice();
  if (state.onDevice !== 'ready' || !state.models) {
    scrubNote.textContent = 'Reading a photo needs the on-device model, which is not available in this browser.';
    return;
  }
  try {
    scrubNote.textContent = 'Reading the photo on device…';
    input.value = await state.models.transcribe(file);
    await scrub();
  } catch (err) {
    scrubNote.textContent = `Could not read the photo: ${err instanceof Error ? err.message : String(err)}`;
  }
};
