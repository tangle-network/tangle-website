import type { DomainBoard } from './schema';

// Domain leaderboards, vals.ai structure: an index of benchmarks grouped by
// category, each clicking into a detail page with a ranked bar chart of every
// agent profile. Rows come from real eval runs (scripts/run-domain-bench.mjs);
// domains not yet swept render 'awaiting run', never fabricated rows.

export const tax: DomainBoard = {
  id: 'tax',
  domain: 'TaxEval',
  category: 'Finance',
  blurb: 'Complex individual and business returns, multi-form reasoning, citation to code sections.',
  benchSource: 'Proprietary',
  target: 0.8,
  metricLabel: 'Blended score',
  source: 'tax-agent tests/eval/.runs/canonical-2026-05-20 (scores.json, per-variant)',
  status: 'partial',
  lastRun: '2026-05-20',
  taskCount: 37,
  rows: [
    // Real per-variant means from the canonical run: same model, two prompt
    // profiles across 37 personas. This is AgentProfile variation (prompt).
    { model: 'gpt-5.4', harness: 'tax-agent', promptVersion: 'source-grounded-v1', score: 0.831, n: 37, passRate: 0.568, date: '2026-05-20', highlight: true },
    { model: 'gpt-5.4', harness: 'tax-agent', promptVersion: 'baseline-generic', score: 0.824, n: 37, passRate: 0.568, date: '2026-05-20' },
  ],
};

export const creative: DomainBoard = {
  id: 'creative',
  domain: 'CreativeEval',
  category: 'Creative',
  blurb: 'Brand, copy, and design generation scored against held-out briefs.',
  benchSource: 'Proprietary',
  target: 0.8,
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
  target: 0.8,
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
  target: 0.8,
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
