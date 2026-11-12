import { CodeBlock, Markdown } from '@tangle-network/ui/markdown';
import { Button } from '@tangle-network/ui/primitives';
import { useEffect, useMemo, useRef } from 'react';
import { agentSteps, stepKind, stepPath } from '../utils/session.mjs';
import { useReplay, type Ev, type Mark, type RunMeta } from './RunReplay';

const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);

export default function ExampleResult({ meta }: { meta: RunMeta }) {
  const replay = useReplay(meta.url, marks, [1000, 200]);
  const { events, t, line, r } = replay;
  const panel = useRef<HTMLDivElement>(null);
  const ended = !!line && r >= line.total;
  useEffect(() => { panel.current?.scrollIntoView({ block: 'nearest' }); }, []);
  const work = useMemo(() => agentSteps(events ?? []).filter((step) => step.atMs <= t &&
    (['edit', 'write'].includes(stepKind(step)) || (stepKind(step) === 'bash' && /\b(?:npm|pnpm|bun) test\b/.test(String(step.input.command ?? ''))))), [events, t]);
  const result = useMemo(() => {
    const calls = (events ?? []).filter((event) => event.kind === 'call' && event.atMs + (event.durationMs ?? 0) <= t);
    const outputs = calls.filter((event) => typeof event.result?.stdout === 'string' && event.result.stdout.trim());
    const patch = outputs.findLast((event) => event.result.stdout.startsWith('diff --git '))?.result.stdout as string | undefined;
    const tests = outputs.findLast((event) => /^# tests \d/m.test(event.result.stdout))?.result.stdout as string | undefined;
    const pass = tests?.match(/^# pass (\d+)/m)?.[1], fail = tests?.match(/^# fail (\d+)/m)?.[1];
    const answers = (events ?? []).flatMap((event, key) => {
      const agent = event.type === 'agent.finished' && event.atMs <= t ? event.data?.result : undefined;
      const text = agent?.result?.response ?? (calls.includes(event) ? event.result?.response : undefined);
      return typeof text === 'string' || agent ? [{ key, text: typeof text === 'string' ? text : '', agent: agent?.agentId, status: agent?.status, error: agent?.error ?? agent?.result?.error }] : [];
    });
    const assessments = calls.filter((event) => event.label === 'judge.score');
    const errors = calls.flatMap((event) => {
      const error = event.error?.message ?? event.result?.error?.message ?? event.result?.error;
      const exit = event.result?.exitCode;
      return error || event.result?.stderr || (typeof exit === 'number' && exit !== 0) ? [`${typeof exit === 'number' && exit !== 0 ? `Command exited ${exit}\n` : ''}${String(error ?? event.result?.stderr ?? '')}`] : [];
    });
    const consoleText = (events ?? []).filter((event) => event.atMs <= t && ['stdout', 'stderr'].includes(event.kind))
      .map((event) => event.text ?? '').join('');
    const consoleOutput = assessments.length || answers.some((answer) => answer.agent) || /\b(?:inputTokens|outputTokens|cacheReadTokens)\b/.test(consoleText) ? '' : consoleText;
    return { patch, tests, pass, fail, answers: answers.filter((answer) => !answer.text.trim() || !consoleOutput.includes(answer.text.trim())), assessments, errors, consoleText: consoleOutput,
      output: outputs.filter((event) => event.result.stdout !== patch && event.result.stdout !== tests && !consoleOutput.includes(event.result.stdout.trim())).map((event) => event.result.stdout).join('\n') };
  }, [events, t]);

  return <div className="qs-result" ref={panel} data-at={Math.round(t)} role="region" aria-label="Example output" aria-busy={!events && !replay.failed}>
    <div className="qs-output-actions" ref={replay.root}>
      {events && !ended && !replay.still && <Button variant="ghost" size="sm" onClick={replay.toggle}>{replay.playing ? 'Pause' : 'Continue'}</Button>}
      {result.patch && <a download="fix.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(result.patch)}`}>Download patch</a>}
    </div>
    {!events && <p role="status">{replay.failed ? 'The example could not load. Try Run again.' : 'Loading…'}</p>}
    {events && <>
      <div className="qs-output" tabIndex={0}>
        {result.errors.map((error, index) => <pre key={index} className="qs-error">{error}</pre>)}
        {result.consoleText &&
          (/^#{1,6} /m.test(result.consoleText) ? <Markdown>{result.consoleText}</Markdown> : <pre>{result.consoleText}</pre>)}
        {result.tests ? <>
          <p className="qs-test-result" role="status">{result.fail === '0' ? `${result.pass} tests passed` : `${result.fail} tests failed`}</p>
          <pre>{result.tests.split('\n').filter((line) => /^(?:not )?ok \d/.test(line)).join('\n')}</pre>
          {result.patch && <details><summary>View changes</summary><CodeBlock code={result.patch} language="diff" label="" /></details>}
        </> : <>
          {work.map((step) => {
            const code = step.input.new_string ?? step.input.newString ?? step.input.content;
            const path = stepPath(step);
            return <div key={step.id} className="qs-work">
              <p>{typeof path === 'string' ? path.replace(/^.*\/sandbox-demo\//, '') : String(step.input.command ?? step.input.description)}</p>
              {typeof code === 'string' && <CodeBlock code={code} language="ts" label="" />}
            </div>;
          })}
          {result.answers.map((answer) => <div key={answer.key}>
            {answer.agent && <p>{answer.agent}{answer.status && answer.status !== 'completed' ? ` · ${answer.status}` : ''}</p>}
            {answer.error && <p className="qs-error">{String(answer.error)}</p>}
            <Markdown>{answer.text}</Markdown>
          </div>)}
          {result.assessments.map((event, index) => <div className="qs-assessment" key={index}>
            <p className="qs-test-result">Score {String(event.result.composite)}</p>
            <dl>{Object.entries(event.result.dimensions ?? {}).map(([name, score]) => <div key={name}><dt>{name}</dt><dd>{String(score)}</dd></div>)}</dl>
            <p>{event.result.notes}</p>
          </div>)}
          {result.output && <pre>{result.output}</pre>}
          {!work.length && !result.answers.length && !result.output && !result.consoleText && !result.errors.length && !result.assessments.length && <p role="status">{ended ? 'This example has no text output.' : 'Starting…'}</p>}
        </>}
      </div>
    </>}
  </div>;
}
