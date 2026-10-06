/**
 * Sandbox egress terms, as the website states them.
 *
 * The sandbox API bills these terms and publishes them at EGRESS_TERMS_URL.
 * `pnpm check:egress` (scripts/check-egress-terms.mjs) runs before every
 * deploy and fails when these numbers differ from that response, when the
 * response is unavailable, or when the built homepage does not render them.
 * Change a price there first; this file follows the published terms.
 */

export const EGRESS_TERMS_URL = 'https://sandbox.tangle.tools/v1/pricing/egress';

export const EGRESS_TERMS = {
  period: 'calendar-month',
  metered: 'outbound',
  bytesPerGb: 1_000_000_000,
  plans: {
    free: { scope: 'account', includedBytes: 107_374_182_400, overage: 'refused', usdPerGb: 0 },
    pro: { scope: 'sandbox', includedBytes: 2_000_000_000_000, overage: 'billed', usdPerGb: 0.05 },
    enterprise: { scope: 'sandbox', includedBytes: 2_000_000_000_000, overage: 'billed', usdPerGb: 0.04 },
  },
};

/** The names id.tangle.tools/app/plans shows for each plan id, in display order. */
export const PLAN_NAMES = { free: 'Free', pro: 'Pro', enterprise: 'Team' };

const TB = 1_000_000_000_000;
const GIB = 1024 ** 3;

/** "2 TB" (decimal) or "100 GiB" (binary): the units the terms were approved in. */
export function formatEgressBytes(bytes) {
  if (bytes > 0 && bytes % TB === 0) return `${bytes / TB} TB`;
  if (bytes > 0 && bytes % GIB === 0) return `${bytes / GIB} GiB`;
  throw new Error(`No unit states ${bytes} bytes exactly; add one before publishing it.`);
}

/** "$0.05": at least cents, and every digit the published rate carries. */
export function formatUsd(value) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}

/** One row per plan, in PLAN_NAMES order: what the pricing table renders. */
export function egressRows(terms = EGRESS_TERMS) {
  return Object.entries(PLAN_NAMES).map(([id, name]) => {
    const plan = terms.plans[id];
    if (!plan) throw new Error(`The egress terms carry no ${id} plan.`);
    return {
      id,
      name,
      included: `${formatEgressBytes(plan.includedBytes)} per ${plan.scope}`,
      beyond: plan.overage === 'refused' ? 'Refused, never charged' : `${formatUsd(plan.usdPerGb)} per GB`,
    };
  });
}

/** The sentences under the table, built from the same numbers. */
export function egressNotes(terms = EGRESS_TERMS) {
  const ids = Object.keys(PLAN_NAMES);
  const perSandbox = ids.filter((id) => terms.plans[id]?.scope === 'sandbox');
  const perAccount = ids.filter((id) => terms.plans[id]?.scope === 'account');
  const notes = [];
  if (perSandbox.length > 0) {
    const included = formatEgressBytes(terms.plans[perSandbox[0]].includedBytes);
    notes.push(
      `On ${perSandbox.map((id) => PLAN_NAMES[id]).join(' and ')}, every sandbox has its own ${included}; allowances are not pooled across the account.`,
    );
  }
  for (const id of perAccount) {
    const cap = formatEgressBytes(terms.plans[id].includedBytes);
    notes.push(
      `On ${PLAN_NAMES[id]}, the account's sandboxes share one ${cap} cap. Once it is reached, new sandboxes and prompts are refused until the next month, and nothing is charged.`,
    );
  }
  const binary = ids
    .map((id) => terms.plans[id]?.includedBytes)
    .find((bytes) => bytes !== undefined && bytes % TB !== 0);
  notes.push(
    `TB and GB are decimal: 1 TB is 1,000 GB, and 1 GB is ${terms.bytesPerGb.toLocaleString('en-US')} bytes.${
      binary === undefined ? '' : ` GiB is binary: ${formatEgressBytes(binary)} is ${binary.toLocaleString('en-US')} bytes.`
    }`,
  );
  return notes;
}

/** What is counted and when it resets, as the published terms define it. */
export function egressLede(terms = EGRESS_TERMS) {
  if (terms.period !== 'calendar-month' || terms.metered !== 'outbound') {
    throw new Error(`No copy states egress metered "${terms.metered}" per "${terms.period}"; write it before publishing.`);
  }
  return 'Egress is outbound traffic from a sandbox, counted per calendar month (UTC). Inbound traffic is free.';
}
