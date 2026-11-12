import { FileTabs } from '@tangle-network/ui/files';
import { CodeBlock, Markdown } from '@tangle-network/ui/markdown';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tangle-network/ui/primitives';
import { useMemo, useState } from 'react';
import { formatDate } from '../utils/date';
import { Feed, ReplayBar, frame, useReplay, type Ev, type Mark, type RunMeta } from './RunReplay';

type Artifact = { id: string; label: string; text: string; language?: string; markdown?: boolean };
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);

export default function ExampleResult({ meta }: { meta: RunMeta }) {
  const replay = useReplay(meta.url, marks);
  const { events, line, t } = replay;
  const [picked, setPicked] = useState('patch'), [file, setFile] = useState<string>();
  const state = useMemo(() => frame(events ?? [], t, line?.jumps ?? []), [events, t, line]);
  const artifacts = useMemo(() => {
    const calls = (events ?? []).filter((event) => event.kind === 'call');
    const patch = calls.findLast((event) => typeof event.result?.stdout === 'string' && event.result.stdout.startsWith('diff --git '));
    const tests = calls.findLast((event) => typeof event.result?.stdout === 'string' && /^# (?:tests|pass|fail) \d/m.test(event.result.stdout));
    const answers: Artifact[] = (events ?? []).flatMap((event, index) => {
      const agent = event.type === 'agent.finished' ? event.data?.result : undefined;
      const text = agent?.result?.response ?? (event.kind === 'call' ? event.result?.response : undefined);
      return typeof text === 'string' ? [{ id: `answer-${index}`, label: agent ? `${agent.agentId} review` : 'Answer', text, markdown: true }] : [];
    });
    if (answers.length > 1) answers.forEach((answer, index) => { if (answer.label === 'Answer') answer.label += ` ${index + 1}`; });
    const judgments: Artifact[] = calls.filter((event) => event.label === 'judge.score').map((event, index) => ({ id: `judge-${index}`, label: `Assessment ${index + 1}`, text: JSON.stringify(event.result, null, 2), language: 'json' }));
    const commands: Artifact[] = calls.filter((event) => event !== patch && event !== tests && (event.result?.stdout || event.result?.stderr)).map((event, index) => ({ id: `command-${index}`, label: `Command output ${index + 1}`, text: (event.result.stdout || '') + (event.result.stderr || '') }));
    const consoleText = (events ?? []).filter((event) => event.kind === 'stdout' || event.kind === 'stderr').map((event) => event.text ?? '').join('');
    const items: Artifact[] = [
      ...(patch ? [{ id: 'patch', label: 'Patch', text: patch.result.stdout, language: 'diff' }] : []),
      ...(tests ? [{ id: 'tests', label: 'Tests', text: tests.result.stdout + (tests.result.stderr || '') }] : []),
      ...answers, ...judgments, ...commands,
      ...(consoleText ? [{ id: 'console', label: 'Console', text: consoleText }] : []),
    ];
    return { items, patch: patch?.result.stdout as string | undefined, tests };
  }, [events]);
  const artifact = artifacts.items.find((item) => item.id === picked) ?? artifacts.items[0];
  const files = useMemo(() => (artifacts.patch ?? '').split(/(?=^diff --git )/m).filter(Boolean).map((text, index) => ({ id: String(index), text, path: text.match(/^diff --git a\/(.*?) b\/(.*)$/m)?.[2] ?? `File ${index + 1}` })), [artifacts.patch]);
  const selectedFile = files.find((item) => item.id === file) ?? files[0];
  return <section className="qs-result" aria-label="Recorded result" aria-busy={!events && !replay.failed}>
    <details className="qs-record-meta"><summary>Recorded {formatDate(meta.recordedAt.slice(0, 10), 'short')} · Details</summary>
      <p>{meta.costUsd !== null && meta.costUsd > 0 ? `Reported usage $${meta.costUsd.toFixed(4)}.` : 'Usage cost not reported.'} Full invoice unknown. Served model not recorded.</p>
      <a href={meta.url}>Run JSON ↗</a>
    </details>
    {!events && <p className="qs-state" role="status">{replay.failed ? <>The recorded result could not load. <a href={meta.url}>Open the JSON</a>.</> : 'Loading recorded result…'}</p>}
    {events && <>
      {artifact && <div className="qs-output-tools"><Select value={artifact.id} onValueChange={setPicked}><SelectTrigger size="lg" aria-label="Recorded artifact"><SelectValue /></SelectTrigger><SelectContent>{artifacts.items.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>
        {artifact.id === 'patch' && <Button size="lg" variant="ghost" asChild><a className="qs-download" aria-label="Download patch" title="Download patch" download="fix.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(artifacts.patch!)}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" /></svg><span>Download patch</span></a></Button>}
      </div>}
      {artifact?.id === 'patch' && files.length > 1 && <FileTabs label="Changed files" activeId={selectedFile.id} onSelect={setFile} tabs={files.map((item) => ({ id: item.id, name: item.path.slice(item.path.lastIndexOf('/') + 1), path: item.path }))} />}
      <div className="qs-output-body" tabIndex={0} aria-label={artifact ? `${artifact.label} from the record` : 'Recorded output'}>
        {artifact ? <>
          {artifact.markdown ? <Markdown className="qs-answer">{artifact.text}</Markdown> : artifact.language ? <CodeBlock code={artifact.id === 'patch' ? selectedFile.text : artifact.text} language={artifact.language} label="" showLineNumbers className="rounded-none border-0" /> : <pre>{artifact.text}</pre>}
        </> : <p className="qs-state">This record contains activity without a retained answer or console output.</p>}
      </div>
    </>}
    <details className="qs-activity"><summary>Recorded activity</summary><div data-at={Math.round(t)}>
      <div className="qs-replay-bar" ref={replay.root}><span>Saved playback</span><ReplayBar replay={replay} /></div>
      <Feed rows={state.rows.filter((row) => row.kind !== 'stdout' && row.kind !== 'stderr')} />
    </div></details>
  </section>;
}
