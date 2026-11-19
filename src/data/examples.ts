import type { ExampleIdea, ExampleSubject } from '@tangle-network/ui/marketing';
import { timeSeries, renderFigure, isRefusal } from '@tangle-network/charts';
import { sourceDigest } from '../../scripts/example-digest.mjs';

// Each cell loads a complete file from src/examples; `pnpm check:examples`
// typechecks the corpus. Presentation-only comment corrections below preserve the executable digest.
const files = import.meta.glob<string>('../examples/*/*.mts', { query: '?raw', import: 'default', eager: true });
// Each file's recorded production run (scripts/record-examples.mts). A file whose record is missing or was
// recorded from other bytes gets no recorded output; `pnpm check:runs` fails the gate for both.
const records = import.meta.glob<{ source: { sha256: string }; run: { id: string; recordedAt: string; costUsd: number | null; exitCode: number; sdk: Record<string, string> }; events: { atMs: number; durationMs?: number; kind: string; name?: string; result?: any; data?: any }[] }>(
  './runs/*/*.json', { import: 'default', eager: true });
const recordUrls = import.meta.glob<string>('./runs/*/*.json', { query: '?url&no-inline', import: 'default', eager: true });
export const featuredExamples = ['sandboxes/fix-a-test', 'sandboxes/browser-task', 'sandboxes/host-a-page', 'sandboxes/branch-into-two', 'sandboxes/stop-and-resume', 'evals/compare-harnesses'];
const views: Record<string, ExampleIdea['view']> = {
  'sandboxes/fix-a-test': 'timeline', 'sandboxes/browser-task': 'timeline', 'sandboxes/host-a-page': 'page',
  'sandboxes/branch-into-two': 'tree', 'sandboxes/stop-and-resume': 'states', 'evals/compare-harnesses': 'scoreboard',
};
const recorded = (path: string, code: string) => {
  const record = records[path];
  if (record?.run.exitCode !== 0 || record.source.sha256 !== sourceDigest(code)) return undefined;
  const { id, recordedAt, costUsd, exitCode, sdk } = record.run;
  const ms = Math.max(0, ...record.events.map((event) => event.atMs + (event.durationMs ?? 0))); // how long the job took
  return { url: recordUrls[path], recordedAt, runId: id, sha: record.source.sha256, sdk: sdk['@tangle-network/sandbox'], costUsd, exitCode, ms, events: [...featuredExamples, 'fleets/cancel-on-cap'].some(key => path === `./runs/${key}.json`) ? record.events : undefined };
};
const SANDBOX = 'npm install @tangle-network/sandbox';
// Each row is one task in plain words; the file beside it is the whole answer.
const grid: [string, string, string, [string, string, string?][]][] = [
  ['sandboxes', 'Sandboxes', SANDBOX, [
    ['run-code', 'Run a command'],
    ['python-csv', 'Crunch a CSV in Python'],
    ['stop-and-resume', 'Stop, then resume'],
    ['branch-into-two', 'Branch into two'],
    ['snapshot-and-revert', 'Undo with a snapshot'],
    ['find-todos', 'Find every TODO'],
    ['fix-a-test', 'Fix a failing test'],
    ['fix-and-commit', 'Fix a test, then commit'],
    ['watch-an-agent', 'Watch an agent work'],
    ['browser-task', 'Use a browser'],
    ['host-a-page', 'Put a page online'],
    ['ask-for-an-app', 'Ask an agent for an app'],
    ['worker', 'Run a long job'],
  ]],
  ['router', 'Router', 'npm install --save-dev tsx', [
    ['list-serving-models', 'List serving models'],
    ['chat', 'Send a chat completion'],
    ['review-a-route', 'Review code with a chosen model'],
  ]],
  ['evals', 'Evals', `${SANDBOX} @tangle-network/agent-eval`, [
    ['score-a-trace', 'Score an answer'],
    ['grade-replies', 'Grade support replies'],
    ['compare-models', 'Compare two models'],
    ['compare-harnesses', 'Compare coding agents'],
    ['regression-gate', 'Gate a prompt change'],
    ['what-did-it-do', 'Ask what the agent did'],
  ]],
  ['products', 'Agent apps', SANDBOX, [
    ['legal-agent', 'One sandbox per customer'],
    ['email-assistant', 'Connect an email assistant', 'npm install @tangle-network/agent-app'],
    ['support-thread', 'A chat that remembers'],
    ['gtm-agent', 'Call a hosted agent'],
    ['charge-per-turn', 'Bill a customer per turn'],
    ['run-a-batch', 'Run a queue of tasks'],
    ['worker-loop', 'Your own agent loop'],
  ]],
  ['fleets', 'Fleets', SANDBOX, [
    ['under-a-budget', 'Four agents, one budget'],
    ['fan-out', 'Review repository packages'],
    ['translate-readme', 'One language per agent'],
    ['mix-models', 'Cheap model, easy jobs'],
    ['shard-tests', 'Shard the tests'],
    ['cancel-on-cap', 'Stop a fleet at a cap'],
  ]],
  ['runtime', 'Providers', `${SANDBOX} @tangle-network/agent-runtime @tangle-network/agent-provider-tangle`, [
    ['any-cloud', 'Tangle'],
    ['any-cloud-e2b', 'E2B', 'npm install @tangle-network/agent-runtime @tangle-network/agent-provider-e2b'],
    ['any-cloud-daytona', 'Daytona', 'npm install @tangle-network/agent-runtime @tangle-network/agent-provider-daytona'],
    ['any-cloud-computesdk', 'ComputeSDK', 'npm install @tangle-network/agent-runtime @tangle-network/agent-provider-computesdk computesdk @computesdk/e2b'],
    ['time-a-cold-start', 'Time a cold start'],
  ]],
];
export const subjects: ExampleSubject[] = grid.map(([id, label, install, ideas]) => ({
  id, label, install,
  ideas: ideas.map(([file, title, install]) => {
    const code = files[`../examples/${id}/${file}.mts`]
      ?.replace('The agent installs and drives a real browser inside its own machine.', "The agent drives the sandbox's own Chromium with Playwright.")
      .replace('plus the browser download', "plus Playwright's CDN")
      .replace('the disk stays and is all you pay for', 'the files stay and compute stops')
      .replace('status: completed, cancelled or budget_exhausted', 'status: completed, failed, cancelled or budget_exhausted');
    if (!code) throw new Error(`src/examples/${id}/${file}.mts is missing`);
    const key = `${id}/${file}`;
    const run = recorded(`./runs/${id}/${file}.json`, code);
    return { id: file, title, code, install, view: views[key],
      ...(key === 'sandboxes/python-csv' ? { output: { call: 'box.runCode' as const, title: 'Customer totals', columns: ['Customer', 'Total'] } } : {}),
      ...(key === 'sandboxes/run-code' ? { output: { call: 'box.exec' as const, title: 'Standard output' } } : {}),
      ...(key === 'sandboxes/browser-task' ? { timelineNoteAt: run?.events?.find(event => event.data?.part?.type === 'text' && event.data.part.text.includes('system Chromium available'))?.atMs } : {}),
      ...(key === 'sandboxes/branch-into-two' ? { lead: 'Both branches kept shared setup' } : {}),
      ...(key === 'sandboxes/stop-and-resume' ? { lead: 'notes.md survived the stop', stopped: 'files stay; compute stops', resumed: 'resumed with its files' } : {}),
      run };
  }),
}));
/** The example the editor opens on. */
export const initialExample = 'sandboxes/fix-a-test';

// One build-time chart and example payload for both sites.
const subject = subjects.find(subject => subject.id === 'fleets')!;
const idea = subject.ideas.find(idea => idea.id === 'cancel-on-cap')!;
const events = idea.run!.events!;
const spend = events.filter(event => event.name === 'spend');
const cancel = events.find(event => event.name === 'cancel')!;
const cap = Number(idea.code.match(/softCapUsd\s*=\s*([\d.]+)/)![1]);
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const last = spend.at(-1)!;
const top = Math.ceil(Math.max(cap, last.result.spentUsd) * 5) / 5; // the next $0.20 above the cap and the spend
const figure = timeSeries([{ id: 'spend', label: 'Fleet spend, USD', points: spend.map(event => ({ x: event.atMs + (event.durationMs ?? 0), y: event.result.spentUsd })) }], {
  x: { label: '', domain: [0, Math.ceil(idea.run!.ms / 100000) * 100000] },
  y: { label: 'Fleet spend, USD', unit: 'USD', domain: [0, top],
    ticks: [0, top / 2, top].map(at => ({ at, label: `$${at.toFixed(2)}` })),
    targets: [{ from: cap, to: cap, label: `softCapUsd = ${cap}`, kind: 'stretch' }] },
  marks: [{ at: cancel.atMs, label: `fleet.cancel() at ${clock(cancel.atMs)}, $${last.result.spentUsd.toFixed(2)}`, kind: 'event' }],
  formatX: clock, formatY: value => `$${value.toFixed(2)}`, legend: false, width: 720, dense: false,
});
if (isRefusal(figure)) throw new Error(JSON.stringify(figure));
export const budget = [{ ...subject, ideas: [{ ...idea, view: 'spend' as const, figure: renderFigure(figure, 1, { presentation: 'panel' }) }] }];
