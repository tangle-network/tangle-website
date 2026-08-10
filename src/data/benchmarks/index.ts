import type { DomainBoard, ProfileRow, PerTaskBreakdown, BoardProfile } from './schema';
import taxResults from './results/tax.json';
import stripeResults from './results/stripe.json';
import calcomResults from './results/calcom.json';
import posthogResults from './results/posthog.json';
import plausibleResults from './results/plausible.json';
import svixResults from './results/svix.json';
import directusResults from './results/directus.json';

const WILSON_CONFIDENCE = '95% Wilson interval for observed pass/fail outcomes; each configuration shows its own sample size.';

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
  blurb: 'US tax return benchmark: Can an AI complete a held-out US tax-return case correctly? TaxCalcBench gives the model a taxpayer’s W-2s, 1099s, and details, then asks it to produce the complete Form 1040. Every line it computes is checked against Column Tax’s reference 1040 for that held-out case, and the score is its by-line accuracy.',
  benchSource: 'Academic',
  by: 'Column Tax',
  sourceUrl: 'https://github.com/column-tax/tax-calc-bench',
  paperUrl: 'https://arxiv.org/abs/2507.16126',
  scoredBy: 'Each held-out return is graded line-by-line against Column Tax’s reference 1040 for that case. Chart cost is the mean recorded cost per return in the published run data.',
  metricLabel: 'By-line accuracy',
  costLabel: 'mean cost/return',
  confidenceMethod: '95% Student-t interval across the 51 per-return by-line accuracy scores.',
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
    'Twelve coding tasks built from documented Stripe API changes in 2025 and 2026. Each run is checked against the suite\'s versioned mock contract as it existed on the published run date.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  referenceUrl: 'https://docs.stripe.com/api/versioning',
  referenceLabel: 'Stripe API versioning',
  scoredBy:
    'Each task is graded by a hidden mock server implementing the Stripe contract recorded for this benchmark run (endpoints, required params, error shapes), including the trap a from-memory solution falls into. Pass means the agent code executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: stripeResults.profiles as BoardProfile[],
  perTask: stripeResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: stripeResults.source,
  status: 'live',
  lastRun: stripeResults.generated,
  taskCount: 12,
  rows: stripeResults.rows as ProfileRow[],
};

export const calcom: DomainBoard = {
  id: 'calcom',
  domain: 'Cal.com Bookings v2',
  company: 'Cal.com',
  category: 'Coding',
  blurb:
    'Two coding tasks that implement a client for the Cal.com Bookings API v2. The required versioned headers and response envelope differ from the legacy v1 contract, so a client written from memory can fail.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden mock server implementing the Cal.com v2 Bookings contract recorded for this benchmark run (Bearer auth, cal-api-version headers, response envelope, cursor pagination). Pass means the agent client executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: calcomResults.profiles as BoardProfile[],
  perTask: calcomResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: calcomResults.source,
  status: 'live',
  lastRun: calcomResults.generated,
  taskCount: 2,
  rows: calcomResults.rows as ProfileRow[],
};

export const posthog: DomainBoard = {
  id: 'posthog',
  domain: 'PostHog Feature Flags v2',
  company: 'PostHog',
  category: 'Coding',
  blurb:
    'Two coding tasks that implement a client for PostHog flags evaluation API v2, where the memorized /decide endpoint 404s and the v2 response envelope no longer carries the fields a from-memory client reads.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden mock server implementing PostHog current flags v2 contract. Pass means the agent client executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: posthogResults.profiles as BoardProfile[],
  perTask: posthogResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: posthogResults.source,
  status: 'live',
  lastRun: posthogResults.generated,
  taskCount: 2,
  rows: posthogResults.rows as ProfileRow[],
};

export const plausible: DomainBoard = {
  id: 'plausible',
  domain: 'Plausible Analytics v2 Query',
  company: 'Plausible',
  category: 'Coding',
  blurb:
    'Two coding tasks that query the Plausible Stats API v2 through its single POST endpoint and strict JSON query grammar. Clients that send legacy v1 GET requests fail these tasks.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  referenceUrl: 'https://plausible.io/docs/stats-api',
  referenceLabel: 'Plausible Stats API v2',
  scoredBy:
    'Each task is graded by a hidden mock server implementing Plausible current v2 query contract (required body keys, prefixed dimensions, filter trees, and date ranges); malformed and v1-style requests return structured errors and fail. Pass means the agent client executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: plausibleResults.profiles as BoardProfile[],
  perTask: plausibleResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: plausibleResults.source,
  status: 'live',
  lastRun: plausibleResults.generated,
  taskCount: 2,
  rows: plausibleResults.rows as ProfileRow[],
};

export const svix: DomainBoard = {
  id: 'svix',
  domain: 'Standard Webhooks (Svix) Signatures',
  company: 'Svix',
  category: 'Coding',
  blurb:
    'Two coding tasks that implement a verifier for the Standard Webhooks signature scheme used by Svix, which differs from the far more common Stripe scheme in signed content, secret decoding, and signature format.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden test suite that signs fresh deliveries with its own random key each run and requires the verifier to accept authentic deliveries and reject tampered payloads, wrong keys, stale timestamps, and rotated multi-signature headers. Pass means the agent code executes correctly, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-scheme reference passes, and the Stripe-scheme solution fails on the intended trap. The prompts and calibration fixtures remain private to keep the test held out; this page publishes every scored attempt. The chart is the mean of the two task cells. Five profiles passed both tasks: Claude Sonnet with either reviewer setting, GLM-5.2 with either reviewer setting, and GLM-5.1 with no reviewer. Three profiles passed task 01 and failed task 02: GPT-5 mini with either reviewer setting and GLM-5.1 with the default reviewer.',
  profiles: svixResults.profiles as BoardProfile[],
  perTask: svixResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: svixResults.source,
  status: 'live',
  lastRun: svixResults.generated,
  taskCount: 2,
  rows: svixResults.rows as ProfileRow[],
};

export const directus: DomainBoard = {
  id: 'directus',
  domain: 'Directus Filtered Reads',
  company: 'Directus',
  category: 'Coding',
  blurb:
    'Two coding tasks that read role-scoped content through the Directus Items API, whose underscore-operator filters, nested relational conditions, and deep parameter semantics differ from the querystring patterns models default to.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden mock server implementing Directus current Items API contract (filter grammar, deep parameters, field expansion, role-scoped permissions) with the real error envelopes. Pass means the agent client executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  profiles: directusResults.profiles as BoardProfile[],
  perTask: directusResults.perTask as PerTaskBreakdown[],
  metricLabel: 'Pass rate',
  confidenceMethod: WILSON_CONFIDENCE,
  source: directusResults.source,
  status: 'live',
  lastRun: directusResults.generated,
  taskCount: 2,
  rows: directusResults.rows as ProfileRow[],
};

export const boards: DomainBoard[] = [tax, stripe, calcom, posthog, plausible, svix, directus];

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
