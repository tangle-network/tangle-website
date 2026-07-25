import type { DomainBoard, ProfileRow, PerTaskBreakdown, BoardProfile } from './schema';
import taxResults from './results/tax.json';
import stripeResults from './results/stripe.json';

// Domain leaderboards, vals.ai structure: an index of benchmarks grouped by
// category, each clicking into a detail page with a ranked bar chart of every
// agent profile. Rows come from real eval runs (scripts/run-domain-bench.mjs);
// domains not yet swept render 'awaiting run', never fabricated rows.

// ONE TaxCalcBench board with every agent configuration on it: raw model calls,
// raw+steer, and coding harnesses (their own agentic loop with tools), coloured
// by method and ranked. Each bar carries its own n and 95% CI (coverage differs).
// The honest reads (spread is driven by base-model strength; harnesses each run a
// different model so it ranks configurations, not a controlled ablation) live in
// the blurb + the chart note.
export const tax: DomainBoard = {
  id: 'tax',
  domain: 'TaxCalcBench',
  category: 'Finance',
  blurb: 'Can an AI fill out a real US tax return correctly? TaxCalcBench gives the model a taxpayer’s W-2s, 1099s and details, and asks it to produce the complete Form 1040. Every line it computes is checked against the correct return, and the score is the share of lines it gets right.',
  benchSource: 'Academic',
  by: 'Column Tax',
  sourceUrl: 'https://github.com/column-tax/tax-calc-bench',
  paperUrl: 'https://arxiv.org/abs/2507.16126',
  scoredBy: 'Each return is graded line-by-line against the correct 1040 (Column Tax’s own scorer).',
  metricLabel: 'By-line accuracy',
  source: taxResults.source,
  status: 'live',
  lastRun: taxResults.generated,
  taskCount: 51,
  rows: taxResults.rows as ProfileRow[],
};

// Only benchmarks with real, complete runs ship. Domains that were still
// awaiting a first run (legal, vertical-app builds) or only had a partial
// sweep are not carried as placeholders. they return here when their held-out
// set is fully scored, produced by the eval runner, never hand-entered.

export const stripe: DomainBoard = {
  id: 'stripe',
  domain: 'Stripe API Integration',
  company: 'Stripe',
  category: 'Coding',
  blurb:
    'Twelve coding tasks built from real Stripe API changes in 2025 and 2026, each graded by running the agent code against Stripe current contract.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden mock server implementing Stripe current API contract (endpoints, required params, error shapes) including the trap a from-memory solution falls into. Pass means the agent code executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: stripeResults.profiles as BoardProfile[],
  perTask: stripeResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  source: stripeResults.source,
  status: 'live',
  lastRun: stripeResults.generated,
  taskCount: 12,
  rows: stripeResults.rows as ProfileRow[],
};

export const boards: DomainBoard[] = [tax, stripe];

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
