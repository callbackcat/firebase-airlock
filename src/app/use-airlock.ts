import { useCallback, useEffect, useRef, useState } from 'react';
import {
  findLeaks,
  isLowerCaseText,
  isUpperCaseText,
  normalise,
  redact,
  restore,
  type Entity,
  type Redaction,
  type Restored,
} from '../airlock';
import { initFirebase } from '../firebase';
import { applyUnhide, hideFirst } from '../hidefirst';
import { createModels, TASKS, type Models, type Task } from '../models';
import { loadWordLists } from '../wordlists';

/**
 * The app's state and the order things happen in. The scrub itself lives in
 * the core modules and is not changed here: this hook only calls it and
 * keeps what the screen needs to show.
 */

export type OnDevice = 'unknown' | 'downloading' | 'ready' | 'unavailable';
export type Phase = 'empty' | 'restoring' | 'done' | 'no-model';

export interface Answer {
  /** What the cloud model wrote, placeholders included. */
  raw: string;
  /** The same with real values put back on this device. */
  restored: Restored;
  /** Where the SDK says the answer was produced. */
  source: string;
  ms: number;
  asked: string;
}

export interface AirlockState {
  text: string;
  /** The text the current scrub was made from. */
  source: string;
  entities: Entity[];
  /** Values the person chose to show again, normalised. */
  excluded: Set<string>;
  /** Values the on-device model put back, in lower case. */
  restored: Set<string>;
  redaction: Redaction | null;
  phase: Phase;
  safeMs: number;
  doneMs: number;
  onDevice: OnDevice;
  /** Download progress, 0 to 1, while the model is being fetched. */
  download: number | null;
  /** Where the SDK says the last on-device call ran. */
  onDeviceSource: string | undefined;
  /** The warm-up call showed this machine will take a while. */
  slow: boolean;
  lower: boolean;
  upper: boolean;
  answer: Answer | null;
  sending: boolean;
  cloudError: string | null;
  hasCloud: boolean;
  /** Counts scrubs, so a test can tell one from the next. */
  run: number;
}

/** In development only, ?demo=NAME forces a state so it can be looked at and photographed. */
const DEMO = import.meta.env.DEV ? new URLSearchParams(location.search).get('demo') : null;
/** One-page scrub time as a multiple of the warm-up call, and the wait that counts as slow. */
const SCRUB_PER_CALL = 1.7;
const SLOW_MS = 8000;

const initial: AirlockState = {
  text: '',
  source: '',
  entities: [],
  excluded: new Set(),
  restored: new Set(),
  redaction: null,
  phase: 'empty',
  safeMs: 0,
  doneMs: 0,
  onDevice: DEMO === 'downloading' ? 'downloading' : DEMO === 'unavailable' ? 'unavailable' : 'unknown',
  download: DEMO === 'downloading' ? 0.42 : null,
  onDeviceSource: undefined,
  slow: DEMO === 'slow',
  lower: false,
  upper: false,
  answer: null,
  sending: false,
  cloudError: null,
  hasCloud: false,
  run: 0,
};

const active = (entities: Entity[], excluded: Set<string>) => entities.filter((e) => !excluded.has(normalise(e.value)));

/** The person's own question, with any value that is hidden in the document swapped for its placeholder. */
function scrubQuestion(question: string, vault: Record<string, string>): string {
  let out = question;
  const pairs = Object.entries(vault).sort((a, b) => b[1].length - a[1].length);
  for (const [placeholder, value] of pairs) {
    if (value.trim().length < 2) continue;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    out = out.replace(new RegExp(escaped, 'gi'), placeholder);
  }
  return out;
}

export function useAirlock() {
  const [state, setState] = useState<AirlockState>(initial);
  const models = useRef<Models | null>(null);
  const run = useRef(0);
  const preparing = useRef<Promise<OnDevice> | null>(null);
  const live = useRef(state);
  live.current = state;

  const patch = useCallback((p: Partial<AirlockState>) => setState((s) => ({ ...s, ...p })), []);

  useEffect(() => {
    try {
      const ai = initFirebase();
      if (ai) {
        models.current = createModels(ai);
        patch({ hasCloud: true });
      }
    } catch (err) {
      console.error('Firebase init failed', err);
    }
  }, [patch]);

  /** Checks the on-device model once. Later callers share the wait. */
  const ensureOnDevice = useCallback((): Promise<OnDevice> => {
    if (DEMO === 'unavailable') return Promise.resolve('unavailable');
    preparing.current ??= (async () => {
      const m = models.current;
      if (!m) {
        patch({ onDevice: 'unavailable' });
        return 'unavailable' as const;
      }
      try {
        await m.prepareOnDevice((fraction) => patch({ onDevice: 'downloading', download: fraction }));
        patch({ onDevice: 'ready', download: null });
        return 'ready' as const;
      } catch (err) {
        console.warn('On-device model unavailable', err);
        patch({ onDevice: 'unavailable', download: null });
        return 'unavailable' as const;
      }
    })();
    return preparing.current;
  }, [patch]);

  /** Loads the word lists and the model as soon as the person touches the page. */
  const warm = useRef(false);
  const warmUp = useCallback(() => {
    if (warm.current) return;
    warm.current = true;
    void loadWordLists().catch(() => undefined);
    void (async () => {
      if ((await ensureOnDevice()) !== 'ready' || !models.current) return;
      const callMs = await models.current.warmUp();
      if (callMs * SCRUB_PER_CALL > SLOW_MS) patch({ slow: true });
    })();
  }, [ensureOnDevice, patch]);

  const scrub = useCallback(
    async (text: string) => {
      const id = ++run.current;
      if (!text.trim()) {
        patch({ text, source: '', entities: [], redaction: null, phase: 'empty', answer: null, cloudError: null, restored: new Set(), excluded: new Set() });
        return;
      }
      // 1. Hide first, in code. From here the text is safe to send.
      const started = performance.now();
      await loadWordLists().catch(() => undefined);
      const first = hideFirst(text, true);
      const safeMs = Math.round(performance.now() - started);
      patch({
        run: id,
        text,
        source: text,
        entities: first.entities,
        excluded: new Set(),
        restored: new Set(),
        redaction: redact(text, first.entities),
        phase: 'restoring',
        safeMs,
        doneMs: 0,
        lower: isLowerCaseText(text),
        upper: isUpperCaseText(text),
        answer: null,
        cloudError: null,
      });

      // 2. The on-device model says which hidden items are safe to show again.
      if (DEMO === 'slow') return;
      const m = models.current;
      if ((await ensureOnDevice()) !== 'ready' || !m) {
        if (run.current === id) patch({ phase: 'no-model' });
        return;
      }
      const merge = (result: Parameters<typeof applyUnhide>[2]) => {
        if (run.current !== id) return;
        const manual = live.current.entities.filter((e) => e.source === 'manual');
        const entities = [...applyUnhide(text, first, result), ...manual];
        patch({
          entities,
          restored: new Set(result.restore.map((v) => v.toLowerCase())),
          redaction: redact(text, active(entities, live.current.excluded)),
        });
      };
      try {
        merge(await m.unhide(text, first.marks, merge));
        if (run.current === id) patch({ phase: 'done', doneMs: Math.round(performance.now() - started), onDeviceSource: m.onDeviceSource() });
      } catch (err) {
        console.warn('Un-hide failed, everything marked stays hidden', err);
        if (run.current === id) patch({ phase: 'no-model' });
      }
    },
    [ensureOnDevice, patch],
  );

  /** Hides a word or phrase everywhere in the document. */
  const hide = useCallback(
    (value: string) => {
      const s = live.current;
      const word = value.trim();
      if (word.length < 2 || !s.source) return;
      const excluded = new Set(s.excluded);
      excluded.delete(normalise(word));
      const entities = [...s.entities, { kind: 'OTHER', value: word, source: 'manual' } as Entity];
      patch({ entities, excluded, redaction: redact(s.source, active(entities, excluded)) });
    },
    [patch],
  );

  /** Shows a hidden value again. Only the person can do this for a pattern or name-list hit. */
  const show = useCallback(
    (value: string) => {
      const s = live.current;
      if (!s.source) return;
      const excluded = new Set(s.excluded);
      excluded.add(normalise(value));
      patch({ excluded, redaction: redact(s.source, active(s.entities, excluded)) });
    },
    [patch],
  );

  const send = useCallback(
    async (ask: { task: Task } | { question: string }) => {
      const s = live.current;
      const m = models.current;
      const r = s.redaction;
      if (!r || !m || s.sending) return;
      if (findLeaks(r.redacted, r.vault).length) {
        patch({ cloudError: 'Stopped: a hidden value is still readable in the text. Nothing was sent.' });
        return;
      }
      patch({ sending: true, cloudError: null });
      const started = performance.now();
      try {
        if (DEMO === 'cloud-error') throw new Error('The cloud model did not answer (forced for this demo).');
        const asked = 'task' in ask ? TASKS[ask.task] : scrubQuestion(ask.question, r.vault);
        const result = 'task' in ask ? await m.ask(ask.task, r.redacted) : await m.askCustom(asked, r.redacted);
        patch({
          sending: false,
          answer: { raw: result.text, restored: restore(result.text, r.vault), source: result.source, ms: Math.round(performance.now() - started), asked },
        });
      } catch (err) {
        patch({ sending: false, cloudError: err instanceof Error ? err.message : String(err) });
      }
    },
    [patch],
  );

  return { state, scrub, hide, show, send, warmUp, setText: (text: string) => patch({ text }) };
}
