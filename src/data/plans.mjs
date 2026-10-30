/**
 * Shared platform plans, as the website states them.
 *
 * The identity service publishes the plans at PLANS_URL. `pnpm check:plans`
 * (scripts/check-plans.mjs) runs before every deploy and fails when a price,
 * credit or feature here differs from that response, or when the built
 * homepage does not render them. Change a plan there first; this file follows.
 */

export const PLANS_URL = 'https://id.tangle.tools/v1/plans';

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPriceCents: 0,
    creditsPerMonth: 0,
    popular: false,
    features: ['1 concurrent sandbox', '3 snapshots per sandbox', '100 GiB egress per account each month, refused beyond it, never charged'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceCents: 2999,
    creditsPerMonth: 2999,
    popular: true,
    features: ['Unlimited sandboxes', '10 snapshots per sandbox', '2 TB egress per sandbox each month, then $0.05/GB'],
  },
  {
    id: 'enterprise',
    name: 'Team',
    monthlyPriceCents: 9900,
    creditsPerMonth: 9900,
    popular: false,
    features: ['Unlimited sandboxes', '25 snapshots per sandbox', '2 TB egress per sandbox each month, then $0.04/GB'],
  },
];

/** "$29.99" or "$0": the price the way the plans page prints it. */
export function planPrice(plan) {
  const dollars = plan.monthlyPriceCents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
