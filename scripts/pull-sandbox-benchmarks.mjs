// Pull the sandbox benchmarks into src/data/benchmarks/sandbox.json from the production facts feed,
// https://facts.tangle.tools/sandbox.json (agent-container tools/sandbox-facts).
//
// Every number comes from the feed's raw records over the last 7 days: production, Docker, not skipped, and marked CLEAN,
// so a sample taken while a release landed counts nowhere. Failed attempts that recorded a time stay in.
// A new chart is one entry in `panels`; the page draws whatever is here. The headline's new sandbox pools the By region create rows.
import { writeFileSync } from 'node:fs';

const FACTS_URL = 'https://facts.tangle.tools/sandbox.json';
const OUT = new URL('../src/data/benchmarks/sandbox.json', import.meta.url);
const WINDOW_MS = 7 * 864e5;

const res = await fetch(FACTS_URL);
if (!res.ok) throw new Error(`${FACTS_URL}: ${res.status}`);
const facts = await res.json();

const clean = facts.daily_matrix.runs
  .flatMap((run) => run.records)
  .filter((r) => r.target === 'production' && !r.skipped && r.host_agent_runtime_backend !== 'firecracker' && r.tags?.includes('sample:CLEAN'));
const to = clean.map((r) => r.timestamp).sort().at(-1);
const from = new Date(Date.parse(to) - WINDOW_MS).toISOString();
const recent = clean.filter((r) => r.timestamp >= from);

// Nearest rank, as the feed computes it, with the distribution-free 95% interval from the binomial ranks.
const pick = (sorted, rank) => sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
const quantile = (sorted, q) => {
  const n = sorted.length, half = 1.96 * Math.sqrt(n * q * (1 - q));
  return { value: pick(sorted, Math.ceil(q * n) - 1), band: [pick(sorted, Math.floor(n * q - half) - 1), pick(sorted, Math.ceil(n * q + half))] };
};
const stats = (values) => {
  const sorted = values.filter((v) => v > 0).map(Math.round).sort((a, b) => a - b);
  if (sorted.length < 3) return null;
  const p50 = quantile(sorted, 0.5), p95 = sorted.length >= 5 ? quantile(sorted, 0.95) : null;
  return { n: sorted.length, p50: p50.value, p50_band: p50.band, p95: p95?.value ?? null, p95_band: p95?.band ?? null };
};
const row = (label, records, field, extra = {}) => {
  const s = stats(records.map((r) => r[field]));
  return s && { label, ...s, attempts: records.length, failed: records.filter((r) => !r.pass).length, ...extra };
};
const present = (rows) => rows.filter(Boolean);
const journey = (name, where = () => true) => recent.filter((r) => r.journey === name && where(r));
const steps = (records, fields) => present(fields.map(([label, field]) => row(label, records, field)));

const AGENTS = {
  codex: ['Codex', '/images/harness/codex.png'], prime: ['Prime Agent', '/images/harness/prime-agent.png'], 'claude-code': ['Claude Code', '/images/harness/claude-code.svg'],
  pi: ['Pi', '/images/harness/pi.svg'], 'factory-droids': ['Factory Droid'], opencode: ['OpenCode', '/images/harness/opencode.svg'], 'kimi-code': ['Kimi Code', '/images/harness/kimi-code.png'],
  hermes: ['Hermes', '/images/harness/hermes.png'], acp: ['ACP'], openclaw: ['OpenClaw', '/images/harness/openclaw.png'],
};
const byAgent = (records, field) => present(Object.entries(AGENTS).map(([id, [label, logo]]) => row(label, records.filter((r) => r.backend_type === id), field, logo ? { logo } : {}))).sort((a, b) => a.p50 - b.p50);

const LIFECYCLE = [['Create', 'create_ms'], ['Snapshot', 'snapshot_create_ms'], ['Stop', 'stop_ms'], ['Resume', 'resume_ms'], ['Restore', 'restore_ms'], ['Branch', 'branch_ms'], ['Delete child', 'delete_child_ms'], ['Delete snapshot', 'snapshot_delete_ms'], ['Delete', 'delete_ms']];
const lifecycle = (profile) => steps(journey('lifecycle_waterfall', (r) => r.sandbox_profile === profile), LIFECYCLE);
const replies = journey('sandbox_run_stream');
const firstText = replies.filter((r) => r.benchmark_preset === 'first-text');
const firstCommand = journey('create_first_command');
const fanout = journey('branch_fanout');
const region = (label, name, field) => ['eu1', 'us1'].map((cell) => row(`${label}, ${cell}`, journey(name, (r) => r.cell === cell), field));
const firstCall = (label, path) => row(label, journey('first_call', (r) => r.scenario_id?.startsWith(`first-call.${path}.`)), 'first_call_ms');
const size = (name) => row(name[0].toUpperCase() + name.slice(1), journey(`compute.size.${name}`), 'operation_ms');
const bursts = facts.lanes['create-burst'].burst.filter((b) => b.runtime_backend !== 'firecracker').map((b) => ({ label: `${b.size} at once`, n: b.ok, p50: Math.round(b.p50_ms), p50_band: null, p95: null, p95_band: null, attempts: b.asked, failed: b.asked - b.ok, p90: Math.round(b.p90_ms) }));
const hundred = stats(recent.map((r) => r.burst_matched_n100_p50_ms));

const firstReplies = byAgent(firstText, 'create_to_first_text_ms');
const panels = [
  { title: 'Lifecycle, base image', rows: lifecycle('plain') },
  { title: 'Lifecycle, desktop image', rows: lifecycle('desktop') },
  { title: 'By region', rows: present([...region('Create', 'sandbox_create', 'provision_ms'), ...region('First command', 'create_first_command', 'create_to_first_command_ms'), ...region('Fork', 'snapshot_fork', 'provision_ms'), ...region('First reply', 'sandbox_run_stream', 'create_to_first_text_ms')]) },
  { title: 'First reply, from create', rows: firstReplies },
  { title: 'First reply, sandbox running', rows: byAgent(replies, 'turn_first_text_ms') },
  { title: 'Inside an agent turn', rows: steps(replies, [['Open the stream', 'sse_connect_ms'], ['Start the run', 'turn_agent_run_start_ms'], ['Spawn the agent', 'turn_harness_spawn_ms'], ['Agent ready', 'turn_harness_ready_ms'], ['First model request', 'turn_first_model_request_ms'], ['First model byte', 'turn_first_upstream_byte_ms'], ['First token', 'first_token_ms'], ['First text', 'turn_first_text_ms'], ['Text reaches you', 'first_text_transit_ms'], ['Task complete', 'task_complete_ms']]) },
  { title: 'Inside create', rows: steps(journey('sandbox_create'), [['Pick a host', 'host_select_ms'], ['Sign the token', 'mint_wait_ms'], ['Worker checks', 'worker_preflight_ms'], ['Host starts it', 'host_create_route_ms'], ['Orchestrator', 'orchestrator_ms'], ['Ready', 'provision_ms']]) },
  { title: 'First model call', rows: present([firstCall('Direct', 'direct'), firstCall('Exec', 'exec'), firstCall('Terminal', 'terminal'), firstCall('Startup script', 'startup')]) },
  { title: 'Snapshots and checkpoints', rows: present([row('Snapshot', journey('snapshot_fork'), 'snapshot_create_ms'), row('Fork a snapshot', journey('snapshot_fork'), 'provision_ms'), row('Checkpoint', journey('checkpoint_fork'), 'checkpoint_create_ms'), row('Fork a checkpoint', journey('checkpoint_fork'), 'provision_ms')]) },
  { title: 'First command', span: 3, rows: steps(firstCommand, [['Create', 'create_ms'], ['Run it', 'first_exec_ms'], ['Both', 'create_to_first_command_ms']]) },
  { title: 'Create by size', span: 3, rows: present(['nano', 'small', 'medium', 'large'].map(size)) },
  { title: 'Branching', span: 3, rows: present([1, 4, 16].flatMap((k) => row(`${k} ${k === 1 ? 'child' : 'children'}`, fanout, `branch_n${k}_first_command_ms`))) },
  { title: 'Many at once', span: 3, rows: [...bursts, ...(hundred ? [{ label: '100 at once', ...hundred, attempts: hundred.n, failed: 0 }] : [])] },
];

const PASS_LABELS = { 'lifecycle-waterfall': 'Lifecycle', 'first-call': 'First model call', 'snapshot-fork': 'Snapshot forks', quality: 'Compute checks', 'first-text': 'First reply', 'branch-fanout': 'Branching', 'staging-benchmark': 'Full suite', 'create-matrix': 'Create matrix' };
const wilson = (k, n) => {
  const z = 1.96, p = k / n, d = 1 + z ** 2 / n, c = (p + z ** 2 / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + z ** 2 / (4 * n ** 2))) / d;
  return { lower: Math.max(0, c - h), upper: Math.min(1, c + h) };
};
const passed = Object.entries(PASS_LABELS)
  .map(([preset, label]) => {
    const records = recent.filter((r) => r.benchmark_preset === preset), k = records.filter((r) => r.pass).length;
    return records.length ? { label, rate: k / records.length, passed: k, attempts: records.length, ...wilson(k, records.length) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => b.rate - a.rate);

const days = [...new Set(clean.map((r) => r.timestamp.slice(0, 10)))].sort();
const trend = (title, name, field) => ({ title, days: days.flatMap((day) => { const s = stats(clean.filter((r) => r.journey === name && r.timestamp.startsWith(day)).map((r) => r[field])); return s?.p95 ? [{ day, n: s.n, p50: s.p50, p95: s.p95 }] : []; }) });

const find = (title, label) => panels.find((p) => p.title === title).rows.find((r) => r.label === label);
const rateCard = facts.rate_card.find((r) => r.route === '/v1/pricing/sandboxes');
if (rateCard?.status !== 200) throw new Error('facts feed carries no sandbox rate card');

const out = {
  rate_card: { ...rateCard.body.pools.general, source: rateCard.url, fetched_at: rateCard.fetched_at },
  source: FACTS_URL,
  window: { from, to, samples: recent.length },
  headline: [['New sandbox', row('New sandbox', journey('sandbox_create'), 'provision_ms')], ['First command', find('First command', 'Both')], ['First agent reply', firstReplies[0]], ['Resume', find('Lifecycle, base image', 'Resume')], ['Fork a snapshot', find('Snapshots and checkpoints', 'Fork a snapshot')], ['16 branches', find('Branching', '16 children')]].map(([label, r]) => ({ label, p50: r.p50, p95: r.p95 })),
  panels,
  memory: byAgent(firstText, 'peak_memory_mb'),
  passed,
  trends: [trend('New sandbox, daily', 'lifecycle_waterfall', 'create_ms'), trend('First reply, daily', 'sandbox_run_stream', 'create_to_first_text_ms'), trend('Fork a snapshot, daily', 'snapshot_fork', 'provision_ms')],
};
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${OUT.pathname}: ${recent.length} clean samples from ${from.slice(0, 10)} to ${to.slice(0, 10)}, ${panels.length} panels, feed published ${facts.published_at}`);
