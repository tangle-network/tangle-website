import { highlightCode, type TokenStyle } from '@tangle-network/ui/code-presentation';
import { FileTabs, getSyntaxLanguage } from '@tangle-network/ui/files';
import { useFollowTail } from '@tangle-network/ui/hooks/use-follow-tail';
import { Markdown } from '@tangle-network/ui/markdown';
import { Button, TerminalLine } from '@tangle-network/ui/primitives';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { agentSteps, applyStep, plain, stepKind, stepPath } from '../utils/session.mjs';
import { Install } from './QuickstartCode';
import { Feed, ReplayBar, frame, useReplay, type Ev, type Mark } from './RunReplay';
import './pair-replay.css';

// Replays a terminal session that scripts/record-examples.mts --session recorded against production: what the person
// typed and what the terminal printed, every file the agent wrote, streamed into an editor, and the page the preview
// URL served. RunReplay compresses idle time while preserving event order.
export interface SessionMeta { url: string; recordedAt: string; previewUrl: string | null }
type Step = ReturnType<typeof agentSteps>[number];
type Beat = Mark & { kind: 'type' | 'out' | 'say' | 'step' | 'open'; text?: string; step?: Step };
type Token = { content: string; style?: TokenStyle };

const TAIL_MS = 4500; // the finished page stays on screen this long before the replay ends
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Commands, writes and the finished page hold briefly in the recorded sequence. */
function marks(events: Ev[]): Mark[] {
  const beats: Mark[] = events.flatMap((e): Mark[] => e.kind === 'command' ? [{ atMs: e.atMs, hold: 700, kind: 'type', text: e.text } as Beat]
    : ['stdout', 'stderr', 'say'].includes(e.kind) ? [{ atMs: e.atMs, hold: e.kind === 'say' ? 1000 : 0, kind: e.kind === 'say' ? 'say' : 'out', text: e.text } as Beat,
      ...(/Preview ready: /.test(plain(e.text!)) ? [{ atMs: e.atMs, hold: 1200, kind: 'open' } as Beat] : [])] : [{ atMs: e.atMs }]);
  for (const step of agentSteps(events)) {
    const kind = stepKind(step);
    if (kind !== 'other') beats.push({ atMs: step.atMs, hold: kind === 'write' ? 1400 : 700, kind: 'step', step } as Beat);
  }
  return [...beats, { atMs: events.at(-1)?.atMs ?? 0, hold: TAIL_MS }];
}
const progress = (beat: Beat, r: number) => (beat.hold ? clamp((r - beat.r!) / beat.hold, 0, 1) : 1);

/** The page as the preview URL served it: index.html with its local stylesheet and script inlined. */
function page(files: Map<string, string>) {
  const index = [...files.keys()].find((path) => path.endsWith('/index.html'));
  if (!index) return null;
  const root = index.slice(0, index.lastIndexOf('/') + 1), local = (href: string) => files.get(root + href.replace(/^\.?\//, ''));
  return files.get(index)!
    .replace(/<link\b[^>]*href=["']([^"':]+\.css)["'][^>]*>/gi, (tag, href) => (local(href) !== undefined ? `<style>${local(href)}</style>` : tag))
    .replace(/<script\b([^>]*?)\s*src=["']([^"':]+\.m?js)["']([^>]*)><\/script>/gi, (tag, a, src, b) =>
      local(src) !== undefined ? `<script${a}${b}>${local(src)!.replace(/<\/script/gi, '<\\/script')}</script>` : tag);
}

/** Terminal text in the CLI's styles: bold (1) or dim (2) until 22, a color (3x, 9x) until 39. */
function Ansi({ text }: { text: string }) {
  const on = { weight: '', color: '' };
  return <>{text.split(/\x1b\[(\d+)m/).map((part, i) => {
    if (i % 2 === 0) return part && <span key={i} className={`${on.weight} ${on.color}`.trim() || undefined}>{part}</span>;
    const n = Number(part);
    if (n === 0 || n === 22) on.weight = '';
    if (n === 0 || n === 39) on.color = '';
    if (n === 1 || n === 2) on.weight = `pr-c${n}`; else if (n > 29) on.color = `pr-c${n}`;
    return null;
  })}</>;
}

/** Highlighted source stays readable as each recorded file arrives. */
const Line = memo(function Line({ tokens, n, mark }: { tokens: Token[]; n: number; mark: boolean }) {
  return <span className="pr-line" data-mark={mark || undefined}>
    <i aria-hidden="true">{n}</i><code>{tokens.map((token, i) => <span key={i} style={token.style}>{token.content}</span>)}</code>
  </span>;
});

export default function PairReplay({ meta, install, stillUrl }: { meta: SessionMeta; install?: string; stillUrl: string }) {
  const replay = useReplay(meta.url, marks, [1000, 400]), { events, line, r, t, still } = replay;
  const [tokens, setTokens] = useState<Map<string, Token[][]>>(new Map());
  const [picked, setPicked] = useState<string>();
  const [run, setRun] = useState(false);
  const term = useRef<HTMLDivElement>(null), code = useRef<HTMLDivElement>(null);

  // The text each write or edit leaves behind, highlighted once.
  const after = useMemo(() => {
    const files = new Map<string, string>(), out: { id: string; path: string; text: string }[] = [];
    for (const step of events ? agentSteps(events) : []) {
      const path = stepPath(step);
      if (stepKind(step) === 'other' || typeof path !== 'string') continue;
      applyStep(files, step);
      if (files.has(path)) out.push({ id: step.id, path, text: files.get(path)! });
    }
    return out;
  }, [events]);
  useEffect(() => {
    let live = true;
    for (const { id, path, text } of after) highlightCode(text, getSyntaxLanguage(path) ?? 'text').then((lines) => live && setTokens((map) => new Map(map).set(id, lines)), () => {});
    return () => { live = false; };
  }, [after]);

  const view = useMemo(() => {
    const terminal: { key: number; text: string; out: { say: boolean; text: string }[] }[] = [];
    const files = new Map<string, string>(), latest = new Map<string, string>();
    let active: { path: string; id: string; text: string; mark?: [number, number] } | undefined, open = 0;
    for (const beat of (line?.marks ?? []) as Beat[]) {
      if (r < beat.r!) break;
      const p = progress(beat, r), last = terminal.at(-1)?.out.at(-1);
      if (beat.kind === 'type') terminal.push({ key: beat.r!, text: beat.text!, out: [] });
      else if ((beat.kind === 'out' || beat.kind === 'say') && terminal.length) {
        if (beat.kind === 'out' && last && !last.say) last.text += beat.text; else terminal.at(-1)!.out.push({ say: beat.kind === 'say', text: beat.text! });
      } else if (beat.kind === 'open') open = p;
      else if (beat.kind === 'step') {
        const step = beat.step!, path = stepPath(step) as string, before = files.get(path) ?? '';
        applyStep(files, step);
        const text = files.get(path);
        if (text === undefined) continue;
        latest.set(path, step.id);
        // An edit marks its changed lines; writes appear as complete readable source.
        const edit = stepKind(step) === 'edit', marking = edit && p < 1;
        const changed = marking ? text.slice(0, Math.max(0, [...text].findIndex((c, j) => c !== before[j]))).split('\n').length - 1 : 0;
        active = { path, id: step.id, text, mark: marking ? [changed, changed
          + Math.max(0, text.split('\n').length - before.split('\n').length) + String(step.input.new_string ?? step.input.newString ?? '').split('\n').length - 1] : undefined };
      }
    }
    // A tab the reader picked shows that file as it stands; otherwise the file being written.
    const shown = picked && files.has(picked) && picked !== active?.path ? { path: picked, id: latest.get(picked)!, text: files.get(picked)! } : active;
    return { terminal, files, shown, open };
  }, [line, r, picked]);

  const agent = useMemo(() => frame(events ?? [], t, line?.jumps ?? []).rows.filter((row) => row.kind === 'tool' || row.kind === 'jump'), [events, t, line]);
  const opened = view.open > 0;
  const app = useMemo(() => (opened ? page(after.reduce((m, f) => m.set(f.path, f.text), new Map<string, string>())) : null), [opened, after]);
  const tail = view.terminal.at(-1);
  useFollowTail(term, { content: `${view.terminal.length} ${tail?.out.length}` });
  // Keep a changed line in view without moving the surrounding page.
  const shown = view.shown, focus = shown ? (shown.mark?.[0] ?? 0) : 0;
  useEffect(() => {
    const box = code.current, row = box?.querySelectorAll('.pr-line')[focus] as HTMLElement | undefined;
    if (box && row) box.scrollTop = Math.max(0, row.offsetTop - box.clientHeight * 0.55);
  }, [focus, shown?.path]);

  const lines = shown ? tokens.get(shown.id) ?? shown.text.split('\n').map((l) => [{ content: l }]) : [];
  return (
    <div className="pr dark" data-theme="website" ref={replay.root} data-open={opened || undefined} data-at={Math.round(t)}>
      <div className="pr-window">
        <div className="pr-bar"><ReplayBar replay={replay} /></div>
        <section className="pr-editor" aria-label="Files the agent wrote">
          {view.files.size > 0 && <FileTabs className="pr-tabs" label="Files the agent wrote" activeId={shown?.path} onSelect={setPicked}
            tabs={[...view.files.keys()].map((path) => ({ id: path, name: path.slice(path.lastIndexOf('/') + 1), path }))} />}
          <div className="pr-code" ref={code}>
            {lines.map((tokens, i) => <Line key={`${shown!.id}:${i}`} tokens={tokens} n={i + 1} mark={!!shown!.mark && i >= shown!.mark[0] && i <= shown!.mark[1]} />)}
            {!shown && <p className="pr-empty" role="status">{replay.failed ? 'The recorded session could not load.' : 'The agent’s files appear here as it works.'}</p>}
          </div>
          <Feed rows={agent} className="pr-agent" />
        </section>
        <section className="pr-term" aria-label="Terminal" ref={term} inert={opened}>
          {view.terminal.map((row) => <div key={row.key}>
            <TerminalLine type="command" className="pr-cmd">{row.text}</TerminalLine>
            {row.out.map((out, i) => out.say ? <Markdown key={i} className="pr-say">{out.text}</Markdown> : <pre key={i} className="pr-out"><Ansi text={out.text} /></pre>)}
          </div>)}
        </section>
        {opened && (
          <section className="pr-browser" aria-label="The page the preview URL served" style={{ opacity: view.open, transform: still ? undefined : `translateX(${(1 - view.open) * 100}%)` }}>
            <div className="pr-url"><span>{meta.previewUrl}</span></div>
            <img src={stillUrl} alt="Glowing particles forming Hello, world on the page the agent built" width="960" height="640" />
            {replay.visible && (replay.playing || (still && run)) && <iframe title="The page the agent built" style={{ opacity: still || !line ? 1 : clamp((line.total - r) / (TAIL_MS / 3), 0, 1) }} srcDoc={app ?? ''} sandbox="allow-scripts" loading="lazy" />}
            {still && <Button className="pr-run" variant="outline" onClick={() => setRun(!run)}>{run ? 'Pause animation' : 'Run animation'}</Button>}
          </section>
        )}
        {install && <Install command={install} label="Install the CLI" />}
      </div>
    </div>
  );
}
