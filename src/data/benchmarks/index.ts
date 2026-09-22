import type { RunRecord, Suite } from './schema';
import { assessSuite, type AssessedSuite } from './standard';
import taxRun from './results/tax.json';
import stripeRun from './results/stripe.json';
import calcomRun from './results/calcom.json';
import posthogRun from './results/posthog.json';
import plausibleRun from './results/plausible.json';
import svixRun from './results/svix.json';
import directusRun from './results/directus.json';

// Suite metadata: what each suite grades and how one task is decided. Results,
// counts and status are never written here — they are derived from the run
// record by ./standard.ts, so a suite cannot claim a standing its data does not
// support.

const suites: Suite[] = [
  {
    id: 'tax',
    domain: 'TaxCalcBench',
    category: 'Finance',
    blurb:
      'Fill out a real US tax return. The agent gets a taxpayer’s W-2s, 1099s and details, and must produce the complete Form 1040. Every line it computes is checked against the correct return.',
    benchSource: 'Academic',
    by: 'Column Tax',
    sourceUrl: 'https://github.com/column-tax/tax-calc-bench',
    paperUrl: 'https://arxiv.org/abs/2507.16126',
    scoredBy: 'Each return is graded line by line against the correct 1040 by Column Tax’s own scorer.',
    metricLabel: 'By-line accuracy',
    // Recorded outside the run record, from the sweep's local run logs. Kept
    // beside the suite rather than inside the record because the runner did not
    // write it, and a run record holds only what the runner measured.
    coverageNote:
      'The run record contains only the configurations that completed all 51 returns. Three configurations from the same sweep are absent, having stopped at 35, 16 and 12 graded returns, so the surviving rows are a filtered view of the sweep.',
    run: taxRun as RunRecord,
  },
  {
    id: 'stripe',
    domain: 'Stripe API Integration',
    category: 'Coding',
    blurb:
      'Twelve coding tasks built from Stripe API changes in 2025 and 2026. Each task is graded by running the agent’s code against Stripe’s current contract, so a solution written from memory fails on the change it missed.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden mock server implements Stripe’s current API contract — endpoints, required parameters, error shapes, and the trap a from-memory solution falls into. Passing means the agent’s code executes correctly against that server; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: stripeRun as RunRecord,
  },
  {
    id: 'calcom',
    domain: 'Cal.com Bookings v2',
    category: 'Coding',
    blurb:
      'Implement a client for the Cal.com Bookings API v2, whose required versioned-header dates fall after model training cutoffs, so a client written from memory falls back to the retired v1 contract.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden mock server implements Cal.com’s current v2 Bookings contract — bearer auth, versioned headers, response envelope, cursor pagination. Passing means the agent’s client executes correctly against that server; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: calcomRun as RunRecord,
  },
  {
    id: 'posthog',
    domain: 'PostHog Feature Flags v2',
    category: 'Coding',
    blurb:
      'Implement a client for PostHog’s flag-evaluation API v2, where the memorised decide endpoint returns 404 and the v2 envelope no longer carries the fields a from-memory client reads.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden mock server implements PostHog’s current flags v2 contract. Passing means the agent’s client executes correctly against that server; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: posthogRun as RunRecord,
  },
  {
    id: 'plausible',
    domain: 'Plausible Stats v2 Query',
    category: 'Coding',
    blurb:
      'Query the Plausible Stats API v2: one POST endpoint with a strict JSON query grammar that replaced the v1 GET endpoints most training data documents.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden mock server implements Plausible’s current v2 query contract — required body keys, prefixed dimensions, filter trees, date ranges — with production error shapes, so v1-style requests fail. Passing means the agent’s client executes correctly against that server; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: plausibleRun as RunRecord,
  },
  {
    id: 'svix',
    domain: 'Standard Webhooks Signatures',
    category: 'Coding',
    blurb:
      'Implement a verifier for the Standard Webhooks signature scheme used by Svix, which differs from the far more common Stripe scheme in signed content, secret decoding and signature format.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden test suite signs fresh deliveries with a new random key each run and requires the verifier to accept authentic deliveries and reject tampered payloads, wrong keys, stale timestamps and rotated multi-signature headers. Passing means the agent’s code executes correctly; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-scheme reference passes, and the Stripe-scheme solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: svixRun as RunRecord,
  },
  {
    id: 'directus',
    domain: 'Directus Filtered Reads',
    category: 'Coding',
    blurb:
      'Read role-scoped content through the Directus Items API, whose underscore-operator filters, nested relational conditions and deep parameter semantics differ from the querystring patterns models default to.',
    benchSource: 'Proprietary',
    by: 'Tangle VerticalBench',
    sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
    scoredBy:
      'A hidden mock server implements Directus’s current Items API contract — filter grammar, deep parameters, field expansion, role-scoped permissions — with the real error envelopes. Passing means the agent’s client executes correctly against that server; no model judges its own work. Every task is calibrated three ways before admission: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
    metricLabel: 'Pass rate',
    run: directusRun as RunRecord,
  },
];

export const assessedSuites: AssessedSuite[] = suites.map(assessSuite);

export function suiteById(id: string): AssessedSuite | undefined {
  return assessedSuites.find((suite) => suite.id === id);
}

export function publishingSuites(): AssessedSuite[] {
  return assessedSuites.filter((suite) => suite.assessment.publishes);
}
