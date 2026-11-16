import {
  findLeaks,
  isLowerCaseText,
  normalise,
  redact,
  restore,
  splitByPlaceholders,
  type Entity,
  type Redaction,
} from './airlock';
import { applyUnhide, hideFirst } from './hidefirst';
import { loadWordLists } from './wordlists';
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
  /** True while the on-device model is still deciding what can be shown again. */
  pending: false,
  /** Values the model judged safe and put back, in lower case. Shown differently from text that was never marked. */
  restored: new Set<string>(),
  /**
   * True when the warm-up call showed that a scrub will take long on this
   * machine. The person may then send after checking the text themselves,
   * without waiting for the model.
   */
  slow: false,
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

let preparing: Promise<void> | null = null;

/** Checks the on-device model once. Callers that arrive meanwhile share the wait. */
function ensureOnDevice(): Promise<void> {
  if (state.onDevice !== 'unknown') return Promise.resolve();
  preparing ??= (async () => {
    if (!state.models) {
      state.onDevice = 'unavailable';
      renderStatus();
      return;
    }
    const before = scrubNote.textContent;
    try {
      if (!before) scrubNote.textContent = 'Preparing the on-device model…';
      await state.models.prepareOnDevice((f) => {
        scrubNote.textContent = `Downloading the on-device model: ${Math.round(f * 100)}%`;
      });
      state.onDevice = 'ready';
    } catch (err) {
      console.warn('On-device model unavailable', err);
      state.onDevice = 'unavailable';
    }
    if (/^(Preparing|Downloading) the on-device model/.test(scrubNote.textContent ?? '')) {
      scrubNote.textContent = before;
    }
    renderStatus();
  })();
  return preparing;
}

// One scrub at a time. A paste that lands while one is running asks for
// another run once it has finished.
let scrubbing = false;
let scrubAgain = false;

async function scrub(): Promise<void> {
  const text = input.value;
  if (!text.trim()) {
    scrubNote.textContent = 'Paste a document first.';
    return;
  }
  if (scrubbing) {
    scrubAgain = true;
    return;
  }
  scrubbing = true;
  scrubBtn.disabled = true;
  try {
    // 1. Hide first. Everything the patterns find and everything that could
    //    be personal is hidden at once, with no model. From here the text is
    //    safe to send.
    const started = performance.now();
    await loadWordLists().catch(() => undefined);
    const first = hideFirst(text, true);
    state.patternMs = Math.round(performance.now() - started);
    state.source = text;
    state.all = first.entities;
    state.excluded.clear();
    state.restored.clear();
    state.modelUsed = false;
    state.acknowledged = false;
    state.pending = true;
    scrubNote.textContent = `Hidden in ${state.patternMs} ms. Safe to send. The on-device model is now restoring useful details…`;
    recompute();

    // 2. The on-device model decides which hidden items are safe to show
    //    again: an organisation, a town, a medicine. If it fails or runs out
    //    of time, nothing is restored.
    await ensureOnDevice();
    if (state.onDevice === 'ready' && state.models) {
      const merge = (result: Parameters<typeof applyUnhide>[2]) => {
        if (input.value !== text) return;
        const manual = state.all.filter((e) => e.source === 'manual');
        state.all = [...applyUnhide(text, first, result), ...manual];
        state.restored = new Set(result.restore.map((v) => v.toLowerCase()));
        recompute();
      };
      try {
        merge(await state.models.unhide(text, first.marks, merge));
        state.modelUsed = true;
      } catch (err) {
        console.warn('Un-hide failed, everything marked stays hidden', err);
      }
    }
    state.scrubMs = Math.round(performance.now() - started);
    state.pending = false;
    scrubNote.textContent = state.modelUsed
      ? `Safe to send after ${state.patternMs} ms. The on-device model finished after ${state.scrubMs} ms and restored ${state.restored.size} useful ${state.restored.size === 1 ? 'detail' : 'details'}.`
      : `Safe to send after ${state.patternMs} ms. The on-device model did not run, so everything that could be personal stays hidden.`;
    recompute();
  } finally {
    state.pending = false;
    scrubbing = false;
    scrubBtn.disabled = false;
    updateSend();
    if (scrubAgain) {
      scrubAgain = false;
      if (input.value !== state.source) void scrub();
    }
  }
}

// The first on-device call after the page opens is slow, because Chrome has
// to load the model into memory. Do that as soon as the person touches the
// page, so the wait is over before they click Scrub.
let warmed = false;
function warmUp(): void {
  if (warmed) return;
  warmed = true;
  void loadWordLists().catch(() => undefined);
  void (async () => {
    await ensureOnDevice();
    if (state.onDevice === 'ready') await state.models?.warmUp();
  })();
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
      // Text the model put back looks different from text that was never hidden.
      const back = state.restored.has(mark.text.toLowerCase());
      const span = el('span', {
        className: back ? 'suspect back' : 'suspect',
        textContent: mark.text,
        title: back ? 'The on-device model judged this safe to show. Click to hide it again.' : 'Still readable. Click to hide it.',
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

  $('suspect-note').textContent = state.pending
    ? 'Everything that could be personal is hidden. The on-device model is putting back what is safe.'
    : suspects.length
      ? `${suspects.length} underlined ${suspects.length === 1 ? 'item was' : 'items were'} put back or left readable. Click any word to hide it everywhere.`
      : 'Click any word to hide it everywhere.';
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
  // Names are found mostly by their capital letter. Text typed without capitals needs a human look.
  const lower = state.redaction && isLowerCaseText(state.source)
    ? [
        el('p', {
          className: 'note warn',
          textContent:
            'This text has almost no capital letters. Names are much harder to spot in it, so some may still be readable. Read the preview and click any name you see.',
        }),
      ]
    : [];
  if (state.modelUsed || state.pending || !state.redaction) {
    host.replaceChildren(...lower);
    return;
  }
  host.replaceChildren(
    ...lower,
    el('p', {
      className: 'note warn',
      textContent:
        'The on-device model did not run. Everything that could be personal is still hidden, including organisation names and other useful details, so the answer may be less specific. Untick anything below that you want the cloud model to see.',
    }),
  );
}

function updateSend(): void {
  const r = state.redaction;
  // The text is safe as soon as it is hidden, so sending does not wait for the model.
  const reason = r && !state.models ? 'Add a Firebase config to enable the cloud step (see README).' : '';
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
  // A cloud model sometimes alters a placeholder on the way back, or makes one
  // up. Altered ones are matched and restored. A made-up one is shown as it
  // is and flagged; nothing is guessed.
  const back = restore(cloudText, r.vault);
  answer.replaceChildren(
    ...back.parts.map((part) => {
      if (part.kind === 'text') return document.createTextNode(part.text);
      return part.kind === 'restored'
        ? el('span', { className: 'restored', textContent: part.text, title: `Cloud wrote ${part.placeholder}` })
        : el('span', { className: 'unknown', textContent: part.text, title: 'The cloud model made this placeholder up. It stands for nothing in your document.' });
    }),
  );
  if (back.invented.length) {
    answer.append(
      el('p', {
        className: 'note warn',
        textContent: `The answer contains ${back.invented.length} placeholder${back.invented.length === 1 ? '' : 's'} that ${back.invented.length === 1 ? 'was' : 'were'} never in your document. ${back.invented.length === 1 ? 'It is' : 'They are'} shown as written.`,
      }),
    );
  }
}

function renderReceipt(r: Redaction, cloudSource: string, cloudMs: number): void {
  const occurrences = r.entities.reduce((n, e) => n + e.count, 0);
  const rows: Array<[string, string]> = [
    ['Scrub', `safe after ${state.patternMs} ms · ${state.modelUsed ? `on-device model done after ${state.scrubMs} ms` : 'no model'}`],
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

// Clicking any word in the preview hides it everywhere in the document.
$('preview').addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement;
  if (target.closest('.chip, .suspect') || !state.redaction) return;
  const caret = document.caretPositionFromPoint?.(ev.clientX, ev.clientY);
  const node = caret?.offsetNode;
  if (!caret || !node || node.nodeType !== Node.TEXT_NODE) return;
  const text = node.textContent ?? '';
  const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}'’_-]/u.test(ch);
  let from = caret.offset;
  let to = caret.offset;
  while (from > 0 && isWord(text[from - 1])) from--;
  while (to < text.length && isWord(text[to])) to++;
  const word = text.slice(from, to).replace(/^['’-]+|['’-]+$/g, '');
  if (word.length >= 2) hideValue(word);
});

scrubBtn.onclick = () => void scrub();
sendBtn.onclick = () => void send();
$('add').onclick = addManual;
$<HTMLInputElement>('manual').onkeydown = (e) => {
  if (e.key === 'Enter') addManual();
};
// A pasted document is scrubbed straight away: the model works while the
// person is still looking at what they pasted.
input.addEventListener('paste', () => setTimeout(() => void scrub(), 0));
for (const type of ['pointerdown', 'keydown', 'paste'] as const) {
  document.addEventListener(type, warmUp, { once: true, capture: true });
}

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
