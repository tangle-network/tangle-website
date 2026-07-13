// Domain benchmark leaderboards. Each DOMAIN (Tax, Legal, CompanyBench, ...) is
// a leaderboard ranking many AgentProfile combinations (model × harness ×
// prompt) on that domain's held-out tasks. This is the vals.ai shape: pick a
// domain, see which agent configurations win.
//
// HARD RULE: every row is a real measured run with provenance (n, date, source).
// A domain with runs pending renders "awaiting run", never a fabricated row.
// Rows are produced by the eval runner (scripts/run-domain-bench.mjs) which
// sweeps AgentProfiles through agent-eval's runEvalCampaign and exports here.

export interface ProfileRow {
  rank?: number; // filled at render, by score desc
  model: string; // dated snapshot, e.g. "claude-sonnet-5@2026-05-01"
  harness?: string; // "blueprint-agent", "opencode", ...
  promptVersion?: string;
  score: number; // 0..1 blended domain score
  n: number; // graded tasks
  passRate?: number; // 0..1 honest-all-pass
  costUsd?: number; // $ per success, if measured
  date: string; // ISO run date
  profileHash?: string; // agent-eval agentProfileHash (identity)
  highlight?: boolean;
}

export type BenchSource = 'Proprietary' | 'Academic' | 'Industry Partner';

export interface DomainBoard {
  id: string; // slug: "tax", "legal", "companybench"
  domain: string; // display name "Tax"
  category: string; // "Finance", "Legal", "Coding", "Creative"
  blurb: string; // one line: what the tasks are
  benchSource: BenchSource; // provenance class, vals.ai-style
  target: number; // pass bar (e.g. 0.8)
  source: string; // repo/scorecard the rows come from
  rows: ProfileRow[]; // ranked leaderboard; [] => awaiting run
  status: 'live' | 'partial' | 'awaiting-run';
  lastRun?: string; // ISO
  taskCount?: number; // how many held-out tasks in the suite
  metricLabel?: string; // "Blended score", "Pass rate"
}

export const INDIGO_RAMP = ['#4F46E5', '#6366F1', '#818CF8', '#A5AAFC', '#C7C9F5'];
export const SEMANTIC = { pass: '#818CF8', top: '#C7C9F5', fail: '#FB7185', pending: '#5E5E7A' };
