import { useFollowTail } from '@tangle-network/ui/hooks/use-follow-tail';
import { Button } from '@tangle-network/ui/primitives';
import { useEffect, useMemo, useRef, useState } from 'react';
import { elapsed } from '../utils/date';
import './run-replay.css';

// Replays a record that scripts/record-examples.mts made against production, at its recorded timing. The player here
// (loader, pacing, play loop, controls, feed) also drives PairReplay, a terminal session's editor, terminal and page.
export interface RunMeta { url: string; recordedAt: string; runId: string; sha: string; sdk: string; costUsd: number | null }
export type Ev = { atMs: number; kind: string; durationMs?: number; line?: number; label?: string; assign?: string; result?: any; error?: any; type?: string; data?: any; text?: string };
export type Row = { key: string; atMs: number; kind: string; text: string; detail?: string; state?: string };
/** A moment the replay shows something new; `hold` keeps the recorded clock still for reading. */
export type Mark = { atMs: number; hold?: number; r?: number };

type Idle = [ms: number, playsIn: number]; // a stretch over `ms` in which nothing new happens plays in `playsIn`, the clock sweeping its real length
const summary = (input: Record<string, unknown> = {}) => String(input.description ?? input.command ?? input.file_path ?? input.query ?? input.url ?? '');

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

/** One clock for both demos. Visibility pauses work; reduced motion opens the finished record. */
export function useReplay(url: string, marks: (events: Ev[]) => Mark[], idle: Idle = [10_000, 800]) {
  const root = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Ev[] | null>(null), [failed, setFailed] = useState(false);
  const [r, setR] = useState(0), [enabled, setEnabled] = useState(true);
  const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [still, setStill] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((res) => { if (!res.ok) throw new Error('Record unavailable'); return res.json(); })
      .then((record) => setEvents([...record.events].sort((a: Ev, b: Ev) => a.atMs - b.atMs)))
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true); });
    return () => controller.abort();
  }, [url]);
  const line = useMemo(() => (events ? pace(marks(events), idle) : null), [events]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setStill(media.matches); if (media.matches && line) { setR(line.total); setEnabled(false); } };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [line]);
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: 0.25 });
    if (root.current) io.observe(root.current);
    const update = () => setHidden(document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const playing = enabled && visible && !hidden && !!line && r < line.total;
  useEffect(() => {
    if (!playing || !line) return;
    let last = performance.now(), raf = requestAnimationFrame(function tick(now: number) {
      const dt = Math.max(0, now - last);
      last = now;
      setR((value) => Math.min(line.total, value + dt));
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, line]);
  const toggle = () => { if (line && r >= line.total) { setR(0); setEnabled(true); } else setEnabled(!enabled); };
  return { root, url, events, failed, line, r, t: line ? recordAt(line.anchors, r) : 0, playing, toggle, still, visible: visible && !hidden };
}

export function ReplayBar({ replay }: { replay: ReturnType<typeof useReplay> }) {
  const label = replay.line && replay.r >= replay.line.total ? 'Replay' : replay.playing ? 'Pause' : 'Play';
  return <Button variant="ghost" size="sm" className="rr-toggle" disabled={!replay.line} onClick={replay.toggle} aria-label={`${label} recorded demo`}>{label}</Button>;
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

/** Tool activity at the current point in the app-building demo. */
export function frame(events: Ev[], t: number, jumps: { atMs: number; gap: number }[]) {
  const rows = new Map<string, Row>();
  events.forEach((e) => {
    if (e.atMs > t) return;
    if (e.type === 'message.part.updated' && e.data?.part?.type === 'tool') {
      const p = e.data.part;
      rows.set(p.id, { ...(rows.get(p.id) ?? { key: p.id, atMs: e.atMs }), kind: 'tool', text: p.tool, detail: summary(p.state?.input), state: p.state?.status });
    }
  });
  for (const { atMs, gap } of jumps) if (atMs < t) rows.set(`+${atMs}`, { key: `+${atMs}`, atMs, kind: 'jump', text: `+${elapsed(gap)}` });
  return { rows: [...rows.values()].sort((a, b) => a.atMs - b.atMs) };
}
