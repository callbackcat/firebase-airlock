import { useEffect, useState } from 'react';
import { Icon, Key } from '@/components/glaze/icon';
import { Alert, AlertDescription, AlertTitle } from '@/components/glaze/ui/alert';
import { AttachmentDrop } from '@/components/glaze/ui/attachment';
import { Badge } from '@/components/glaze/ui/badge';
import { Button } from '@/components/glaze/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardMeta, CardTitle } from '@/components/glaze/ui/card';
import { DataList, DataListItem, DataListLabel, DataListValue } from '@/components/glaze/ui/data-list';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/glaze/ui/empty-state';
import { Input } from '@/components/glaze/ui/input';
import { Progress, ProgressLabel } from '@/components/glaze/ui/progress';
import { SegmentedControl, SegmentedControlItem } from '@/components/glaze/ui/segmented-control';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/glaze/ui/sheet';
import { Status } from '@/components/glaze/ui/status';
import { Textarea } from '@/components/glaze/ui/textarea';
import { TooltipProvider } from '@/components/glaze/ui/tooltip';
import { GlazePortalProvider } from '@/lib/glaze/portal';
import { SAMPLE_LETTER } from '../sample';
import { Legend, OutgoingText } from './outgoing-text';
import { useAirlock, type AirlockState } from './use-airlock';

/** Reading a photographed letter on the device has not been tested, so it stays off. */
export const PHOTO_ENABLED = import.meta.env.VITE_PHOTO === '1';

const seconds = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

/** One plain sentence, then one small line saying where each part ran. */
function StatusLine({ s }: { s: AirlockState }) {
  if (!s.redaction) return null;
  const kept = s.redaction.entities.length;
  const details = `${kept} ${kept === 1 ? 'detail stays' : 'details stay'} on this device.`;
  return (
    <div className="flex flex-col gap-1" data-testid="status-line" aria-live="polite">
      {s.phase === 'restoring' ? (
        <Status status="running" data-testid="status-now">
          Safe to send now. {details} Useful words are still being put back.
        </Status>
      ) : (
        <Status status="ok" data-testid="status-now">
          Safe to send. {details}
        </Status>
      )}
      <p className="type-caption text-text-2">
        <span data-testid="status-safe">Hidden by rules on this device in {seconds(s.safeMs)}, no model. </span>
        <span data-testid="status-model">
          {s.phase === 'restoring' && s.onDevice === 'downloading' && 'Waiting for the on-device model to download.'}
          {s.phase === 'restoring' && s.onDevice !== 'downloading' && 'The on-device model is working.'}
          {s.phase === 'done' &&
            `The on-device model finished after ${seconds(s.doneMs)} and put back ${s.restored.size} ${s.restored.size === 1 ? 'word' : 'words'}. Ran: ${s.onDeviceSource ?? 'not reported'}.`}
          {s.phase === 'no-model' && 'The on-device model did not run. Nothing was put back.'}
        </span>
      </p>
    </div>
  );
}

function Notices({ s }: { s: AirlockState }) {
  return (
    <div className="flex flex-col gap-2" data-testid="notices">
      {s.onDevice === 'downloading' && (
        <Alert status="neutral" data-testid="notice-downloading">
          <AlertTitle>Chrome is downloading its on-device model</AlertTitle>
          <AlertDescription>This happens once. Your text is already hidden by rules; the model only puts useful words back when it is ready.</AlertDescription>
          <Progress value={Math.round((s.download ?? 0) * 100)} className="mt-2 max-w-measure">
            <ProgressLabel>Downloading the on-device model</ProgressLabel>
          </Progress>
        </Alert>
      )}
      {s.onDevice === 'unavailable' && (
        <Alert status="warn" data-testid="notice-unavailable">
          <AlertTitle>The on-device model is not available in this browser</AlertTitle>
          <AlertDescription>
            Your text is still hidden by rules, and nothing is put back. Organisation names and other useful words stay hidden, so the answer may be less specific. Click a
            placeholder to show a value you are happy to send.
          </AlertDescription>
        </Alert>
      )}
      {s.slow && s.phase === 'restoring' && (
        <Alert status="neutral" data-testid="notice-slow">
          <AlertTitle>This device is slow at running the model</AlertTitle>
          <AlertDescription>The text is already safe to send. You can send now, or wait for useful words to be put back.</AlertDescription>
        </Alert>
      )}
      {s.lower && (
        <Alert status="warn" data-testid="notice-lower">
          <AlertTitle>This text has almost no capital letters</AlertTitle>
          <AlertDescription>Names are much harder to spot in it, so some may still be readable. Read the text below and click any name you see.</AlertDescription>
        </Alert>
      )}
      {s.upper && (
        <Alert status="warn" data-testid="notice-upper">
          <AlertTitle>This text is almost all in capitals</AlertTitle>
          <AlertDescription>
            In capitals every word looks like a name, so far more is hidden than needs to be. The answer may be vague. Click a placeholder to show a value you are happy to send.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function Vault({ s }: { s: AirlockState }) {
  const entries = s.redaction?.entities ?? [];
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="secondary" size="sm" data-testid="vault-open">
            <Icon icon={Key} />
            See the {entries.length} hidden values
          </Button>
        }
      />
      <SheetContent data-testid="vault-sheet">
        <SheetHeader>
          <SheetTitle>Vault</SheetTitle>
          <SheetDescription>
            Each placeholder and the real value behind it. This list lives in this tab's memory only. It is never sent, and it is gone when you reload the page.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {entries.length === 0 ? (
            <Empty variant="plain" size="sm">
              <EmptyHeader>
                <EmptyTitle>Nothing is hidden yet</EmptyTitle>
                <EmptyDescription>Paste some text and the hidden values appear here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DataList variant="panel">
              {entries.map((e) => (
                <DataListItem key={e.placeholder}>
                  <DataListLabel>
                    <span className="mono">{e.placeholder}</span>
                  </DataListLabel>
                  <DataListValue data-testid="vault-value">{e.value}</DataListValue>
                </DataListItem>
              ))}
            </DataList>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function AnswerCard({ s }: { s: AirlockState }) {
  const [view, setView] = useState('restored');
  const a = s.answer;
  if (s.cloudError) {
    return (
      <Alert status="fail" data-testid="cloud-error">
        <AlertTitle>The cloud model did not answer</AlertTitle>
        <AlertDescription>{s.cloudError} Your text has not changed. You can try again.</AlertDescription>
      </Alert>
    );
  }
  if (!a) return null;
  return (
    <Card data-testid="answer-card">
      <CardHeader>
        <CardTitle>Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <SegmentedControl value={view} onValueChange={(v) => setView(String(v))} aria-label="Which version of the answer to show" size="sm">
            <SegmentedControlItem value="restored" data-testid="answer-view-restored">
              With your details put back
            </SegmentedControlItem>
            <SegmentedControlItem value="raw" data-testid="answer-view-raw">
              As the cloud model wrote it
            </SegmentedControlItem>
          </SegmentedControl>
          {view === 'raw' ? (
            <p className="type-body max-w-measure whitespace-pre-wrap text-text-1" data-testid="answer-raw">
              {a.raw}
            </p>
          ) : (
            <p className="type-body max-w-measure whitespace-pre-wrap text-text-1" data-testid="answer-restored">
              {a.restored.parts.map((part, i) =>
                part.kind === 'text' ? (
                  <span key={i}>{part.text}</span>
                ) : part.kind === 'restored' ? (
                  <span key={i} data-testid="answer-restored-value" className="underline decoration-dotted underline-offset-4" title={`The cloud model wrote ${part.placeholder}`}>
                    {part.text}
                  </span>
                ) : (
                  <Badge key={i} variant="warn" title="The cloud model made this placeholder up. It stands for nothing in your text.">
                    {part.text}
                  </Badge>
                ),
              )}
            </p>
          )}
          {a.restored.invented.length > 0 && (
            <Alert status="warn" data-testid="answer-invented">
              <AlertTitle>
                The answer contains {a.restored.invented.length} made-up {a.restored.invented.length === 1 ? 'placeholder' : 'placeholders'}
              </AlertTitle>
              <AlertDescription>The cloud model wrote a placeholder that was never in your text. It is shown as written and nothing was guessed for it.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <CardMeta data-testid="answer-meta">
          Answered by: {a.source}, in {seconds(a.ms)}. Your details were put back on this device, with no model.
        </CardMeta>
      </CardFooter>
    </Card>
  );
}

const STEPS = ['Add your text', 'Check what will be sent', 'Ask'] as const;

export function App() {
  const { state: s, scrub, hide, show, send, warmUp, setText } = useAirlock();
  const [step, setStep] = useState(1);
  const [view, setView] = useState('outgoing');
  const [question, setQuestion] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    const once = () => warmUp();
    for (const type of ['pointerdown', 'keydown', 'paste'] as const) document.addEventListener(type, once, { once: true, capture: true });
    return () => {
      for (const type of ['pointerdown', 'keydown', 'paste'] as const) document.removeEventListener(type, once, { capture: true });
    };
  }, [warmUp]);

  const canSend = !!s.redaction && s.hasCloud && !s.sending;
  /** Hides the details and moves on to the check. */
  const begin = (text: string) => {
    if (!text.trim()) return;
    setView('outgoing');
    setStep(2);
    void scrub(text);
  };
  const loadFile = async (files: File[]) => {
    const file = files[0];
    if (file) begin(await file.text());
  };

  return (
    <div className="glaze min-h-dvh bg-page text-text-1" data-testid="app" data-run={s.run} data-phase={s.phase} data-step={step} data-cloud={s.hasCloud ? 'on' : 'off'}>
      <GlazePortalProvider>
        <TooltipProvider>
          <div className="mx-auto flex max-w-200 flex-col gap-5 p-6">
            <h1 className="type-title">Airlock</h1>

            <nav aria-label="Steps">
              <ol className="flex flex-wrap items-center gap-2">
                {STEPS.map((label, i) => {
                  const n = i + 1;
                  return (
                    <li key={label}>
                      <Button
                        variant={n === step ? 'secondary' : 'ghost'}
                        size="sm"
                        aria-current={n === step ? 'step' : undefined}
                        disabled={n > 1 && !s.redaction}
                        onClick={() => setStep(n)}
                        data-testid={`step-${n}`}
                      >
                        {n}. {label}
                      </Button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className={step === 1 ? 'block' : 'hidden'}>
              <Card data-testid="pane-source">
                <CardHeader>
                  <CardTitle>Paste the text you want help with</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <p className="type-body text-text-2">Names, addresses and numbers are hidden on this device before anything is sent. You see the result next.</p>
                    <AttachmentDrop accept="text/plain,.txt,.md" multiple={false} onFiles={loadFile} overlayLabel="Drop a text file to read it on this device">
                      <Textarea
                        data-testid="source-input"
                        aria-label="Your text"
                        placeholder="Paste a letter or record here, or drop a text file"
                        rows={14}
                        value={s.text}
                        onValueChange={setText}
                        onPaste={(ev) => {
                          const pasted = ev.clipboardData?.getData('text') ?? '';
                          if (!pasted) return;
                          const el = ev.currentTarget;
                          // Scrub what the box will hold once the paste has landed.
                          begin(el.value.slice(0, el.selectionStart) + pasted + el.value.slice(el.selectionEnd));
                        }}
                      />
                    </AttachmentDrop>
                  </div>
                </CardContent>
                <CardFooter>
                  <CardMeta>Nothing is sent at this step.</CardMeta>
                  <Button variant="secondary" onClick={() => begin(SAMPLE_LETTER)} data-testid="load-sample">
                    Try a sample letter
                  </Button>
                  <Button onClick={() => begin(s.text)} disabled={!s.text.trim()} data-testid="hide-now">
                    Hide personal details
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className={step === 2 ? 'flex flex-col gap-5' : 'hidden'}>
              <Notices s={s} />
              <Card data-testid="pane-outgoing">
                <CardHeader>
                  <CardTitle>This is what the cloud model will receive</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <p className="type-body text-text-2">Boxes are hidden details. Click a box to show it. Click any other word to hide it.</p>
                    <SegmentedControl value={view} onValueChange={(v) => setView(String(v))} aria-label="Which text to show" size="sm">
                      <SegmentedControlItem value="outgoing" data-testid="view-outgoing">
                        What will be sent
                      </SegmentedControlItem>
                      <SegmentedControlItem value="original" data-testid="view-original">
                        Your original
                      </SegmentedControlItem>
                    </SegmentedControl>
                    <div className="max-h-112 overflow-auto" data-testid="outgoing-scroll">
                      {!s.redaction ? null : view === 'outgoing' ? (
                        <OutgoingText key={s.run} redaction={s.redaction} restored={s.restored} onHide={hide} onShow={show} />
                      ) : (
                        <p className="type-body whitespace-pre-wrap break-words text-text-2" data-testid="original-text">
                          {s.source}
                        </p>
                      )}
                    </div>
                    <Legend />
                    <StatusLine s={s} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Vault s={s} />
                  <form
                    className="me-auto flex items-center gap-2"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      if (manual.trim()) hide(manual);
                      setManual('');
                    }}
                  >
                    <Input
                      aria-label="A word or phrase to hide everywhere"
                      placeholder="Type a word to hide"
                      value={manual}
                      onValueChange={setManual}
                      data-testid="manual-hide-input"
                    />
                    <Button type="submit" variant="secondary" disabled={!manual.trim()} data-testid="manual-hide">
                      Hide it
                    </Button>
                  </form>
                  <Button onClick={() => setStep(3)} data-testid="continue">
                    Looks right, continue
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className={step === 3 ? 'flex flex-col gap-5' : 'hidden'}>
              <Card data-testid="ask-card">
                <CardHeader>
                  <CardTitle>What do you want to know?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={() => void send({ task: 'explain' })} disabled={!canSend} pending={s.sending} pendingLabel="Sending" data-testid="ask-explain">
                        Explain this
                      </Button>
                      <Button variant="secondary" onClick={() => void send({ task: 'actions' })} disabled={!canSend} data-testid="ask-actions">
                        What should I do?
                      </Button>
                      <Button variant="secondary" onClick={() => void send({ task: 'reply' })} disabled={!canSend} data-testid="ask-reply">
                        Draft a reply
                      </Button>
                    </div>
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        if (question.trim() && canSend) void send({ question });
                      }}
                    >
                      <Input
                        aria-label="Your own question about the text"
                        placeholder="Or type your own question"
                        value={question}
                        onValueChange={setQuestion}
                        data-testid="ask-input"
                      />
                      <Button type="submit" variant="secondary" disabled={!canSend || !question.trim()} data-testid="ask-send">
                        Send question
                      </Button>
                    </form>
                  </div>
                </CardContent>
                <CardFooter>
                  <CardMeta data-testid="ask-note">
                    {s.hasCloud
                      ? 'Only the text you checked is sent. Your details are put back in the answer on this device.'
                      : 'The cloud step is off: no Firebase configuration was found.'}
                  </CardMeta>
                </CardFooter>
              </Card>
              <AnswerCard s={s} />
            </div>
          </div>
        </TooltipProvider>
      </GlazePortalProvider>
    </div>
  );
}
