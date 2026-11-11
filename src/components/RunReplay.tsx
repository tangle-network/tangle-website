import { useFollowTail } from '@tangle-network/ui/hooks/use-follow-tail';
import { Button, SegmentedControl, Slider } from '@tangle-network/ui/primitives';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clock, elapsed, formatDate } from '../utils/date';
import './run-replay.css';

// Replays a record that scripts/record-examples.mts made against production, at its recorded timing. The player here
// (loader, pacing, play loop, controls, feed) also drives PairReplay, a terminal session's editor, terminal and page.
export interface RunMeta { url: string; recordedAt: string; runId: string; sha: string; sdk: string; costUsd: number | null }
export type Ev = { atMs: number; kind: string; durationMs?: number; line?: number; label?: string; assign?: string; result?: any; error?: any; type?: string; data?: any; text?: string };
export type Row = { key: string; atMs: number; kind: string; text: string; detail?: string; state?: string };
/** A moment the replay shows something new; `hold` keeps the recorded clock still while it types out. */
export type Mark = { atMs: number; hold?: number; r?: number };

type Idle = [ms: number, playsIn: number]; // a stretch over `ms` in which nothing new happens plays in `playsIn`, the clock sweeping its real length
const usd = (n: unknown) => (typeof n === 'number' ? `$${n.toFixed(n < 1 ? 4 : 2)}` : '');
const FIELDS = ['id', 'fleetId', 'exitCode', 'state', 'outcome', 'composite', 'costUsd', 'spentUsd', 'interrupted', 'traceId', 'status'];
const brief = (v: Ev['result'], quote = true): string => v === null || typeof v !== 'object'
  ? (typeof v === 'string' && quote ? JSON.stringify(v.length > 56 ? `${v.slice(0, 56)}…` : v) : String(v))
  : Array.isArray(v) ? `${v.length} × ${[...new Set(v.map((x) => x?.status ?? typeof x))].join(', ')}`
  : FIELDS.filter((k) => v[k] !== undefined).slice(0, 3).map((k) => `${k} ${k.endsWith('Usd') ? usd(v[k]) : brief(v[k], false)}`).join('  ') || `{ ${Object.keys(v).slice(0, 3).join(', ')} … }`;
const summary = (input: Record<string, unknown> = {}) => String(input.description ?? input.command ?? input.file_path ?? input.query ?? input.url ?? '');
const done = (e: Ev, t: number) => e.atMs + (e.durationMs ?? 0) <= t;

/** Replay time `r` for each mark, the anchors that map it back to recorded time, and the squeezed stretches. */
function pace(input: Mark[], [IDLE_MS, JUMP_MS]: Idle) {
  const marks = [...input].sort((a, b) => a.atMs - b.atMs), anchors: [number, number][] = [[0, 0]], jumps: { atMs: number; gap: number }[] = [];
  let r = 0, at = 0;
  for (const mark of marks) {
    const gap = mark.atMs - at;
    if (gap > IDLE_MS) jumps.push({ atMs: at, gap });
    r += gap > IDLE_MS ? JUMP_MS : gap;
    mark.r = r;
    anchors.push([r, mark.atMs]);
    if (mark.hold) anchors.push([(r += mark.hold), mark.atMs]);
    at = mark.atMs;
  }
  return { marks, anchors, jumps, total: r };
}
const recordAt = (anchors: [number, number][], r: number) => {
  const i = anchors.findLastIndex(([x]) => x <= r), [r0, t0] = anchors[i], next = anchors[i + 1];
  return !next || next[0] === r0 ? t0 : t0 + ((r - r0) / (next[0] - r0)) * (next[1] - t0);
};

/** Loads a record and plays it: `r` is replay time, `t` the recorded time it shows. Reduced motion starts at the end. */
export function useReplay(url: string, marks: (events: Ev[]) => Mark[], autoplay: boolean, idle: Idle = [10_000, 800]) {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [r, setR] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const [still, setStill] = useState(false);
  useEffect(() => {
    fetch(url).then((res) => res.json()).then((record) => setEvents([...record.events].sort((a: Ev, b: Ev) => a.atMs - b.atMs)), () => setFailed(true));
  }, [url]);
  const line = useMemo(() => (events ? pace(marks(events), idle) : null), [events]);
  useEffect(() => { if (line && matchMedia('(prefers-reduced-motion: reduce)').matches) { setStill(true); setR(line.total); setPlaying(false); } }, [line]);
  useEffect(() => {
    if (!playing || !line) return;
    let last = performance.now(), raf = requestAnimationFrame(function tick(now: number) {
      const dt = (now - last) * speed; // React may run the updater after this frame, when `last` has moved on
      last = now;
      setR((value) => Math.min(line.total, value + dt));
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, line, speed]);
  useEffect(() => { if (line && r >= line.total) setPlaying(false); }, [r, line]);
  const t = line ? recordAt(line.anchors, r) : 0, end = line ? recordAt(line.anchors, line.total) : 0;
  return { url, events, failed, line, r, t, end, playing, setPlaying, setR, speed, setSpeed, still };
}

/** Play, scrub, the recorded clock and speed, and a note when the record did not load. */
export function ReplayBar({ replay, className, autoFocus, children }: { replay: ReturnType<typeof useReplay>; className: string; autoFocus?: boolean; children?: ReactNode }) {
  const { line, r, t, end, playing, setPlaying, setR, speed, setSpeed } = replay;
  return <>
    <div className={className}>
      <Button variant="ghost" size="icon-sm" autoFocus={autoFocus} disabled={!line} aria-label={playing ? 'Pause' : 'Play'} onClick={() => { if (line && r >= line.total) setR(0); setPlaying(!playing); }}>{playing ? '❚❚' : '▶'}</Button>
      <Slider className="rr-scrub" min={0} max={line?.total ?? 1} step={50} value={[r]} thumbLabels={[`Replay position ${clock(t)}`]} onValueChange={([value]) => setR(value)} />
      <span className="rr-time">{clock(t)} / {clock(end)}</span>
      <SegmentedControl aria-label="Speed" value={String(speed)} onValueChange={(value) => setSpeed(Number(value))} options={[{ value: '1', label: '1×' }, { value: '4', label: '4×' }]} />
      {children}
    </div>
    {replay.failed && <p className="rr-note">The record did not load. <a href={replay.url}>Open the JSON</a>.</p>}
  </>;
}

/** The activity feed, following its newest row until the reader scrolls up. */
export function Feed({ rows, className = '' }: { rows: Row[]; className?: string }) {
  const feed = useRef<HTMLOListElement>(null);
  useFollowTail(feed, { content: rows.length });
  return (
    <ol className={`rr-feed ${className}`} ref={feed}>
      {rows.map((row) => row.kind === 'stdout' || row.kind === 'stderr'
        ? <li key={row.key} data-kind={row.kind}><pre>{row.text}</pre></li>
        : <li key={row.key} data-kind={row.kind} data-state={row.state}><b>{row.text}</b><span>{row.detail}</span></li>)}
    </ol>
  );
}

/** The record's state at `t`: values assigned, agents, spend, the activity feed and the source lines in flight. */
export function frame(events: Ev[], t: number, jumps: { atMs: number; gap: number }[]) {
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
  for (const { atMs, gap } of jumps) if (atMs < t) rows.set(`+${atMs}`, { key: `+${atMs}`, atMs, kind: 'jump', text: `+${elapsed(gap)}` });
  return { values, agents, spend, lines, rows: [...rows.values()].sort((a, b) => a.atMs - b.atMs) };
}

// Every call start and end counts as activity, except a poll's: a call repeated from one source line counts only first and last.
const ticks = (events: Ev[]): Mark[] => {
  const from = (e: Ev) => events.filter((x) => x.kind === 'call' && x.line === e.line);
  const poll = (e: Ev) => e.kind === 'call' && !!e.line && from(e).length > 4 && e !== from(e)[0] && e !== from(e).at(-1);
  return events.filter((e) => !poll(e)).flatMap((e) => [{ atMs: e.atMs }, { atMs: e.atMs + (e.durationMs ?? 0) }]);
};

export default function RunReplay({ meta, onClose, id }: { meta: RunMeta; onClose: () => void; id: string }) {
  const replay = useReplay(meta.url, ticks, true), { events, t, line } = replay;
  const state = useMemo(() => frame(events ?? [], t, line?.jumps ?? []), [events, t, line]);
  // Each line lights while its call runs and stays marked once it returns.
  const lit = [...state.lines].map(([line, s]) => `[id="${id}"] ~ .qs-code code > span:nth-child(${line}){opacity:1${s === 'running' ? ';background:var(--accent-surface-strong)' : ''}}`).join('');

  return (
    <aside id={id} className="rr dark" data-theme="website" aria-label="Recorded run" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      <style>{lit}</style>
      <p className="rr-head">Recorded {formatDate(meta.recordedAt.slice(0, 10), 'short')} · run {meta.runId} · source sha {meta.sha.slice(0, 8)} · SDK {meta.sdk} · {meta.costUsd === null ? 'cost not reported' : usd(meta.costUsd)}{' '}
        <a href={meta.url}>JSON</a></p>
      <ReplayBar replay={replay} className="rr-bar"><Button variant="ghost" size="icon-sm" autoFocus aria-label="Close the replay" onClick={onClose}>✕</Button></ReplayBar>
      {events && <>
        <dl className="rr-values">{[...state.values].map(([name, v]) => <div key={name}><dt>{name}</dt><dd>{v.value}{v.count > 1 && <small> ×{v.count}</small>}</dd></div>)}</dl>
        {state.agents.size > 0 && <div className="rr-fleet" aria-label="Fleet agents">
          {state.spend && <p>{usd(state.spend.spentUsd)} spent of {usd(state.spend.capUsd)}</p>}
          <ul>{[...state.agents].map(([id, a]) => <li key={id} data-state={a.state}><i aria-hidden="true" /><b>{id}</b><span>{a.state === 'running' ? 'running' : `${a.state} ${usd(a.cost)}`}</span></li>)}</ul>
        </div>}
        <Feed rows={state.rows} />
      </>}
    </aside>
  );
}
