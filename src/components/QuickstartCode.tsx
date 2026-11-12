import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button } from '@tangle-network/ui/primitives';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clock } from '../utils/date';
import { agentSteps } from '../utils/session.mjs';
import ExampleResult from './ExampleResult';
import { Feed, useReplay, type Ev, type Mark, type Row, type RunMeta } from './RunReplay';
import './quickstart-code.css';

export interface Idea { id: string; title: string; code: string; run?: RunMeta; install?: string }
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }

export const Install = ({ command, label }: { command: string; label: string }) => (
  <div className="qs-install" role="group" aria-label={label}><code><span aria-hidden="true">$ </span>{command}</code><CopyButton key={command} text={command} aria-label="Copy command" /></div>
);

const PLAY_MS: [number, number] = [5000, 16_000]; // every replay lasts this long: a short record plays slower, a long one faster
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);
const seconds = (ms = 0) => (ms < 995 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 9950 ? 1 : 0)} s`);
const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const short = (text: string, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** What a call returned, in the few characters that fit beside its line. */
function brief(result: any): string {
  if (result == null || result === 'stream') return '';
  if (typeof result === 'number') return String(+result.toFixed(4));
  if (typeof result === 'string') return short(result.trim().split('\n')[0]);
  if (Array.isArray(result)) return `${result.length} ${result.length === 1 ? 'result' : 'results'}`;
  if (typeof result.spentUsd === 'number') return `${usd(result.spentUsd)} of ${usd(result.capUsd)}`;
  if (typeof result.exitCode === 'number') return `exit ${result.exitCode}`;
  if (typeof result.composite === 'number') return `score ${result.composite}`;
  const value = result.url ?? result.id ?? result.fleetId ?? result.snapshotId?.slice(0, 12) ?? result.jobId ?? result.path ?? result.outcome ?? result.status ?? result.state;
  return typeof value === 'string' ? short(value.replace(/^https:\/\//, '')) : '';
}
const failed = (event: Ev) => !!event.error || (typeof event.result?.exitCode === 'number' && event.result.exitCode !== 0);

/** The run so far: one row per source line that made calls, and the agent's own steps as they happen. */
function activity(events: Ev[], t: number) {
  const lines = new Map<number, { row: Row; done: number; total: number; last?: Ev }>();
  const rows: Row[] = [];
  let active: number | undefined;
  for (const event of events) {
    if (event.atMs > t) break;
    if (event.kind === 'call' && event.line) {
      const done = event.atMs + (event.durationMs ?? 0) <= t;
      let line = lines.get(event.line);
      if (!line) { line = { row: { key: `l${event.line}`, atMs: event.atMs, kind: 'call', text: event.label ?? '' }, done: 0, total: 0 }; lines.set(event.line, line); rows.push(line.row); }
      line.total++;
      if (done) { line.done++; line.last = event; } else active = event.line;
    } else if (event.type === 'agent.started') rows.push({ key: event.data.agentId, atMs: event.atMs, kind: 'tool', text: event.data.agentId, detail: event.data.harness, state: 'running' });
    else if (event.type === 'agent.finished') { const row = rows.find((item) => item.key === event.data.result?.agentId); if (row) row.state = event.data.result.status; }
  }
  for (const { row, done, total, last } of lines.values()) {
    row.state = done < total ? 'running' : last && failed(last) ? 'failed' : 'completed';
    row.detail = [total > 1 ? `${done}/${total}` : '', last ? brief(last.result) : '', last && total === 1 ? seconds(last.durationMs) : ''].filter(Boolean).join(' · ');
  }
  for (const step of agentSteps(events)) if (step.atMs <= t) rows.push({ key: step.id, atMs: step.atMs, kind: 'tool', text: step.tool.toLowerCase(),
    detail: String(step.input.description ?? step.input.command ?? step.input.file_path ?? step.input.filePath ?? step.input.pattern ?? '').replace(/\/home\/agent\//g, ''),
    state: step.endMs !== undefined && step.endMs <= t ? step.status : 'running' });
  return { rows: rows.sort((a, b) => a.atMs - b.atMs), lines, active };
}

/** Each source line's top, height and the free width after its text, inside the scrolling code pane, kept current as it reflows. */
function useLineBoxes(pane: React.RefObject<HTMLElement | null>, code: string) {
  const [boxes, setBoxes] = useState<[number, number, number][]>([]);
  useLayoutEffect(() => {
    const el = pane.current, pre = el?.querySelector('pre');
    if (!el || !pre) return;
    const measure = () => {
      const base = el.getBoundingClientRect().top - el.scrollTop;
      const right = el.getBoundingClientRect().left + el.clientWidth;
      setBoxes([...el.querySelectorAll('pre > code > span')].map((line) => { const box = line.getBoundingClientRect(), ends = [...line.getClientRects()].at(-1); return [box.top - base, box.height, right - (ends?.right ?? right)]; }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [code]);
  return boxes;
}

function Workspace({ idea, folder, install }: { idea: Idea; folder: string; install: string }) {
  const source = useRef<HTMLElement>(null);
  const replay = useReplay(idea.run?.url ?? '', marks, [700, 420], PLAY_MS);
  const { events, t, line, r } = replay;
  const boxes = useLineBoxes(source, idea.code);
  const ended = !!line && r >= line.total, started = r > 0;
  const run = useMemo(() => activity(events ?? [], started ? t : -1), [events, t, started]);
  const band = run.active !== undefined ? boxes[run.active - 1] : undefined;
  const lastBand = useRef(band);
  if (band) lastBand.current = band;
  useEffect(() => { // keep the running line in the middle third of the pane
    const el = source.current;
    if (!el || !band || (band[0] > el.scrollTop + el.clientHeight * 0.15 && band[0] + band[1] < el.scrollTop + el.clientHeight * 0.8)) return;
    el.scrollTo({ top: band[0] - el.clientHeight * 0.35, behavior: replay.still ? 'auto' : 'smooth' });
  }, [band?.[0]]);
  const made = events?.find((event) => event.kind === 'call' && typeof (event.result?.id ?? event.result?.fleetId) === 'string')?.result;
  const box = (made?.id ?? made?.fleetId) as string | undefined;
  const label = ended ? 'Run again' : replay.playing ? 'Pause' : 'Run';
  return <div className="qs-main" data-state={!idea.run ? 'source' : ended ? 'ended' : replay.playing ? 'running' : 'idle'}>
    <div className="qs-pane qs-source">
      <div className="qs-actions">
        <span className="qs-file"><i>{folder}/</i>{idea.id}.mts</span>
        <CopyButton text={idea.code} aria-label="Copy file" />
        {idea.run && <Button size="sm" className="qs-run" disabled={!line} onClick={replay.toggle} title="Plays the recorded run">{label}</Button>}
      </div>
      <section className="qs-code" ref={source} aria-label={`${idea.id}.mts source`}>
        <CodeBlock code={idea.code} language="ts" label="" showLineNumbers className="rounded-none border-0" />
        <div className="qs-exec" aria-hidden="true">
          {lastBand.current && <i className="qs-band" data-on={!!band || undefined} style={{ transform: `translateY(${lastBand.current[0]}px)`, height: lastBand.current[1] }} />}
          {[...run.lines].map(([n, { row, last }]) => boxes[n - 1] && row.state !== 'running' && last &&
            <span key={n} className="qs-ret" data-state={row.state} style={{ top: boxes[n - 1][0] + boxes[n - 1][1] }}>{boxes[n - 1][2] > 240 && <b>{brief(last.result)}</b>}{seconds(last.durationMs)}</span>)}
        </div>
      </section>
      <Install command={idea.install ?? install} label="Install" />
    </div>
    {idea.run && <div className="qs-pane qs-machine" ref={replay.root}>
        <div className="qs-status">
          <span className="qs-box">{box && started ? box : 'sandbox'}</span>
          <span className="qs-clock">{clock(t)}{ended && idea.run.costUsd ? ` · ${usd(idea.run.costUsd)}` : ''}</span>
          <i className="qs-progress" style={{ transform: `scaleX(${line ? r / line.total : 0})` }} />
        </div>
        {!events ? <p className="qs-wait" role="status">{replay.failed ? 'The run could not load.' : ''}</p> : <>
          <Feed rows={run.rows} className="qs-feed" />
          <ExampleResult events={events} t={started ? t : -1} ended={ended} />
        </>}
    </div>}
  </div>;
}

/** Slides one marker to the chosen job: its list reads the job's box from --thumb-* variables. */
function useThumb(root: React.RefObject<HTMLElement | null>, picked: string) {
  useLayoutEffect(() => {
    const place = () => {
      const item = root.current?.querySelector<HTMLElement>('.qs-list [aria-pressed="true"]'), list = item?.parentElement;
      if (!item || !list) return;
      for (const [name, value] of [['x', item.offsetLeft], ['y', item.offsetTop], ['w', item.offsetWidth], ['h', item.offsetHeight]] as const) list.style.setProperty(`--thumb-${name}`, `${value}px`);
      const rows = list.parentElement!;
      if (rows.scrollWidth > rows.clientWidth) rows.scrollTo({ left: item.offsetLeft - (rows.clientWidth - item.offsetWidth) / 2 });
      const nav = rows.parentElement!, group = rows.previousElementSibling as HTMLElement; // a narrow screen scrolls subjects sideways
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: group.offsetLeft - 12 });
    };
    place();
    const observer = new ResizeObserver(place);
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [picked]);
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
  const root = useRef<HTMLDivElement>(null);
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const [picked, setPicked] = useState('sandboxes/fix-a-test');
  useThumb(root, picked);
  useEffect(() => {
    const read = () => { const value = new URL(window.location.href).searchParams.get('example'); setPicked(tasks.some((task) => task.key === value) ? value! : 'sandboxes/fix-a-test'); };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [tasks]);
  const task = tasks.find((item) => item.key === picked) ?? tasks[0];
  if (!task) return null;
  const choose = (value: string) => {
    setPicked(value);
    const url = new URL(window.location.href); url.searchParams.set('example', value);
    window.history.replaceState(window.history.state, '', url);
  };
  const step = (event: React.KeyboardEvent) => { // the arrow keys walk the jobs, as in a file list
    const next = tasks[tasks.indexOf(task) + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)];
    if (!next || next === task) return;
    event.preventDefault(); choose(next.key);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.qs-list [aria-pressed="true"]')?.focus());
  };
  // One list, like a folder of files: a subject opens to its jobs, and each job shows how long its run took.
  return <div className="qs-editor" ref={root}>
    <nav className="qs-nav" aria-label="Examples" onKeyDown={step}>
      {subjects.map((subject) => {
        const open = subject === task.subject;
        return <Fragment key={subject.id}>
          <Button size="sm" variant="ghost" className="qs-group" aria-expanded={open} onClick={() => open || choose(`${subject.id}/${subject.ideas[0].id}`)}>{subject.label}</Button>
          <div className="qs-rows" inert={!open}>
            <div className="qs-list">
              {subject.ideas.map((idea) => <Button key={idea.id} size="sm" variant="ghost" aria-pressed={idea === task.idea} onClick={() => choose(`${subject.id}/${idea.id}`)}>
                {idea.title}{idea.run && <span aria-hidden="true">{clock(idea.run.ms)}</span>}
              </Button>)}
            </div>
          </div>
        </Fragment>;
      })}
    </nav>
    <Workspace key={task.key} idea={task.idea} folder={task.subject.id} install={task.subject.install} />
  </div>;
}
