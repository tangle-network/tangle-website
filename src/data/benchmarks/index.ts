import type { DomainBoard, ProfileRow } from './schema';
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
  category: 'Coding',
  blurb:
    'Twelve coding tasks built from real Stripe API changes in 2025 and 2026, each graded by running the agent code against Stripe current contract.',
  benchSource: 'Proprietary',
  by: 'Tangle VerticalBench',
  sourceUrl: 'https://github.com/tangle-network/blueprint-agent',
  scoredBy:
    'Each task is graded by a hidden mock server implementing Stripe current API contract (endpoints, required params, error shapes) including the trap a from-memory solution falls into. Pass means the agent code executes correctly against the mock, never a model judging its own work. Every task is calibrated three ways before it is admitted: an empty solution fails, a current-contract reference passes, and the stale-memory solution fails on the intended trap.',
  taskDetails: [
    { title: 'Embedded Checkout session', difficulty: 'medium', builds: 'Create a Checkout Session that renders embedded in the merchant own page and return its client secret.', change: 'Stripe renamed the Checkout ui_mode values in the 2026-03-25 (dahlia) API version; the old value is now rejected.', trap: 'Every model memorized the old ui_mode value, which the current API rejects.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-03-25/updates-available-checkout-session-ui-modes' },
    { title: 'Confirm a payment with a surcharge', difficulty: 'medium', builds: 'Confirm a PaymentIntent at a padded amount (base plus surcharge) in a single call.', change: 'A confirm-time amount parameter was added on 2026-04-22.', trap: 'The parameter did not exist before, so from memory the agent updates then confirms, a two step race.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-04-22/amount-confirmation-parameter-to-paymentintent' },
    { title: 'Attach an existing customer to a test clock', difficulty: 'medium', builds: 'Create a test clock with an existing customer attached, then advance it through a renewal.', change: 'Test clock creation gained a customer parameter on 2026-05-27.', trap: 'Models know customers can only be born on a clock, so they recreate the customer.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-05-27/test-clock-creation-customer-parameter' },
    { title: 'Invoice a fractional quantity', difficulty: 'medium', builds: 'Bill 2.5 hours as a decimal quantity on one invoice line item.', change: 'Decimal quantities on invoice items shipped 2026-03-25.', trap: 'Quantity was integer only, so from memory the agent pre multiplies into the unit amount.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-03-25/invoice-items-decimal-quantity' },
    { title: 'Pause and resume a subscription', difficulty: 'hard', builds: 'Fully suspend a subscription (status paused) and resume it on the next successful payment.', change: 'A dedicated pause endpoint replaced the old pause_collection pattern on 2026-05-27.', trap: 'The memorized answer sets pause_collection, which leaves the subscription active.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-05-27/pause-subscriptions' },
    { title: 'Prebill three months upfront', difficulty: 'hard', builds: 'Charge three months upfront on a monthly price, then bill monthly.', change: 'Billing schedules for prebilling shipped 2026-05-27.', trap: 'From memory the agent fakes it with a one off invoice item or an annual price.', sourceUrl: 'https://docs.stripe.com/changelog/dahlia/2026-05-27/subscriptions-billing-schedules' },
    { title: 'Read shipping from a completed checkout', difficulty: 'medium', builds: 'Handle a checkout.session.completed webhook and persist the buyer shipping address.', change: 'shipping_details was removed from the Checkout Session and moved under collected_information (2025-03-31 basil).', trap: 'Reading session.shipping_details now returns nothing, so the stored address is empty.', sourceUrl: 'https://docs.stripe.com/changelog/basil/2025-03-31/checkout-session-remove-shipping-details' },
    { title: 'Update a Checkout cart in place', difficulty: 'medium', builds: 'Add and remove line items on an existing Checkout Session without recreating it.', change: 'In place line item updates for custom Checkout sessions shipped 2025-12-15.', trap: 'Doctrine says sessions are immutable, so the agent creates a new session and the id changes.', sourceUrl: 'https://docs.stripe.com/changelog/clover/2025-12-15/update-line-items' },
    { title: 'Create a lifetime discount coupon', difficulty: 'medium', builds: 'Create a forever duration, fixed amount coupon and confirm it applies across renewals.', change: 'Forever amount off coupons were restricted in 2025, then reintroduced on 2026-01-28.', trap: 'Mid 2025 models believe it is disallowed and silently downgrade to a repeating coupon.', sourceUrl: 'https://docs.stripe.com/changelog/clover/2026-01-28/reintroduce-forever-amount-off-coupon' },
    { title: 'Compute the next renewal date', difficulty: 'medium', builds: 'Return a subscription next renewal date from its item level billing period.', change: 'current_period_start and end were removed from the Subscription object; periods now live on items (2025-03-31 basil).', trap: 'subscription.current_period_end is among the most memorized fields; it now returns nothing.', sourceUrl: 'https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-subscription-current-period-start-and-end' },
    { title: 'Reassign a payment between invoices', difficulty: 'hard', builds: 'Detach a PaymentIntent from one invoice and apply it to another.', change: 'Detaching a payment from an invoice became possible on 2026-01-28.', trap: 'From memory this is impossible, so the agent voids and recreates the invoices.', sourceUrl: 'https://docs.stripe.com/changelog/clover/2026-01-28/detach-payment-from-invoice' },
    { title: 'Report metered usage', difficulty: 'hard', builds: 'Report API call usage and bill it monthly on a metered price.', change: 'Legacy usage records were removed in favor of billing meter events (2025-03-31 basil).', trap: 'createUsageRecord is the canonical memorized call; it is now rejected.', sourceUrl: 'https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-legacy-usage-based-billing' },
  ],
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
