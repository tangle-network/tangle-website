import { highlightCode, type TokenStyle } from '@tangle-network/ui/code-presentation';
import { FileTabs, getSyntaxLanguage } from '@tangle-network/ui/files';
import { useFollowTail } from '@tangle-network/ui/hooks/use-follow-tail';
import { Markdown } from '@tangle-network/ui/markdown';
import { Button, TerminalCursor, TerminalLine } from '@tangle-network/ui/primitives';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { formatDate } from '../utils/date';
import { agentSteps, applyStep, plain, stepKind, stepPath } from '../utils/session.mjs';
import { Install } from './QuickstartCode';
import { Feed, ReplayBar, frame, useReplay, type Ev, type Mark } from './RunReplay';
import './pair-replay.css';

// Replays a terminal session that scripts/record-examples.mts --session recorded against production: what the person
// typed and what the terminal printed, every file the agent wrote, streamed into an editor, and the page the preview
// URL served. RunReplay's player paces it; typing holds the recorded clock still.
export interface SessionMeta { url: string; recordedAt: string; previewUrl: string | null }
type Step = ReturnType<typeof agentSteps>[number];
type Beat = Mark & { kind: 'type' | 'out' | 'say' | 'step' | 'open'; text?: string; step?: Step };
type Token = { content: string; style?: TokenStyle };

const TAIL_MS = 7000; // the finished page stays on screen this long before the replay ends
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Every event is a moment something new shows; a command, a file and the page opening hold the clock while they type out. */
function marks(events: Ev[]): Mark[] {
  const beats: Mark[] = events.flatMap((e): Mark[] => e.kind === 'command' ? [{ atMs: e.atMs, hold: clamp(e.text!.length * 8, 500, 2600), kind: 'type', text: e.text } as Beat]
    : ['stdout', 'stderr', 'say'].includes(e.kind) ? [{ atMs: e.atMs, hold: e.kind === 'say' ? 1500 : 0, kind: e.kind === 'say' ? 'say' : 'out', text: e.text } as Beat,
      ...(/Preview ready: /.test(plain(e.text!)) ? [{ atMs: e.atMs, hold: 1200, kind: 'open' } as Beat] : [])] : [{ atMs: e.atMs }]);
  for (const step of agentSteps(events)) {
    const kind = stepKind(step), size = String(step.input.content ?? step.input.new_string ?? step.input.newString ?? '').length;
    if (kind !== 'other') beats.push({ atMs: step.atMs, hold: kind === 'write' ? clamp(size / 1.6, 700, 3600) : 1100, kind: 'step', step } as Beat);
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

/** One line of code, cut at `cut` characters while it types; whole lines never re-render. */
const Line = memo(function Line({ tokens, cut, n, mark }: { tokens: Token[]; cut: number; n: number; mark: boolean }) {
  let left = cut;
  return (
    <span className="pr-line" data-mark={mark || undefined}>
      <i aria-hidden="true">{n}</i>
      <code>{tokens.map((token, i) => {
        if (left <= 0) return null;
        const text = token.content.slice(0, left);
        left -= token.content.length;
        return <span key={i} style={token.style}>{text}</span>;
      })}{cut !== Infinity && <TerminalCursor className="pr-caret" />}</code>
    </span>
  );
});

export default function PairReplay({ meta, install }: { meta: SessionMeta; install?: string }) {
  const replay = useReplay(meta.url, marks, false), { events, line, r, t, still, setPlaying } = replay;
  const [tokens, setTokens] = useState<Map<string, Token[][]>>(new Map());
  const [picked, setPicked] = useState<string>();
  const [run, setRun] = useState(false);
  const root = useRef<HTMLDivElement>(null), term = useRef<HTMLDivElement>(null), code = useRef<HTMLDivElement>(null);

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

  // Play once the replay is on screen, pause off screen.
  useEffect(() => {
    if (!line || still || !root.current) return;
    let seen = false;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !seen) { seen = true; setPlaying(true); } else if (!entry.isIntersecting) setPlaying(false); }, { threshold: 0.35 });
    io.observe(root.current);
    return () => io.disconnect();
  }, [line, still]);

  const view = useMemo(() => {
    const terminal: { key: number; text: string; typed: number; out: { say: boolean; text: string }[] }[] = [];
    const files = new Map<string, string>(), latest = new Map<string, string>();
    let active: { path: string; id: string; typed: number; text: string; mark?: [number, number] } | undefined, open = 0;
    for (const beat of (line?.marks ?? []) as Beat[]) {
      if (r < beat.r!) break;
      const p = progress(beat, r), last = terminal.at(-1)?.out.at(-1);
      if (beat.kind === 'type') terminal.push({ key: beat.r!, text: beat.text!, typed: Math.round(p * beat.text!.length), out: [] });
      else if ((beat.kind === 'out' || beat.kind === 'say') && terminal.length) {
        if (beat.kind === 'out' && last && !last.say) last.text += beat.text; else terminal.at(-1)!.out.push({ say: beat.kind === 'say', text: beat.text! });
      } else if (beat.kind === 'open') open = p;
      else if (beat.kind === 'step') {
        const step = beat.step!, path = stepPath(step) as string, before = files.get(path) ?? '';
        applyStep(files, step);
        const text = files.get(path);
        if (text === undefined) continue;
        latest.set(path, step.id);
        // An edit marks the lines it changed; a write types out from the top.
        const edit = stepKind(step) === 'edit', lineOf = (n: number) => text.slice(0, Math.max(0, n)).split('\n').length - 1;
        const changed = lineOf([...text].findIndex((c, j) => c !== before[j])), added = text.split('\n').length - before.split('\n').length;
        active = { path, id: step.id, text, typed: edit ? text.length : Math.round(p * text.length),
          mark: edit && p < 1 ? [changed, changed + Math.max(0, added) + String(step.input.new_string ?? step.input.newString ?? '').split('\n').length - 1] : undefined };
      }
    }
    // A tab the reader picked shows that file as it stands; otherwise the file being written.
    const shown = picked && files.has(picked) && picked !== active?.path ? { path: picked, id: latest.get(picked)!, text: files.get(picked)!, typed: Infinity } : active;
    return { terminal, files, shown, open };
  }, [line, r, picked]);

  const agent = useMemo(() => frame(events ?? [], t, line?.jumps ?? []).rows.filter((row) => row.kind === 'tool' || row.kind === 'jump'), [events, t, line]);
  const opened = view.open > 0;
  const app = useMemo(() => (opened ? page(after.reduce((m, f) => m.set(f.path, f.text), new Map<string, string>())) : null), [opened, after]);
  const tail = view.terminal.at(-1);
  useFollowTail(term, { content: `${view.terminal.length} ${tail?.typed} ${tail?.out.length}` });
  // Keep the line being typed, or the line an edit changed, in view.
  const shown = view.shown, focus = shown ? (shown.mark?.[0] ?? shown.text.slice(0, shown.typed).split('\n').length - 1) : 0;
  useEffect(() => {
    const box = code.current, row = box?.querySelectorAll('.pr-line')[focus] as HTMLElement | undefined;
    if (box && row) box.scrollTop = Math.max(0, row.offsetTop - box.clientHeight * 0.55);
  }, [focus, shown?.path]);

  const lines = shown ? tokens.get(shown.id) ?? shown.text.split('\n').map((l) => [{ content: l }]) : [];
  let offset = 0;
  return (
    <div className="pr dark" data-theme="website" ref={root} data-open={opened || undefined} data-at={Math.round(t)}>
      <div className="pr-window">
        <div className="pr-bar" aria-hidden="true"><i /><i /><i /></div>
        <section className="pr-editor" aria-label="Files the agent wrote">
          <FileTabs className="pr-tabs" label="Files the agent wrote" activeId={shown?.path} onSelect={setPicked} onClose={() => {}}
            tabs={[...view.files.keys()].map((path) => ({ id: path, name: path.slice(path.lastIndexOf('/') + 1), path }))} />
          <div className="pr-code" ref={code}>
            {lines.map((tokenLine, i) => {
              const start = offset, length = tokenLine.reduce((n, tk) => n + tk.content.length, 0), typed = shown!.typed;
              offset += length + 1;
              if (start > typed) return null;
              const cut = typed >= shown!.text.length || typed > start + length ? Infinity : typed - start;
              return <Line key={`${shown!.id}:${i}`} tokens={tokenLine} cut={cut} n={i + 1} mark={!!shown!.mark && i >= shown!.mark[0] && i <= shown!.mark[1]} />;
            })}
            {events && !shown && <p className="pr-empty">No files yet.</p>}
          </div>
          <Feed rows={agent} className="pr-agent" />
        </section>
        <section className="pr-term" aria-label="Terminal" ref={term}>
          {view.terminal.map((row) => <div key={row.key}>
            <TerminalLine type="command" className="pr-cmd">{row.text.slice(0, row.typed)}{row.typed < row.text.length && <TerminalCursor className="pr-caret" />}</TerminalLine>
            {row.out.map((out, i) => out.say ? <Markdown key={i} className="pr-say">{out.text}</Markdown> : <pre key={i} className="pr-out"><Ansi text={out.text} /></pre>)}
          </div>)}
        </section>
        {opened && (
          <section className="pr-browser" aria-label="The page the preview URL served" style={{ opacity: view.open, translate: `0 ${(1 - view.open) * 28}px` }}>
            <div className="pr-url"><i /><i /><i /><span>{meta.previewUrl}</span></div>
            {/* The page animates: with reduced motion it waits for the reader. */}
            {still && !run ? <Button className="pr-run" variant="outline" onClick={() => setRun(true)}>Run the page</Button>
              : <iframe title="The page the agent built" srcDoc={app ?? ''} sandbox="allow-scripts" loading="lazy" />}
          </section>
        )}
        {install && <Install command={install} label="Install the CLI" />}
      </div>
      <ReplayBar replay={replay} className="rr-bar" />
      <p className="pr-meta">Recorded {formatDate(meta.recordedAt.slice(0, 10), 'short')} · <a href={meta.url}>JSON</a></p>
    </div>
  );
}
