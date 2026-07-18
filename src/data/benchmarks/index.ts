import type { DomainBoard, ProfileRow } from './schema';
import taxResults from './results/tax.json';

// Domain leaderboards, vals.ai structure: an index of benchmarks grouped by
// category, each clicking into a detail page with a ranked bar chart of every
// agent profile. Rows come from real eval runs (scripts/run-domain-bench.mjs);
// domains not yet swept render 'awaiting run', never fabricated rows.

// ONE TaxCalcBench board with every agent configuration on it — raw model calls,
// raw+steer, and coding harnesses (their own agentic loop with tools) — coloured
// by method and ranked. Each bar carries its own n and 95% CI (coverage differs).
// The honest reads (spread is driven by base-model strength; harnesses each run a
// different model so it ranks configurations, not a controlled ablation) live in
// the blurb + the chart note.
export const tax: DomainBoard = {
  id: 'tax',
  domain: 'TaxCalcBench',
  category: 'Finance',
  blurb: 'Can an AI fill out a real US tax return correctly? TaxCalcBench gives the model a taxpayer’s W-2s, 1099s and details, and asks it to produce the complete Form 1040. Every line it computes is checked against the correct return — the score is the share of lines it gets right.',
  benchSource: 'Academic',
  by: 'Column Tax',
  sourceUrl: 'https://github.com/column-tax/tax-calc-bench',
  paperUrl: 'https://arxiv.org/abs/2507.16126',
  scoredBy: 'Each return is graded line-by-line against the correct 1040 (Column Tax’s own scorer).',
  tests: ['Multiple W-2s', '1099 interest, dividends & unemployment', 'Schedule C business profit / loss', 'Capital gains & wash sales', 'Dependents, Child Tax Credit & EITC', 'QBI & excess Social Security tax', 'Marketplace 1095-A, education & retirement'],
  metricLabel: 'By-line accuracy',
  source: taxResults.source,
  status: 'partial',
  lastRun: taxResults.generated,
  taskCount: 31,
  rows: taxResults.rows as ProfileRow[],
};

export const creative: DomainBoard = {
  id: 'creative',
  domain: 'CreativeEval',
  category: 'Creative',
  blurb: 'Brand, copy, and design generation scored against held-out briefs.',
  benchSource: 'Proprietary',
  metricLabel: 'Blended score',
  source: 'agent-eval/.evolve/scorecard.json (round 1)',
  status: 'partial',
  lastRun: '2026-05-21',
  taskCount: 24,
  rows: [
    { model: 'claude-sonnet-5', harness: 'blueprint-agent', score: 0.866, n: 24, date: '2026-05-21', highlight: true },
  ],
};

export const legal: DomainBoard = {
  id: 'legal',
  domain: 'LegalEval',
  category: 'Legal',
  blurb: 'Contract review, case management workflows, jurisdiction-aware drafting.',
  benchSource: 'Proprietary',
  metricLabel: 'Blended score',
  source: 'legal-agent tests/eval/canonical.ts',
  status: 'awaiting-run',
  taskCount: 36,
  rows: [],
};

export const companybench: DomainBoard = {
  id: 'companybench',
  domain: 'CompanyBench',
  category: 'Coding',
  blurb: 'Agent-built vertical apps scored install → typecheck → build → serve → semantic across verticals.',
  benchSource: 'Proprietary',
  metricLabel: 'Honest all-pass',
  source: 'blueprint-agent/.evolve/verticalbench',
  status: 'awaiting-run',
  taskCount: 27,
  rows: [],
};

export const boards: DomainBoard[] = [tax, creative, legal, companybench];

// grouped by category for the index page
export function boardsByCategory(): { category: string; boards: DomainBoard[] }[] {
  const map = new Map<string, DomainBoard[]>();
  for (const b of boards) {
    if (!map.has(b.category)) map.set(b.category, []);
    map.get(b.category)!.push(b);
  }
  return [...map.entries()].map(([category, boards]) => ({ category, boards }));
}

export function boardById(id: string): DomainBoard | undefined {
  return boards.find((b) => b.id === id);
}
