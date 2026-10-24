// Single source for the compliance badges shown in the footer. Edit this list
// to change what the site claims; remove an entry (or empty the list) to turn
// a badge off.
//
// Copy discipline:
// - HIPAA has no badge until every in-path vendor BAA is executed, deployment
//   safeguards are verified, and the compliance owner records approval (register:
//   company compliance/policies/hipaa-baa-inventory.md). Only then add
//   { product: 'hipaa', status: 'compliant', href: '/security/#hipaa' }.
// - SOC 2 report issuance has not been verified. Keep the report-pending
//   state until the issued report is confirmed; audit progress is not issuance.
export type ComplianceBadgeProduct = 'hipaa' | 'soc2';
export type ComplianceBadgeState = 'ready' | 'compliant';

export interface ComplianceBadgeEntry {
  product: ComplianceBadgeProduct;
  status: ComplianceBadgeState;
  href: string;
}

export const COMPLIANCE_BADGES: ComplianceBadgeEntry[] = [
  {
    product: 'soc2',
    status: 'ready',
    href: 'https://app.vanta.com/tangle.tools/trust/kzhjp5g62vhwoalztadtz',
  },
];
