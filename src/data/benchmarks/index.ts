import type { DomainBoard, ProfileRow } from './schema';
import taxResults from './results/tax.json';
import stripeResults from './results/stripe.json';

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
  status: 'live',
  lastRun: taxResults.generated,
  taskCount: 51,
  rows: taxResults.rows as ProfileRow[],
};

// Only benchmarks with real, complete runs ship. Domains that were still
// awaiting a first run (legal, vertical-app builds) or only had a partial
// sweep are not carried as placeholders — they return here when their held-out
// set is fully scored, produced by the eval runner, never hand-entered.

export const stripe: DomainBoard = {
  id: 'stripe',
  domain: 'Stripe API Integration',
  category: 'Coding',
  blurb:
    'Can an AI coding agent integrate real, CURRENT Stripe APIs? Twelve tasks built from Stripe\u2019s 2025\u20132026 platform changes \u2014 renamed enums, new endpoints and parameters, and removed legacy surfaces \u2014 where the pattern a model memorized now fails. Each task is graded by a hidden local mock that runs the agent\u2019s code against the real current contract. Agents have full tool access including live docs; the score is the share of tasks whose code actually works.',
  benchSource: 'Proprietary',
  by: 'Tangle \u00b7 VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden stdlib mock server implementing Stripe\u2019s current API contract (endpoints, required params, error shapes) including the trap a from-memory solution falls into. Pass = the agent\u2019s exported function executes correctly against the mock \u2014 never a model judging its own work. Every task is 3-way calibrated before admission (empty fails, a current-contract reference passes, the stale-memory solution fails on the intended trap).',
  tests: ['Checkout ui_mode enum rename', 'PaymentIntent confirm-with-surcharge', 'Test clock \u2014 attach existing customer', 'Invoice decimal quantities', 'Subscription pause + resume endpoint', 'Prebilled billing schedules', 'Fulfillment address from completion webhook', 'In-place Checkout cart update', 'Lifetime (forever) amount-off coupon', 'Next-renewal date after current_period removal', 'Detach + reassign invoice payment', 'Metered usage \u2192 billing meter events migration'],
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
