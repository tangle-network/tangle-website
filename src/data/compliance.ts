// Single source for the compliance badges shown in the footer. Edit this list
// to change what the site claims; remove an entry (or empty the list) to turn
// a badge off.
//
// Copy discipline:
// - There is no official HIPAA certification, and Tangle's launch gate has not
//   closed (vendor BAAs unsigned, infrastructure blockers ops-pending). The
//   only honest HIPAA status today is 'ready'. Do not set 'compliant' without
//   an executed decision record from the compliance program.
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
  {
    product: 'hipaa',
    status: 'ready',
    href: '/security/#hipaa',
  },
];
