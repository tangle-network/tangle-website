import type { ExampleSubject } from '@tangle-network/ui/marketing';
import { sourceDigest } from '../../scripts/example-digest.mjs';

// Each cell shows one file from src/examples byte for byte; `pnpm check:examples`
// typechecks every file against the published packages.
const files = import.meta.glob<string>('../examples/*/*.mts', { query: '?raw', import: 'default', eager: true });
// Each file's recorded production run (scripts/record-examples.mts). A file whose record is missing or was
// recorded from other bytes gets no recorded output; `pnpm check:runs` fails the gate for both.
const records = import.meta.glob<{ source: { sha256: string }; run: { id: string; recordedAt: string; costUsd: number | null; sdk: Record<string, string> }; events: { atMs: number; durationMs?: number }[] }>(
  './runs/*/*.json', { import: 'default', eager: true });
const recordUrls = import.meta.glob<string>('./runs/*/*.json', { query: '?url&no-inline', import: 'default', eager: true });
const recorded = (path: string, code: string) => {
  const record = records[path];
  if (record?.source.sha256 !== sourceDigest(code)) return undefined;
  const { id, recordedAt, costUsd, sdk } = record.run;
  const ms = Math.max(0, ...record.events.map((event) => event.atMs + (event.durationMs ?? 0))); // how long the job took
  return { url: recordUrls[path], recordedAt, runId: id, sha: record.source.sha256, sdk: sdk['@tangle-network/sandbox'], costUsd, ms };
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
    ['worker', 'Run a long job'],
  ]],
  ['router', 'Router', 'npm install --save-dev tsx', [
    ['security-model', 'Use a security model'],
    ['review-a-route', 'Review an API route'],
  ]],
  ['evals', 'Evals', `${SANDBOX} @tangle-network/agent-eval`, [
    ['score-a-trace', 'Score an answer'],
    ['grade-replies', 'Grade support replies'],
    ['compare-models', 'Compare two models'],
    ['compare-harnesses', 'Compare coding agents'],
    ['regression-gate', 'Gate a prompt change'],
    ['what-did-it-do', 'Ask what the agent did'],
  ]],
  ['products', 'Products', SANDBOX, [
    ['legal-agent', 'One sandbox per customer'],
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
  ['runtime', 'Any cloud', `${SANDBOX} @tangle-network/agent-runtime @tangle-network/agent-provider-tangle`, [
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
    const code = files[`../examples/${id}/${file}.mts`];
    if (!code) throw new Error(`src/examples/${id}/${file}.mts is missing`);
    return { id: file, title, code, install, run: recorded(`./runs/${id}/${file}.json`, code) };
  }),
}));
/** The example the editor opens on. */
export const initialExample = 'sandboxes/fix-a-test';
