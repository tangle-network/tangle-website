// Single source for the compliance badges shown in the footer. Edit this list
// to change what the site claims; remove an entry (or empty the list) to turn
// a badge off.
//
// Copy discipline:
// - HIPAA has no badge until every in-path vendor BAA is executed (register:
//   company compliance/policies/hipaa-baa-inventory.md). Then add
//   { product: 'hipaa', status: 'compliant', href: '/security/#hipaa' }.
// - SOC 2 Type II is an attained audit (A-LIGN examination, report in
//   issuance), so 'compliant' is accurate there.
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
    status: 'compliant',
    href: 'https://app.vanta.com/tangle.tools/trust/kzhjp5g62vhwoalztadtz',
  },
];
