# HIPAA-Ready badge and security section — served-page evidence

Captured 2026-10-15 from `pnpm preview` (port 4321) against the production
build of `feat/hipaa-ready` via headless Chromium.

- `footer-badge-1440.png` — footer legal row at 1440px: one badge system.
  `SOC 2 Type II` (links to the Vanta Trust Center, as the retired bespoke
  badge did) and `HIPAA-Ready` (links to `/security/#hipaa`) both render from
  `ComplianceBadge.astro`, driven by `COMPLIANCE_BADGES` in
  `src/data/compliance.ts`.
- `footer-badge-390.png` — footer at 390px: badges wrap cleanly in the legal row.
- `security-hipaa-section-1440.png` — the HIPAA section on `/security/`,
  stating HIPAA-Ready status, the open launch gate, and the shipped
  capabilities list. The SOC 2 Type II attestation stays in the page intro;
  it is not duplicated in the HIPAA section.

The docs link (`https://docs.tangle.tools/gateway/hipaa`) resolves once the
parallel docs PR (`feat/hipaa-guide` in tangle-docs) merges; it returned 404
at capture time.
