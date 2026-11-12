import { CodeBlock, Markdown } from '@tangle-network/ui/markdown';
import { useFollowTail } from '@tangle-network/ui/hooks/use-follow-tail';
import { useEffect, useMemo, useRef } from 'react';
import { agentSteps, stepKind, stepPath } from '../utils/session.mjs';
import type { Ev } from './RunReplay';

/** What the run has printed, changed and answered by recorded time `t`. */
export default function ExampleResult({ events, t, ended }: { events: Ev[]; t: number; ended: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const work = useMemo(() => agentSteps(events).filter((step) => step.atMs <= t && ['edit', 'write'].includes(stepKind(step))), [events, t]);
  const result = useMemo(() => {
    const calls = events.filter((event) => event.kind === 'call' && event.atMs + (event.durationMs ?? 0) <= t);
    const outputs = calls.filter((event) => typeof event.result?.stdout === 'string' && event.result.stdout.trim());
    const patch = outputs.findLast((event) => event.result.stdout.startsWith('diff --git '))?.result.stdout as string | undefined;
    const tests = outputs.findLast((event) => /^# tests \d/m.test(event.result.stdout))?.result.stdout as string | undefined;
    const pass = tests?.match(/^# pass (\d+)/m)?.[1], fail = tests?.match(/^# fail (\d+)/m)?.[1];
    const answers = events.flatMap((event, key) => {
      const agent = event.type === 'agent.finished' && event.atMs <= t ? event.data?.result : undefined;
      const text = agent?.result?.response ?? (calls.includes(event) ? event.result?.response : undefined);
      return typeof text === 'string' || agent ? [{ key, text: typeof text === 'string' ? text : '', agent: agent?.agentId, status: agent?.status, error: agent?.error ?? agent?.result?.error }] : [];
    });
    const assessments = calls.filter((event) => event.label === 'judge.score');
    const errors = calls.flatMap((event) => {
      const error = event.error?.message ?? event.result?.error?.message ?? event.result?.error;
      const exit = event.result?.exitCode;
      const bad = typeof exit === 'number' && exit !== 0; // a command that exits 0 may still write notices to stderr
      return error || bad ? [`${bad ? `Command exited ${exit}\n` : ''}${String(error ?? event.result?.stderr ?? '')}`] : [];
    });
    const consoleText = events.filter((event) => event.atMs <= t && ['stdout', 'stderr'].includes(event.kind))
      .map((event) => event.text ?? '').join('');
    const remainingConsole = answers.reduce((text, answer) => answer.text.trim() ? text.replace(answer.text.trim(), '') : text, consoleText);
    const consoleOutput = assessments.length || answers.some((answer) => answer.agent) || /\b(?:inputTokens|outputTokens|cacheReadTokens)\b/.test(remainingConsole) || !remainingConsole.trim() ? '' : remainingConsole;
    return { patch, tests, pass, fail, answers, assessments, errors, consoleText: consoleOutput,
      output: outputs.filter((event) => event.result.stdout !== patch && event.result.stdout !== tests && !consoleOutput.includes(event.result.stdout.trim())).map((event) => event.result.stdout).join('\n') };
  }, [events, t]);

  const empty = !work.length && !result.answers.length && !result.output && !result.consoleText && !result.errors.length && !result.assessments.length && !result.tests;
  useFollowTail(panel, { content: `${work.length}:${result.consoleText.length}:${result.output.length}:${ended}`, follow: !ended });
  useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [ended, result.answers.length]); // an answer and the finished result read from their first line
  if (empty) return null;
  return <div className="qs-result" ref={panel} data-ended={ended || undefined} role="region" aria-label="Example output" tabIndex={0}>
    <div className="qs-output">
        {result.errors.map((error, index) => <pre key={index} className="qs-error">{error}</pre>)}
        {result.consoleText &&
          (/^#{1,6} /m.test(result.consoleText) ? <Markdown>{result.consoleText}</Markdown> : <pre>{result.consoleText}</pre>)}
        {result.tests ? <>
          <p className="qs-test-result" role="status">{result.fail === '0' ? `${result.pass} tests passed` : `${result.fail} tests failed`}</p>
          {result.patch && <>
            <pre className="qs-diff">{result.patch.split('\n').filter((line) => !/^(?:index |--- |\+\+\+ )/.test(line)).map((line, index) => {
              const file = line.match(/^diff --git a\/(\S+)/)?.[1];
              return <span key={index} data-line={file ? 'file' : line.startsWith('@@') ? 'hunk' : line[0] === '+' ? 'add' : line[0] === '-' ? 'del' : undefined}>{file ?? line}{'\n'}</span>;
            })}</pre>
            <a className="qs-patch" download="fix.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(result.patch)}`}>Download patch</a>
          </>}
        </> : <>
          {work.map((step) => {
            const code = step.input.new_string ?? step.input.newString ?? step.input.content;
            const path = stepPath(step);
            return <div key={step.id} className="qs-work">
              <p>{String(path).replace(/^.*\/sandbox-demo\//, '')}</p>
              {typeof code === 'string' && <CodeBlock code={code} language="ts" label="" />}
            </div>;
          })}
          {result.answers.map((answer) => <div key={answer.key}>
            {answer.agent && <p className="qs-agent">{answer.agent}{answer.status && answer.status !== 'completed' ? ` · ${answer.status}` : ''}</p>}
            {answer.error && <p className="qs-error">{String(answer.error)}</p>}
            <Markdown>{answer.text}</Markdown>
          </div>)}
          {result.assessments.map((event, index) => <div className="qs-assessment" key={index}>
            <p className="qs-test-result">Score {String(event.result.composite)}</p>
            <dl>{Object.entries(event.result.dimensions ?? {}).map(([name, score]) => <div key={name}><dt>{name}</dt><dd>{String(score)}</dd></div>)}</dl>
            <p>{event.result.notes}</p>
          </div>)}
          {result.output && <pre>{result.output}</pre>}
        </>}
    </div>
  </div>;
}
