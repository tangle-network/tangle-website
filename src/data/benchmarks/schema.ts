// AgentProfile benchmarks: agents scored on task DOMAINS (tax, legal, creative,
// gtm, ...). Every benchmark run becomes data here, rendered by the reusable
// chart components in src/components/charts. Add a benchmark by adding data.
//
// HARD RULE: every score comes from a real eval run and carries provenance
// (source, date, n). A domain with no baseline renders an explicit "awaiting
// run" state — never a fabricated number.

export type DomainStatus = 'above-target' | 'below-target' | 'measurement-repair' | 'no-baseline';

// one AgentProfile's score on one task domain
export interface DomainScore {
  domain: string; // "Tax", "Legal", "Creative"
  score: number | null; // 0..1, null when no baseline / in repair
  target: number; // pass bar
  n: number; // sample size
  status: DomainStatus;
  note?: string;
}

// a verification-layer breakdown (VerticalBench: install/typecheck/build/...)
export interface LayerStat {
  layer: string;
  passRate: number; // 0..1
  pass: number;
  fail: number;
  skipped: number;
}

// a full benchmark: an AgentProfile (or model) measured across domains/layers
export interface AgentBenchmark {
  id: string;
  title: string;
  subtitle: string;
  agentProfile: {
    harness?: string;
    model?: string;
    systemPrompt?: string;
  };
  domains: DomainScore[];
  layers?: LayerStat[];
  // provenance — required
  source: string;
  date: string;
  method: string;
  sessionCount?: number;
}

// indigo ramp for bars (single hue, luminance variation)
export const INDIGO_RAMP = ['#4F46E5', '#6366F1', '#818CF8', '#A5AAFC', '#C7C9F5'];
export const SEMANTIC = {
  good: '#4F46E5', goodEdge: '#818CF8',
  pending: '#5E5E7A', fail: '#BE123C', failLight: '#FB7185',
  pass: '#047857', passLight: '#6EE7B7',
};

export const statusColor: Record<DomainStatus, string> = {
  'above-target': '#818CF8',
  'below-target': '#FB7185',
  'measurement-repair': '#5E5E7A',
  'no-baseline': '#3A3A50',
};
