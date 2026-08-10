// Domain benchmark leaderboards. Each DOMAIN (Tax, Legal, CompanyBench, ...) is
// a leaderboard ranking agents on that domain's held-out tasks, where an agent
// is Agent = AgentProfile × runLoop × ExecutionEnvironment. This is the vals.ai
// shape: pick a domain, see which agent configurations win.
//
// HARD RULE: every row is a real measured run with provenance (n, date, source).
// A domain with runs pending renders "awaiting run", never a fabricated row.
// Rows are produced by the eval runner (scripts/run-domain-bench.mjs) which
// sweeps AgentProfiles through agent-eval's runEvalCampaign and exports here.

// A benchmarked agent is Agent = AgentProfile × runLoop × ExecutionEnvironment.
// Those are three DISTINCT things, never collapse them into one invented label:
//  - agentProfile: the AgentProfile identity (@tangle-network/agent-interface):
//    name(@version) + which of its axes (prompt|model|tools|mcp|resources|…) a
//    variant changed. A bare model call has NO profile → 'raw'.
//  - loop: the runLoop strategy that drove the model (single-shot, audit-steer,
//    supervised, harness-native).
//  - harness: the execution ENVIRONMENT the loop ran in, 'router' (direct API),
//    'opencode', 'claude-code', 'codex', 'sandbox'. This is the only thing the
//    logo keys on.
export interface ProfileRow {
  rank?: number; // filled at render, by score desc
  model: string; // model id, e.g. "gpt-5.6", "claude-sonnet-5"
  agentProfile?: string; // AgentProfile identity, e.g. "taxAgentProfile@baseline"; 'raw' when a bare model call with no profile
  profileAxes?: string[]; // AgentProfileDiffAxis[] changed vs baseline (prompt|model|tools|mcp|…), when this row is a profile variant
  loop?: string; // runLoop strategy: "single-shot" | "audit-steer" | "supervised" | "harness-native"
  method?: 'raw' | 'steered' | 'harness' | 'harness-steered' | 'optimized'; // coarse family, for grouping/colour on a unified chart
  harness?: string; // execution environment / backend: "router" | "opencode" | "claude-code" | "codex" | "sandbox"
  promptVersion?: string; // deprecated; superseded by loop/agentProfile. kept so older rows still parse
  score: number; // 0..1 blended domain score (mean across the n tasks)
  n: number; // graded tasks
  ciLow?: number; // 0..1 lower bound of the 95% CI of the mean (t, df=n-1), when per-task scores are available
  ciHigh?: number; // 0..1 upper bound of the 95% CI
  passRate?: number; // 0..1 honest-all-pass
  costUsd?: number; // $ per success, if measured
  date: string; // ISO run date
  profileHash?: string; // agent-eval agentProfileHash (identity)
  highlight?: boolean;
}

export type BenchSource = 'Proprietary' | 'Academic' | 'Industry Partner';

// Per-task breakdown, published WITHOUT the task's identity. The task suite is
// proprietary, so the public site shows how every profile did on each task
// (opaque label + difficulty) but never what the task is.
export interface PerTaskProfile {
  passRate: number; // 0..1
  n: number;
  meanCostUsd?: number;
  meanTokensIn?: number;
  meanTokensOut?: number;
  meanWallMs?: number;
}
// Stable column identity for the per-task heatmap (order = board rank).
export interface BoardProfile {
  profileId: string;
  harness: string;
  model: string;
}
export interface PerTaskBreakdown {
  label: string; // opaque task label, e.g. "01" — NEVER the task name
  difficulty?: 'medium' | 'hard' | 'extreme';
  byProfile: Record<string, PerTaskProfile>; // keyed by profileId; missing = no cell
}

export interface DomainBoard {
  id: string; // slug: "tax", "legal", "companybench"
  domain: string; // display name "Tax"
  // Company whose public API the task suite exercises, e.g. "Stripe". Present
  // only on API-integration suites; it opts the board into the Agent Readiness
  // Index (companies ranked by roster pass rate), so academic imports whose
  // tasks are not API integrations (TaxCalcBench) must leave it unset.
  company?: string;
  category: string; // "Finance", "Legal", "Coding", "Creative"
  blurb: string; // one line: what the tasks are
  benchSource: BenchSource; // provenance class, vals.ai-style
  by?: string; // who built the benchmark, e.g. "Column Tax"
  sourceUrl?: string; // link to the benchmark's own repo/site
  paperUrl?: string; // link to the paper, if any
  referenceUrl?: string; // public API or product documentation exercised by the suite
  referenceLabel?: string; // short public-document label
  scoredBy?: string; // one plain line on how a run is scored
  profiles?: BoardProfile[]; // stable column order for the per-task heatmap
  perTask?: PerTaskBreakdown[]; // opaque per-task breakdown (no task identity)
  source: string; // repo/scorecard the rows come from
  rows: ProfileRow[]; // ranked leaderboard; [] => awaiting run
  status: 'live' | 'partial' | 'awaiting-run';
  lastRun?: string; // ISO
  taskCount?: number; // how many held-out tasks in the suite
  metricLabel?: string; // "Blended score", "Pass rate"
  confidenceMethod?: string; // exact interval method for any published whiskers
}

export function benchmarkModelLabel(model: string): string {
  const labels: Record<string, string> = {
    sonnet: 'Claude Sonnet',
    'glm-5.1': 'GLM-5.1',
    'glm-5.2': 'GLM-5.2',
    'gpt-5-mini': 'GPT-5 mini',
  };
  return labels[model] ?? model;
}

export function benchmarkHarnessLabel(harness?: string): string {
  const labels: Record<string, string> = {
    'claude-code': 'Claude Code',
    opencode: 'OpenCode',
    pi: 'pi',
    router: 'Direct call',
  };
  return harness ? labels[harness] ?? harness : 'Direct call';
}

export function benchmarkProfileLabel(profileId?: string): string {
  if (!profileId || profileId === 'raw') return 'No profile';
  if (profileId === 'harness default') return 'Default profile';
  if (profileId.endsWith('@generic')) return 'Default reviewer';
  if (/^(?:cc|oc|pi)-/.test(profileId)) return 'No reviewer';
  return profileId;
}

export const INDIGO_RAMP = ['#4F46E5', '#6366F1', '#818CF8', '#A5AAFC', '#C7C9F5'];
export const SEMANTIC = { pass: '#818CF8', top: '#C7C9F5', fail: '#FB7185', pending: '#5E5E7A' };
