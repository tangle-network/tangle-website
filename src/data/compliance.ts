// Single switch for the public compliance badge in the footer.
//
// There is no official HIPAA certification, and Tangle's launch gate has not
// closed (vendor BAAs unsigned, infrastructure blockers ops-pending). The only
// honest public state today is 'hipaa-ready'.
//
// - 'hipaa-ready':     technical protections exist; program still in progress.
// - 'hipaa-compliant': reserved for legal sign-off after the launch gate
//                      closes. Do not select this without an executed decision
//                      record from the compliance program.
// - 'off':             hide the badge entirely.
export type ComplianceBadgeStatus = 'hipaa-ready' | 'hipaa-compliant' | 'off';

export const COMPLIANCE_BADGE_STATUS: ComplianceBadgeStatus = 'hipaa-ready';
