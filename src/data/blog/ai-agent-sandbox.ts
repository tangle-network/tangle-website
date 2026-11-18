// The figures in /blog/ai-agent-sandbox. All three are rows from the site's sandbox benchmark, served at
// https://tangle.tools/benchmarks/, for the window 2026-11-02 16:25 UTC to 2026-11-09 16:25 UTC. Values are copied
// from that window's data without rounding, converted from milliseconds to seconds. The window's 11,066 samples count
// every measure together; each row below carries its own sample count.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const BENCHMARKS = { label: 'Tangle sandbox benchmarks', href: 'https://tangle.tools/benchmarks/' };
const PERIOD = '2 Nov 2026 16:25 UTC to 9 Nov 2026 16:25 UTC';

type Provenance = { unit: string; method: string };

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : {
        ...figure,
        status: 'measured' as const,
        period: PERIOD,
        unit: p.unit,
        note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, BENCHMARKS],
      };

const seconds = (value: number) => `${value.toFixed(value < 10 ? 2 : 1)} s`;

/** Lifecycle timings: a new sandbox, a resume, a fork from a snapshot, and branching into 16 children. */
export const lifecycle = provenance(
  metricBars(
    [
      { id: 'ready-p50', label: 'New sandbox, p50', value: 1.543, observations: { count: 393, label: 'creates' }, detail: 'p95 12.35 s' },
      { id: 'ready-p95', label: 'New sandbox, p95', value: 12.354, observations: { count: 393, label: 'creates' } },
      { id: 'resume-p50', label: 'Resume, p50', value: 4.717, observations: { count: 194, label: 'resumes' }, detail: 'p95 10.7 s' },
      { id: 'resume-p95', label: 'Resume, p95', value: 10.708, observations: { count: 194, label: 'resumes' } },
      { id: 'fork-p50', label: 'Fork a snapshot, p50', value: 1.852, observations: { count: 425, label: 'forks' }, detail: 'p95 16.8 s' },
      { id: 'fork-p95', label: 'Fork a snapshot, p95', value: 16.799, observations: { count: 425, label: 'forks' } },
      { id: 'branch16-p50', label: '16 children, p50', value: 12.686, observations: { count: 147, label: 'branch calls' }, detail: 'p95 36.8 s' },
      { id: 'branch16-p95', label: '16 children, p95', value: 36.763, observations: { count: 147, label: 'branch calls' } },
    ],
    { measure: 'seconds until the sandbox is ready', unit: '', domain: [0, 40], formatValue: seconds, width: 720, id: 'sandbox-lifecycle-percentiles' },
  ),
  1,
  {
    unit: 'seconds',
    method:
      'Rows from the benchmark panels "Inside create" (Ready: 393 timings; the panel had 425 attempts, 56 failed), ' +
      '"Lifecycle, base image" (Resume: 194 timings; 209 attempts, 31 failed), "Snapshots and checkpoints" (Fork a snapshot: ' +
      '425 timings; 506 snapshot and fork attempts, 82 failed) and "Branching" (16 children: 147 timings; 226 attempts, 87 failed). ' +
      'Failures are counted per panel attempt; the percentiles cover the steps that returned a timing, so timings plus failures ' +
      'need not equal attempts. The benchmark data does not record which runtime its runs used. These are our own ' +
      'measurements and are not comparable with start times other providers publish.',
  },
);

/** Time from the create call to the coding agent's first reply, for the agents readers ask about most. */
export const firstReply = provenance(
  metricBars(
    [
      { id: 'droid-p50', label: 'Factory Droid, p50', value: 2.901, observations: { count: 42, label: 'replies' }, detail: 'p95 10.9 s' },
      { id: 'droid-p95', label: 'Factory Droid, p95', value: 10.877, observations: { count: 42, label: 'replies' } },
      { id: 'codex-p50', label: 'Codex, p50', value: 3.264, observations: { count: 44, label: 'replies' }, detail: 'p95 18.1 s' },
      { id: 'codex-p95', label: 'Codex, p95', value: 18.067, observations: { count: 44, label: 'replies' } },
      { id: 'claude-p50', label: 'Claude Code, p50', value: 3.375, observations: { count: 45, label: 'replies' }, detail: 'p95 11.8 s' },
      { id: 'claude-p95', label: 'Claude Code, p95', value: 11.751, observations: { count: 45, label: 'replies' } },
      { id: 'opencode-p50', label: 'OpenCode, p50', value: 7.44, observations: { count: 45, label: 'replies' }, detail: 'p95 19.1 s' },
      { id: 'opencode-p95', label: 'OpenCode, p95', value: 19.136, observations: { count: 45, label: 'replies' } },
    ],
    { measure: 'seconds from create to first reply', unit: '', domain: [0, 20], formatValue: seconds, width: 720, id: 'sandbox-first-reply' },
  ),
  2,
  {
    unit: 'seconds',
    method:
      'Rows from the benchmark panel "First reply, from create": the clock starts at the create call and stops at the coding ' +
      'agent\'s first reply. Attempts: Factory Droid 45 (3 failed), Codex 47 (3 failed), Claude Code 48 (3 failed), OpenCode 48 ' +
      '(3 failed). The panel has ten rows; the benchmarks page lists the rest, from Prime Agent at 3.3 s to OpenClaw at 25.1 s ' +
      'at the median. With the sandbox already running ("First reply, sandbox running"), the medians were Codex 0.66 s, ' +
      'Claude Code 1.06 s and OpenCode 3.4 s. The first reply includes the model\'s own latency.',
  },
);

/** Share of benchmark attempts that failed, by measure. */
export const failures = provenance(
  metricBars(
    [
      { id: 'inside-create', label: 'Inside create', value: (56 / 425) * 100, observations: { count: 425, label: 'attempts' }, detail: '56 failed' },
      { id: 'lifecycle', label: 'Lifecycle, base image', value: (31 / 209) * 100, observations: { count: 209, label: 'attempts' }, detail: '31 failed' },
      { id: 'snapshots', label: 'Snapshots', value: (82 / 506) * 100, observations: { count: 506, label: 'attempts' }, detail: '82 failed' },
      { id: 'branching', label: 'Branching', value: (87 / 226) * 100, observations: { count: 226, label: 'attempts' }, detail: '87 failed' },
    ],
    { measure: 'attempts that failed', unit: '', domain: [0, 50], formatValue: (value) => `${Math.round(value)}%`, width: 720, id: 'sandbox-failed-attempts' },
  ),
  3,
  {
    unit: 'percent of attempts in the benchmark',
    method:
      'Failed attempts divided by attempts, per benchmark panel: "Inside create" 56 of 425, "Lifecycle, base image" 31 of 209, ' +
      '"Snapshots and checkpoints" (snapshot and fork) 82 of 506, "Branching" 87 of 226. The benchmark data does not record whether ' +
      'a failure came from the platform or from the benchmark\'s own client, so these are failed attempts in our test, not a ' +
      'service level. Read the benchmarks page for the current window.',
  },
);

export const sandboxFigures = [lifecycle, firstReply, failures];
