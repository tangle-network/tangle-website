// The rows /benchmarks prints, read from the committed snapshot of the production facts feed.
// `pnpm pull:benchmarks` (scripts/pull-sandbox-benchmarks.mjs) refreshes the snapshot; nothing here is authored.
import snapshot from './sandbox.json';

type Lane = (typeof snapshot.lanes)[keyof typeof snapshot.lanes];
export interface Row { label: string; value: number; whisker?: number | null; low?: number; high?: number; n?: number | string; flagged?: boolean; note?: string }

const lane = (name: keyof typeof snapshot.lanes): Lane => snapshot.lanes[name];
const verb = (l: Lane, journey: string, field: string, profile: string | null = null) => {
  const v = l.verbs.find((x) => x.journey === journey && x.field === field && (x.profile ?? null) === profile);
  if (!v) throw new Error(`benchmark snapshot: ${l.run_id} has no ${journey}.${field}${profile ? ` (${profile})` : ''}`);
  return v;
};
const row = (label: string, v: ReturnType<typeof verb>): Row => ({ label, value: v.p50_ms!, whisker: v.p95_ms, n: v.n, flagged: v.failed_rows > 0 });
export const day = (iso: string) => iso.slice(0, 10);
export const seconds = (ms: number) => (ms >= 10_000 ? `${(ms / 1000).toFixed(0)} s` : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

export const feed = { source: snapshot.source, published_at: snapshot.published_at, cohort: snapshot.cohort, percentiles: snapshot.percentiles };

// One sandbox: create, then its first command.
const matrix = lane('create-matrix');
export const firstCommand = {
  run: matrix,
  create: verb(matrix, 'create.first_command', 'create_ms'),
  exec: verb(matrix, 'create.first_command', 'first_exec_ms'),
  together: verb(matrix, 'create.first_command', 'create_to_first_command_ms'),
  cold: verb(matrix, 'provision.cold', 'provision_ms'),
  warm: verb(matrix, 'provision.warm_claim', 'provision_ms'),
};

// A fresh sandbox's first authenticated Router call, by the path the command took.
const call = lane('first-call');
export const firstCall = {
  run: call,
  rows: [
    row('exec', verb(call, 'create.first_call.exec', 'first_call_ms')),
    row('terminal shell', verb(call, 'create.first_call.terminal', 'first_call_ms')),
    row('direct to the runtime', verb(call, 'create.first_call.direct', 'first_call_ms')),
    row('startup script', verb(call, 'create.first_call.startup', 'first_call_ms')),
  ],
};

// Each harness, from its sandbox's create to the first text it streams back.
const text = lane('first-text');
export const firstText = {
  run: text,
  rows: [...text.first_text].sort((a, b) => a.p50_ms! - b.p50_ms!).map((f): Row => ({ label: f.harness, value: f.p50_ms!, whisker: f.p95_ms, n: f.n })),
};

// One sandbox through every lifecycle verb, in order.
const waterfall = lane('lifecycle-waterfall');
const steps: [string, string][] = [
  ['create', 'create_ms'], ['snapshot', 'snapshot_create_ms'], ['stop', 'stop_ms'], ['resume', 'resume_ms'], ['restore', 'restore_ms'],
  ['branch a child', 'branch_ms'], ['delete the child', 'delete_child_ms'], ['delete the snapshot', 'snapshot_delete_ms'], ['delete', 'delete_ms'],
];
export const lifecycle = {
  run: waterfall,
  rows: steps.map(([label, field]) => row(label, verb(waterfall, 'lifecycle.waterfall', field))),
  desktop: steps.map(([label, field]) => row(label, verb(waterfall, 'lifecycle.waterfall', field, 'desktop'))),
};

// Many sandboxes at once: creates in a burst, and children branched from one parent.
export const bursts = {
  run: matrix,
  rows: matrix.burst.map((b): Row => ({ label: `${b.size} creates at once`, value: b.p50_ms!, whisker: b.p90_ms, n: b.ok, flagged: b.ok < b.asked, note: `${b.ok} of ${b.asked} reached a first command; the whisker is p90` })),
};
const fanout = lane('branch-fanout');
export const branches = {
  run: fanout,
  rows: ([1, 4, 16] as const).map((k) => row(`${k} ${k === 1 ? 'child' : 'children'}`, verb(fanout, 'sandbox.branch_fanout', `branch_n${k}_first_command_ms`))),
  call: ([1, 4, 16] as const).map((k) => row(`${k} ${k === 1 ? 'child' : 'children'}`, verb(fanout, 'sandbox.branch_fanout', `branch_n${k}_ms`))),
};
const fork = lane('snapshot-fork');
export const forks = {
  rows: [
    { ...row('fork from a snapshot', verb(fork, 'snapshot.fork', 'provision_ms')), note: `${fork.run_id}, ${day(fork.started_at)}` },
    { ...row('fork from a checkpoint', verb(fanout, 'checkpoint.fork', 'provision_ms')), note: `${fanout.run_id}, ${day(fanout.started_at)}` },
  ],
};

// 100 at once, the ComputeSDK method, beside the public board measured the same way.
const b100 = lane('create-burst-100');
const tangleBurst = (l: Lane) => ({
  run_id: l.run_id, date: day(l.started_at), served_sha: l.served_sha,
  p50_ms: verb(l, 'create.burst_matched', 'burst_matched_n100_p50_ms').p50_ms!,
  p95_ms: verb(l, 'create.burst_matched', 'burst_matched_n100_p95_ms').p50_ms!,
  passed: l.records.passed > 0,
  failed_checks: l.failed_checks.map((c) => c.name),
});
export const burst100 = {
  computesdk: snapshot.computesdk,
  tangle: [tangleBurst(matrix), tangleBurst(b100)].sort((a, b) => b.date.localeCompare(a.date)),
};
