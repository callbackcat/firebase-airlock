import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { splitByPlaceholders, type EntitySource, type Redaction } from '../airlock';
import { findSuspects } from '../suspects';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/glaze/ui/tooltip';

/**
 * What the cloud receives, word by word. Four states, each told apart by
 * shape as well as colour:
 *   hidden      a placeholder in brackets, in a box
 *   restored    readable, dotted underline: the on-device model put it back
 *   suspicious  readable, wavy underline: it could still be personal
 *   plain       readable, no mark
 * Clicking a readable word hides it everywhere. Clicking a placeholder shows
 * that value again. The marked items form one keyboard stop: arrow keys move
 * between them, Enter or Space acts.
 */

const WHY: Record<EntitySource, string> = {
  regex: 'Hidden: it matches a pattern for personal details.',
  list: 'Hidden: it is a known name or stands where a name stands.',
  mark: 'Hidden: it could be personal and was not cleared as safe.',
  model: 'Hidden: the on-device model listed it as personal.',
  manual: 'Hidden: you hid it.',
};

/** Above this many marked items a tooltip each would slow the page, so the browser's own hint is used. */
const TOOLTIP_LIMIT = 400;
/** A long document is drawn in steps, so the first screen appears at once. */
const FIRST_STEP = 400;
const NEXT_STEP = 2000;

interface Item {
  kind: 'text' | 'hidden' | 'restored' | 'suspect';
  text: string;
  value?: string;
  why?: string;
}

export function buildItems(r: Redaction, restored: Set<string>): Item[] {
  const bySource = new Map(r.entities.map((e) => [e.placeholder, e.source]));
  const suspects = findSuspects(r.redacted);
  const items: Item[] = [];
  let offset = 0;
  for (const segment of splitByPlaceholders(r.redacted)) {
    const from = offset;
    offset += segment.text.length;
    if (segment.placeholder && r.vault[segment.placeholder] !== undefined) {
      const source = bySource.get(segment.placeholder) ?? 'mark';
      items.push({ kind: 'hidden', text: segment.placeholder, value: r.vault[segment.placeholder], why: WHY[source] });
      continue;
    }
    let cursor = from;
    for (const mark of suspects) {
      if (mark.start < cursor || mark.end > offset) continue;
      if (mark.start > cursor) items.push({ kind: 'text', text: r.redacted.slice(cursor, mark.start) });
      const back = restored.has(mark.text.toLowerCase());
      items.push({
        kind: back ? 'restored' : 'suspect',
        text: mark.text,
        value: mark.text,
        why: back ? 'Readable: the on-device model judged it safe to show.' : 'Readable: it could be personal. Check it.',
      });
      cursor = mark.end;
    }
    if (cursor < offset) items.push({ kind: 'text', text: r.redacted.slice(cursor, offset) });
  }
  return items;
}

const CLASS = {
  hidden: 'mono rounded-tag border border-line-control bg-field px-1 text-text-1',
  restored: 'underline decoration-dotted decoration-2 underline-offset-4 decoration-ok-text text-text-1',
  suspect: 'underline decoration-wavy underline-offset-4 decoration-warn-text text-text-1',
} as const;

export function OutgoingText({
  redaction,
  restored,
  onHide,
  onShow,
}: {
  redaction: Redaction;
  restored: Set<string>;
  onHide: (value: string) => void;
  onShow: (value: string) => void;
}) {
  const items = useMemo(() => buildItems(redaction, restored), [redaction, restored]);
  const marked = items.filter((i) => i.kind !== 'text').length;
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(FIRST_STEP);
  useEffect(() => {
    if (shown >= items.length) return;
    const id = requestAnimationFrame(() => setShown((n) => n + NEXT_STEP));
    return () => cancelAnimationFrame(id);
  }, [shown, items.length]);

  // One tab stop for all marked items; arrows move between them.
  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(ev.key)) return;
    const stops = [...(box.current?.querySelectorAll<HTMLElement>('[data-word]') ?? [])];
    if (!stops.length) return;
    const at = stops.indexOf(document.activeElement as HTMLElement);
    const next =
      ev.key === 'Home' ? 0 : ev.key === 'End' ? stops.length - 1 : ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? Math.min(stops.length - 1, at + 1) : Math.max(0, at - 1);
    ev.preventDefault();
    for (const s of stops) s.tabIndex = -1;
    stops[next].tabIndex = 0;
    stops[next].focus();
  };

  // A click on plain text hides the word under the pointer.
  const onClick = (ev: MouseEvent<HTMLDivElement>) => {
    if ((ev.target as HTMLElement).closest('[data-word]')) return;
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
    if (word.length >= 2) onHide(word);
  };

  let first = true;
  const nodes: ReactNode[] = items.slice(0, shown).map((item, i) => {
    if (item.kind === 'text') return <span key={i}>{item.text}</span>;
    const act = () => (item.kind === 'hidden' ? onShow(item.value!) : onHide(item.value!));
    const action = item.kind === 'hidden' ? 'Press to show it again.' : 'Press to hide it everywhere.';
    const button = (
      <span
        role="button"
        data-word={item.kind}
        data-testid={`word-${item.kind}`}
        tabIndex={first ? 0 : -1}
        aria-label={item.kind === 'hidden' ? `${item.text}, hidden. ${action}` : `${item.text}. ${item.why} ${action}`}
        title={marked > TOOLTIP_LIMIT ? `${item.why} ${action}` : undefined}
        onClick={act}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            act();
          }
        }}
        className={`cursor-pointer ${CLASS[item.kind]}`}
      >
        {item.text}
      </span>
    );
    first = false;
    if (marked > TOOLTIP_LIMIT) return <span key={i}>{button}</span>;
    return (
      <Tooltip key={i}>
        <TooltipTrigger render={button} />
        <TooltipContent>{`${item.why} ${action}`}</TooltipContent>
      </Tooltip>
    );
  });

  return (
    <div
      ref={box}
      role="group"
      aria-label="What the cloud receives. Arrow keys move between marked words."
      data-testid="outgoing-text"
      aria-busy={shown < items.length}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className="type-body cursor-text whitespace-pre-wrap break-words text-text-1"
    >
      {nodes}
    </div>
  );
}

/** The four states, shown the way they look in the text. */
export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-text-2" aria-label="What the marks mean" data-testid="legend">
      <li>
        <span className={CLASS.hidden}>[PERSON_1]</span> hidden
      </li>
      <li>
        <span className={CLASS.restored}>word</span> put back by the model
      </li>
      <li>
        <span className={CLASS.suspect}>word</span> readable, check it
      </li>
      <li>
        <span className="text-text-1">word</span> readable
      </li>
    </ul>
  );
}
