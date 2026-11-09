import type { TerminalViewProps } from '@tangle-network/sandbox-ui/terminal';
import { Button } from '@tangle-network/ui/primitives';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './live-demo.css';

// A real Pi TUI in a real sandbox, no account: id.tangle.tools issues the session after Turnstile.
const API = 'https://id.tangle.tools/v1/live-demo';
const SITE_KEY = '0x4AAAAAAF6YxRKOtEeWYryk';
const SIGN_UP = 'https://sandbox.tangle.tools/dashboard/new?harness=pi';
const IDLE_MS = 60_000;

// xterm loads only once a session starts, never during the static build.
const loadTerminal = () => import('@tangle-network/sandbox-ui/terminal');
const TerminalView = lazy(() => loadTerminal().then((m) => ({ default: m.TerminalView })));

type Terminal = Omit<TerminalViewProps, 'title' | 'subtitle'>;
interface Session { id: string; secret: string; endsAt: string; terminal: Terminal }
type View =
  | { kind: 'ready' | 'starting' }
  | { kind: 'live'; session: Session }
  | { kind: 'note'; text: string; signUp?: boolean };
interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

const NOTES: Record<string, { text: string; signUp?: boolean }> = {
  live_demo_closed: { text: 'Live sessions are closed right now.', signUp: true },
  live_demo_spent: { text: "Today's live sessions are used up.", signUp: true },
  live_demo_ip_limit: { text: "You've used today's three live sessions.", signUp: true },
  live_demo_busy: { text: 'Every live sandbox is busy. Try again in a minute.' },
  live_demo_bot_check: { text: 'The browser check failed. Reload the page and try again.' },
  ended: { text: 'Session ended.', signUp: true },
};

function loadTurnstile(): Promise<Turnstile> {
  const w = window as unknown as { turnstile?: Turnstile };
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('turnstile')));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const left = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export default function LiveDemo() {
  const [view, setView] = useState<View>({ kind: 'ready' });
  const [open, setOpen] = useState<boolean | undefined>();
  const [now, setNow] = useState(Date.now());
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const token = useRef<string | undefined>(undefined);
  const panel = useRef<HTMLDivElement>(null);
  const term = useRef<HTMLDivElement>(null);
  const active = useRef(Date.now());
  const endRef = useRef<() => void>(undefined);

  useEffect(() => {
    fetch(API).then((r) => r.json()).then((s) => setOpen(s.state !== 'closed' && s.state !== 'spent'), () => setOpen(false));
  }, []);

  useEffect(() => {
    if (!open || !widget.current) return;
    let gone = false;
    loadTurnstile().then((ts) => {
      if (gone || !widget.current) return;
      widgetId.current = ts.render(widget.current, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        callback: (t: string) => { token.current = t; },
        'expired-callback': () => { token.current = undefined; },
      });
    }, () => {});
    return () => { gone = true; };
  }, [open]);

  const session = view.kind === 'live' ? view.session : undefined;
  useEffect(() => {
    if (!session) return;
    const auth = { Authorization: `Bearer ${session.secret}` };
    const url = `${API}/sessions/${session.id}`;
    const end = (text = NOTES.ended) => {
      fetch(url, { method: 'DELETE', headers: auth, keepalive: true }).catch(() => {});
      setView({ kind: 'note', ...text });
    };
    endRef.current = end;
    const touch = () => { active.current = Date.now(); };
    const el = panel.current;
    el?.addEventListener('keydown', touch, true);
    el?.addEventListener('pointerdown', touch, true);
    // Output counts as activity, so a visitor can watch Pi work.
    const watcher = new MutationObserver(touch);
    if (term.current) watcher.observe(term.current, { subtree: true, childList: true, characterData: true });
    let beats = 0;
    const tick = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= Date.parse(session.endsAt) || t - active.current >= IDLE_MS) return end();
      if (++beats % 15 === 0 && document.visibilityState === 'visible')
        fetch(`${url}/heartbeat`, { method: 'POST', headers: auth }).then((r) => { if (r.status === 404) end(); }, () => {});
    }, 1000);
    const leave = () => end();
    window.addEventListener('pagehide', leave);
    return () => {
      clearInterval(tick);
      watcher.disconnect();
      el?.removeEventListener('keydown', touch, true);
      el?.removeEventListener('pointerdown', touch, true);
      window.removeEventListener('pagehide', leave);
    };
  }, [session]);

  async function start() {
    setView({ kind: 'starting' });
    loadTerminal().catch(() => {});
    for (let i = 0; i < 100 && !token.current; i++) await new Promise((r) => setTimeout(r, 200));
    const turnstileToken = token.current;
    token.current = undefined;
    const res = await fetch(`${API}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken }),
    }).catch(() => undefined);
    if (widgetId.current) (window as unknown as { turnstile?: Turnstile }).turnstile?.reset(widgetId.current);
    const body = await res?.json().catch(() => undefined);
    if (res?.status === 201) {
      active.current = Date.now();
      return setView({ kind: 'live', session: body });
    }
    const note = NOTES[body?.error?.code] ?? { text: 'The sandbox did not start. Try again.' };
    if (note.signUp) setOpen(false);
    setView({ kind: 'note', ...note });
  }

  if (session)
    return (
      <div className="live-demo-panel" ref={panel}>
        <div className="live-demo-bar">
          <span className="live-demo-dot" aria-hidden="true" />
          <span>Pi</span>
          <span className="live-demo-left">{left(Math.max(0, Date.parse(session.endsAt) - now))} left</span>
          <Button variant="ghost" size="sm" className="live-demo-end" onClick={() => endRef.current?.()}>End session</Button>
        </div>
        <div className="live-demo-term" ref={term}>
          <Suspense fallback={null}>
            <TerminalView {...session.terminal} title="Pi" subtitle="Live sandbox" isActive fontSize={window.innerWidth < 600 ? 12 : 13} />
          </Suspense>
        </div>
      </div>
    );

  const note = view.kind === 'note' ? view : undefined;
  return (
    <div className="live-demo">
      {open === false ? (
        <a className="live-demo-btn" href={SIGN_UP} target="_blank" rel="noopener noreferrer">Create an account to run Pi</a>
      ) : (
        <Button className="live-demo-btn" disabled={!open || view.kind === 'starting'} onClick={start}>
          {view.kind === 'starting' ? 'Starting Pi…' : 'Try Pi live'}
        </Button>
      )}
      {note && <span className="live-demo-note" role="status">{note.text}</span>}
      <div ref={widget} className="live-demo-check" />
    </div>
  );
}
