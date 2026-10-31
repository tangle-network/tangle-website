import { Button, SegmentedControl, Slider } from '@tangle-network/ui/primitives';
import { useEffect, useMemo, useRef, useState } from 'react';
import './run-replay.css';

// Replays a run that scripts/record-examples.mts recorded against production at its recorded timing.
export interface RunMeta { url: string; recordedAt: string; runId: string; sha: string; sdk: string; costUsd: number | null }
type Ev = { atMs: number; kind: string; durationMs?: number; line?: number; label?: string; assign?: string; result?: any; error?: any; type?: string; data?: any; text?: string; args?: any[] };
type Row = { key: string; atMs: number; kind: string; text: string; detail?: string; state?: string };

const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const usd = (n: unknown) => (typeof n === 'number' ? `$${n.toFixed(n < 1 ? 4 : 2)}` : '');
const FIELDS = ['id', 'fleetId', 'exitCode', 'state', 'outcome', 'composite', 'costUsd', 'spentUsd', 'interrupted', 'traceId', 'status'];
const brief = (v: Ev['result'], quote = true): string => v === null || typeof v !== 'object'
  ? (typeof v === 'string' && quote ? JSON.stringify(v.length > 56 ? `${v.slice(0, 56)}…` : v) : String(v))
  : Array.isArray(v) ? `${v.length} × ${[...new Set(v.map((x) => x?.status ?? typeof x))].join(', ')}`
  : FIELDS.filter((k) => v[k] !== undefined).slice(0, 3).map((k) => `${k} ${k.endsWith('Usd') ? usd(v[k]) : brief(v[k], false)}`).join('  ') || `{ ${Object.keys(v).slice(0, 3).join(', ')} … }`;
const summary = (input: Record<string, unknown> = {}) => String(input.description ?? input.command ?? input.file_path ?? input.query ?? input.url ?? '');
const done = (e: Ev, t: number) => e.atMs + (e.durationMs ?? 0) <= t;

/** The record's state at `t`: values assigned, agents, spend, the activity feed and the source lines in flight. */
function frame(events: Ev[], t: number) {
  const values = new Map<string, { value: string; count: number }>();
  const agents = new Map<string, { state: string; cost?: number }>();
  const rows = new Map<string, Row>();
  const lines = new Map<number, string>();
  let spend: { spentUsd?: number; capUsd?: number } | undefined;
  events.forEach((e, i) => {
    if (e.atMs > t) return;
    const key = String(i);
    if (e.kind === 'call') {
      const finished = done(e, t);
      if (e.line) lines.set(e.line, finished && lines.get(e.line) !== 'running' ? 'done' : 'running');
      rows.set(key, { key, atMs: e.atMs, kind: 'call', text: e.label ?? '', state: e.error ? 'failed' : finished ? 'done' : 'running',
        detail: finished ? (e.error ? e.error.message : `${((e.durationMs ?? 0) / 1000).toFixed(1)} s`) : undefined });
      if (finished && typeof e.result?.spentUsd === 'number') spend = e.result;
      if (finished && e.assign) e.assign.replace(/[{}\s]/g, '').split(',').forEach((name) => {
        const value = e.assign!.startsWith('{') ? e.result?.[name] : e.result;
        values.set(name, { value: brief(value), count: (values.get(name)?.count ?? 0) + 1 });
      });
    } else if (e.kind === 'stdout' || e.kind === 'stderr') {
      rows.set(key, { key, atMs: e.atMs, kind: e.kind, text: e.text?.trimEnd() ?? '' });
    } else if (e.type === 'agent.started') {
      agents.set(e.data.agentId, { state: 'running' });
    } else if (e.type === 'agent.finished') {
      const r = e.data.result;
      agents.set(r.agentId, { state: r.status, cost: r.costUsd });
      rows.set(key, { key, atMs: e.atMs, kind: 'agent', text: r.agentId, state: r.status, detail: usd(r.costUsd) });
    } else if (e.type === 'fleet.finished' && e.data.spend) {
      spend = e.data.spend;
    } else if (e.type === 'message.part.updated' && e.data?.part?.type === 'tool') {
      const p = e.data.part;
      rows.set(p.id, { ...(rows.get(p.id) ?? { key: p.id, atMs: e.atMs }), kind: 'tool', text: p.tool, detail: summary(p.state?.input), state: p.state?.status });
    }
  });
  return { values, agents, spend, lines, rows: [...rows.values()].sort((a, b) => a.atMs - b.atMs) };
}

export default function RunReplay({ meta, onClose }: { meta: RunMeta; onClose: () => void }) {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const feed = useRef<HTMLOListElement>(null);
  const follow = useRef(true);
  const total = useMemo(() => Math.max(0, ...(events ?? []).map((e) => e.atMs + (e.durationMs ?? 0))), [events]);

  useEffect(() => {
    fetch(meta.url).then((r) => r.json()).then((record) => {
      setEvents([...record.events].sort((a: Ev, b: Ev) => a.atMs - b.atMs));
      // Reduced motion shows the finished run at once; the scrubber still moves through it.
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setT(Infinity); setPlaying(false); }
    }, () => setFailed(true));
  }, [meta.url]);
  useEffect(() => {
    if (!playing || !events) return;
    let last = performance.now(), raf = requestAnimationFrame(function tick(now: number) {
      setT((value) => Math.min(total, value + (now - last) * speed));
      last = now;
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, events, speed, total]);
  useEffect(() => { if (t >= total && events) setPlaying(false); }, [t, total, events]);

  const now = Math.min(t, total);
  const state = useMemo(() => frame(events ?? [], now), [events, now]);
  useEffect(() => { if (follow.current && feed.current) feed.current.scrollTop = feed.current.scrollHeight; }, [state.rows.length]);
  // Each line lights while its call runs and stays marked once it returns.
  const lit = [...state.lines].map(([line, s]) => `.qs-code code > span:nth-child(${line}){opacity:1${s === 'running' ? ';background:var(--accent-surface-strong)' : ''}}`).join('');
  const date = new Date(meta.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  return (
    <aside id="qs-replay" className="rr dark" data-theme="website" aria-label="Recorded run" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      <style>{lit}</style>
      <p className="rr-head">Recorded {date} · run {meta.runId} · source sha {meta.sha.slice(0, 8)} · SDK {meta.sdk} · {meta.costUsd === null ? 'cost not reported' : usd(meta.costUsd)}{' '}
        <a href={meta.url}>JSON</a></p>
      <div className="rr-bar">
        <Button variant="ghost" size="icon-sm" autoFocus aria-label={playing ? 'Pause' : 'Play'} onClick={() => { if (now >= total) setT(0); setPlaying(!playing); }}>{playing ? '❚❚' : '▶'}</Button>
        <Slider className="rr-scrub" min={0} max={total} step={50} value={[now]} thumbLabels={[`Replay position ${clock(now)}`]} onValueChange={([value]) => setT(value)} />
        <span className="rr-time">{clock(now)} / {clock(total)}</span>
        <SegmentedControl aria-label="Speed" value={String(speed)} onValueChange={(value) => setSpeed(Number(value))} options={[{ value: '1', label: '1×' }, { value: '4', label: '4×' }]} />
        <Button variant="ghost" size="icon-sm" aria-label="Close the replay" onClick={onClose}>✕</Button>
      </div>
      {failed && <p className="rr-note">The record did not load. <a href={meta.url}>Open the JSON</a>.</p>}
      {events && <>
        <dl className="rr-values">{[...state.values].map(([name, v]) => <div key={name}><dt>{name}</dt><dd>{v.value}{v.count > 1 && <small> ×{v.count}</small>}</dd></div>)}</dl>
        {state.agents.size > 0 && <div className="rr-fleet" aria-label="Fleet agents">
          {state.spend && <p>{usd(state.spend.spentUsd)} spent of {usd(state.spend.capUsd)}</p>}
          <ul>{[...state.agents].map(([id, a]) => <li key={id} data-state={a.state}><i aria-hidden="true" /><b>{id}</b><span>{a.state === 'running' ? 'running' : `${a.state} ${usd(a.cost)}`}</span></li>)}</ul>
        </div>}
        <ol className="rr-feed" ref={feed} onScroll={(e) => { const el = e.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48; }}>
          {state.rows.map((row) => row.kind === 'stdout' || row.kind === 'stderr'
            ? <li key={row.key} data-kind={row.kind}><pre>{row.text}</pre></li>
            : <li key={row.key} data-kind={row.kind} data-state={row.state}><b>{row.text}</b><span>{row.detail}</span></li>)}
        </ol>
      </>}
    </aside>
  );
}
