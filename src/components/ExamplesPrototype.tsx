import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button, SegmentedControl, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, Textarea } from '@tangle-network/ui/primitives';
import { useEffect, useId, useMemo, useState } from 'react';
import { formatDate } from '../utils/date';
import QuickstartCode, { Install, type Subject, type Idea } from './QuickstartCode';
import { Feed, ReplayBar, frame, useReplay, type Ev, type Mark, type RunMeta } from './RunReplay';
import './examples-prototype.css';

type Variant = 'catalogue' | 'result' | 'edit';
type Task = { key: string; subject: Subject; idea: Idea };
const variants = [
  { value: 'catalogue' as const, label: 'A Catalogue' },
  { value: 'result' as const, label: 'B Result' },
  { value: 'edit' as const, label: 'C Edit' },
];
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [
  { atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) },
]);
const finished = (event: Ev, at: number) => event.atMs + (event.durationMs ?? 0) <= at;
const usageCost = (cost: number | null) => cost === null ? 'Usage cost not reported' : `Reported usage $${cost.toFixed(4)}`;

function RecordedResult({ meta, modelTurn }: { meta: RunMeta; modelTurn: boolean }) {
  const replay = useReplay(meta.url, marks, false);
  const { events, line, t, setR } = replay;
  const [output, setOutput] = useState('patch');
  // Rest shows the completed record; only the reader's Play action starts its clock.
  useEffect(() => { if (line) setR(line.total); }, [line]);
  const state = useMemo(() => frame(events ?? [], t, line?.jumps ?? []), [events, t, line]);
  const candidates = (events ?? []).filter((event) => event.kind === 'call' && typeof event.result?.stdout === 'string');
  const patch = candidates.findLast((event) => event.result.stdout.trimStart().startsWith('diff --git '));
  const tests = candidates.findLast((event) => /(?:^|\n)# (?:tests|pass|fail) \d/.test(event.result.stdout));
  const options = [
    ...(patch ? [{ value: 'patch', label: 'Patch' }] : []),
    ...(tests ? [{ value: 'tests', label: 'Tests' }] : []),
    { value: 'output', label: 'Output' },
  ];
  const selected = options.some((option) => option.value === output) ? output : options[0].value;
  const event = selected === 'patch' ? patch : selected === 'tests' ? tests : undefined;
  const visible = event && finished(event, t);
  const consoleRows = state.rows.filter((row) => row.kind === 'stdout' || row.kind === 'stderr');
  const responses = (events ?? []).filter((item) => finished(item, t) && item.kind === 'call' && typeof item.result?.response === 'string');

  return <section className="ep-result" aria-label="Recorded outcome" aria-busy={!events && !replay.failed}>
    <div className="ep-result-heading">
      <h3>{replay.playing ? 'Replaying the record' : 'Recorded outcome'}</h3>
      <a href={meta.url}>Run JSON ↗</a>
    </div>
    <p className="ep-record-meta">Recorded {formatDate(meta.recordedAt.slice(0, 10), 'short')} · {modelTurn && meta.costUsd !== null ? `Model-turn usage $${meta.costUsd.toFixed(4)}` : usageCost(meta.costUsd)}. Full invoice unknown.</p>
    {!events && !replay.failed && <p className="ep-state" role="status">Loading recorded output…</p>}
    <ReplayBar replay={replay} className="ep-replay-bar" />
    {events && <>
      <div className="ep-output-tools">
        <SegmentedControl aria-label="Recorded artifacts" value={selected} onValueChange={setOutput} options={options} />
        {selected === 'patch' && visible && <Button size="lg" variant="ghost" asChild><a className="ep-download" download="fix.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(event.result.stdout)}`}>Download patch</a></Button>}
      </div>
      <div className="ep-output-body" tabIndex={0} aria-label={`${selected === 'patch' ? 'Patch' : selected === 'tests' ? 'Test command output' : 'Console output'} from the record`}>
        {event ? visible ? <>
          <p className="ep-output-label">{selected === 'patch' ? 'fix.patch' : event.label} {selected === 'tests' && typeof event.result.exitCode === 'number' ? `· exitCode ${event.result.exitCode}` : ''}</p>
          {selected === 'patch' ? <CodeBlock code={event.result.stdout} language="diff" label="" showLineNumbers className="ep-patch rounded-none border-0" /> : <pre>{event.result.stdout}</pre>}
          {event.result.stderr && <pre>{event.result.stderr}</pre>}
        </> : <p className="ep-state">This output appears when its recorded command completes.</p>
          : consoleRows.length ? <Feed rows={consoleRows} />
            : responses.length ? responses.map((item, index) => <pre key={index}>{item.result.response}</pre>)
              : <p className="ep-state">No console output at this point in the record.</p>}
        <details className="ep-activity"><summary>Recorded calls and results</summary>
          <Feed rows={state.rows.filter((row) => row.kind !== 'stdout' && row.kind !== 'stderr')} />
          {[...state.values].length > 0 && <dl>{[...state.values].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value.value}</dd></div>)}</dl>}
        </details>
      </div>
    </>}
  </section>;
}

function TaskWorkspace({ task, editable, draft, onEdit }: { task: Task; editable: boolean; draft: string; onEdit: (value: string) => void }) {
  const { subject, idea } = task;
  const [pane, setPane] = useState(editable ? 'code' : 'output');
  const [wrap, setWrap] = useState(false);
  const changed = editable && draft !== idea.code;
  const source = editable ? draft : idea.code;
  const env = [...new Set(Array.from(source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)\b(?!\s*\?\?)/g), ([, name]) => name))];
  const command = `${idea.install ?? subject.install} && ${env.map((name) => `${name}=<${name.slice(name.lastIndexOf('_') + 1).toLowerCase()}>`).join(' ')} npx tsx ${idea.id}.mts`;
  return <div className={`ep-workspace${editable ? ' ep-editable' : ''}${wrap ? ' ep-wrap' : ''}`} data-pane={pane}>
    <div className="ep-phone-panes"><SegmentedControl aria-label="View" value={pane} onValueChange={setPane} options={[{ value: 'code', label: editable ? 'Edit code' : 'Code' }, { value: 'output', label: 'Recorded output' }]} /></div>
    <div className="ep-columns">
      <section className="ep-source" aria-label={editable ? 'Edit the complete file locally' : 'Complete example source'}>
        <div className="ep-file-tools"><span>{idea.id}.mts</span>
          {editable ? <Button size="lg" variant="outline" disabled={!changed} onClick={() => onEdit(idea.code)}>Reset file</Button>
            : <Button size="lg" variant="outline" aria-pressed={wrap} onClick={() => setWrap(!wrap)}>Wrap lines</Button>}
          <CopyButton text={source} label="Copy file" />
        </div>
        {editable ? <Textarea size="lg" className="ep-source-input" aria-label={`Edit ${idea.id}.mts locally`} aria-describedby={`local-${task.key}`} value={draft} onChange={(event) => onEdit(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" />
          : <div className="ep-code" tabIndex={0}><CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="rounded-none border-0" /></div>}
        {editable && <p className="ep-edit-note" id={`local-${task.key}`}>Edits stay in this page. Copy the file to run it yourself.</p>}
      </section>
      <div className="ep-outcome">
        {changed ? <div className="ep-state ep-edited" role="status"><h3>This file has local edits.</h3><p>The recorded output belongs to the original source.</p><Button size="lg" variant="outline" onClick={() => onEdit(idea.code)}>Restore original file</Button></div>
          : idea.run ? <RecordedResult key={idea.run.url} meta={idea.run} modelTurn={task.key === 'sandboxes/fix-a-test'} />
            : <div className="ep-state ep-missing"><h3>No recorded output for this file.</h3><p>The complete source is available to copy.</p></div>}
      </div>
    </div>
    <Install command={command} label="Copy install and run command" />
  </div>;
}

export default function ExamplesPrototype({ subjects, initialExample = 'sandboxes/fix-a-test' }: { subjects: Subject[]; initialExample?: string }) {
  const uid = useId();
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const [picked, setPicked] = useState(initialExample);
  const [variant, setVariant] = useState<Variant>('catalogue');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const task = tasks.find((item) => item.key === picked) ?? tasks[0];
  useEffect(() => {
    const read = () => { const value = new URL(window.location.href).searchParams.get('variant'); setVariant(variants.some((item) => item.value === value) ? value as Variant : 'catalogue'); };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  if (!task) return <p>No example source is available.</p>;
  const comparisonSubjects = [task.subject, ...subjects.filter((subject) => subject.id !== task.subject.id)].map((subject) => subject.id === task.subject.id ? { ...subject, ideas: [task.idea, ...subject.ideas.filter((idea) => idea.id !== task.idea.id)] } : subject);
  const chooseVariant = (value: Variant) => {
    setVariant(value);
    const url = new URL(window.location.href); url.searchParams.set('variant', value);
    window.history.replaceState(window.history.state, '', url);
  };
  return <div className="examples-prototype" data-variant={variant}>
    <div className="ep-task-picker"><label id={`${uid}-task`} htmlFor={`${uid}-select`}>Choose a task</label>
      <Select value={task.key} onValueChange={setPicked}><SelectTrigger id={`${uid}-select`} size="lg" aria-labelledby={`${uid}-task`}><SelectValue /></SelectTrigger>
        <SelectContent>{subjects.map((subject) => <SelectGroup key={subject.id}><SelectLabel>{subject.label}</SelectLabel>{subject.ideas.map((idea) => <SelectItem key={idea.id} value={`${subject.id}/${idea.id}`}>{idea.title}</SelectItem>)}</SelectGroup>)}</SelectContent>
      </Select>
      {variant === 'catalogue' && <span className="ep-control-label">Catalogue control</span>}
    </div>
    {variant === 'catalogue' ? <QuickstartCode key={task.key} subjects={comparisonSubjects} />
      : <TaskWorkspace key={`${variant}-${task.key}`} task={task} editable={variant === 'edit'} draft={drafts[task.key] ?? task.idea.code} onEdit={(value) => setDrafts((previous) => ({ ...previous, [task.key]: value }))} />}
    <aside className="ep-prototype-switch" aria-label="Prototype layout comparison"><span>Prototype layouts</span><SegmentedControl aria-label="Prototype layout" value={variant} onValueChange={chooseVariant} options={variants} /></aside>
  </div>;
}
