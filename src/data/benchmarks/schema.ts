// Domain benchmark suites. Each SUITE (TaxCalcBench, Stripe API Integration, ...)
// grades agents on that domain's held-out tasks, where an agent is
// Agent = AgentProfile × runLoop × ExecutionEnvironment.
//
// HARD RULE: every row is a real measured run with provenance (n, date, source).
// A domain with runs pending renders "awaiting run", never a fabricated row.
//
// The rule above is necessary but not sufficient. A row can carry n, a date and
// a source and still be unpublishable, because a single unrepeated sweep with
// overlapping confidence intervals ranks nothing. The publishing gates in
// ./standard.ts are the sufficient condition, and they are DERIVED from the run
// record rather than declared beside it. There is deliberately no hand-set
// `status` field on a suite: an earlier version of this module carried
// `status: 'live'` as a literal on seven suites that no gate would have passed,
// which is how unpublishable boards reached production.

// A benchmarked agent is Agent = AgentProfile × runLoop × ExecutionEnvironment.
// Those are three DISTINCT things, never collapse them into one invented label:
//  - agentProfile: the AgentProfile identity (@tangle-network/agent-interface):
//    name(@version) + which of its axes (prompt|model|tools|mcp|resources|…) a
//    variant changed. A bare model call has NO profile → 'raw'.
//  - loop: the runLoop strategy that drove the model (single-shot, audit-steer,
//    supervised, harness-native).
//  - harness: the execution ENVIRONMENT the loop ran in, 'router' (direct API),
//    'opencode', 'claude-code', 'codex', 'sandbox'.
export interface ProfileRow {
  model: string; // model id
  agentProfile?: string; // AgentProfile identity; 'raw' when a bare model call with no profile
  loop?: string; // runLoop strategy
  method?: 'raw' | 'steered' | 'harness' | 'harness-steered' | 'optimized';
  harness?: string; // execution environment
  score: number; // 0..1 blended domain score (mean across the n tasks)
  n: number; // graded tasks
  ciLow?: number; // 0..1 lower bound of the 95% CI of the mean
  ciHigh?: number; // 0..1 upper bound
  costUsd?: number; // $ per success, when measured
  date: string; // ISO run date
}

export type BenchSource = 'Proprietary' | 'Academic' | 'Industry Partner';

// Per-task breakdown, recorded WITHOUT the task's identity. The task suite is
// proprietary, so a run record shows how every profile did on each task
// (opaque label only) but never what the task is.
export interface PerTaskProfile {
  passRate: number; // 0..1
  n: number; // repetitions of this cell
  meanCostUsd?: number;
  meanTokensIn?: number;
  meanTokensOut?: number;
  meanWallMs?: number;
}

// Stable column identity for the task × configuration matrix.
export interface BoardProfile {
  profileId: string;
  harness: string;
  model: string;
}

export interface PerTaskBreakdown {
  label: string; // opaque task label, e.g. "01" — NEVER the task name
  byProfile: Record<string, PerTaskProfile>; // keyed by profileId; a missing key is a cell that never ran
}

// What the eval runner writes. Every field here is measured; nothing is authored.
export interface RunRecord {
  source: string; // repo or scorecard the rows come from
  generated: string; // ISO run date
  rows: ProfileRow[];
  profiles?: BoardProfile[]; // column order of the task × configuration matrix
  perTask?: PerTaskBreakdown[]; // omitted when the record carries aggregates only
  /**
   * Cells that ended in an infrastructure or harness failure rather than an
   * agent result, as counted by the runner. The runner must write this for the
   * "no harness failure" gate to be provable: absent, the gate reads "unproven"
   * and the ranking stays unpublished, because a sweep cannot be called clean by
   * a record that does not say. Present and zero, with every graded cell
   * carrying a model call, is what clears the gate.
   */
  harnessFailures?: number;
}

// What a human writes: what the suite is and how a pass is decided. No results,
// no status, no counts — every number on the page comes from the run record.
export interface Suite {
  id: string; // slug
  domain: string; // display name
  category: string;
  blurb: string; // what the tasks are
  benchSource: BenchSource;
  by: string; // who built the suite
  sourceUrl?: string;
  paperUrl?: string;
  scoredBy: string; // how one task is graded
  metricLabel: string; // what the withheld score measures
  /**
   * A coverage fact about the sweep that the runner did not write into the run
   * record, attributed where it is stated. It is deliberately NOT read by the
   * gates in ./standard.ts: a gate stays a pure function of measured data, and
   * human-recorded context sits beside it rather than inside it.
   */
  coverageNote?: string;
  run: RunRecord; // the measured run this suite's assessment is derived from
}
