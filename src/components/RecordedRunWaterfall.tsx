import { WaterfallHeader, WaterfallRow } from '@tangle-network/charts/react';
import run from '../data/homepageRun.json';
import './recorded-run-waterfall.css';

const LABELS = ['Find files', 'Read formatter', 'Read tests', 'Baseline tests', 'Edit formatter', 'Verify change'];
const tools = run.events.filter((event) => event.kind !== 'assistant');
const traceWindow = {
  startMs: Math.min(...run.tools.map((tool) => tool.atMs)),
  endMs: Math.max(...run.tools.map((tool) => tool.atMs + tool.durationMs)),
};

if (tools.length !== run.tools.length || run.tools.some((tool, index) => {
  const event = tools[index];
  return !event || event.atMs !== tool.atMs || event.durationMs !== tool.durationMs;
})) {
  throw new Error('The recorded waterfall requires matching tool start/end timing.');
}

/** Actual Intelligence timing primitives, fed only captured tool spans.
 * Untimed assistant excerpts and inter-tool gaps do not become model spans. */
export default function RecordedRunWaterfall() {
  return <section className="recorded-run-waterfall" aria-label="Recorded tool-call waterfall">
    <WaterfallHeader label="Tool call" windowMs={traceWindow.endMs - traceWindow.startMs} />
    <ol>
      {run.tools.map((tool, index) => {
        const failedTests = /^# fail [1-9]\d*$/m.test(tools[index].output ?? '');
        return <li key={`${tool.kind}-${tool.atMs}`} className={failedTests ? 'recorded-waterfall-issue' : undefined}
          data-tool-kind={tool.kind} data-failed-tests={failedTests || undefined}>
          <WaterfallRow label={<span className="recorded-waterfall-name"><i aria-hidden="true" />{LABELS[index]}</span>}
            startMs={tool.atMs} endMs={tool.atMs + tool.durationMs} window={traceWindow}
            tone={failedTests ? 'error' : 'default'} />
          <span className="recorded-waterfall-accessible-time">
            {tool.name}: starts {((tool.atMs - traceWindow.startMs) / 1000).toFixed(3)} seconds after the first recorded tool;
            completed in {tool.durationMs} milliseconds{failedTests ? '; output reports two failing tests' : ''}.
          </span>
        </li>;
      })}
    </ol>
  </section>;
}
