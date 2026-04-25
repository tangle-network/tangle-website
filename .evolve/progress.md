# Evolve Progress — tangle-website to 9.5+/10

Round 1 + 1.5 complete — 2026-04-24

## Commits this round
- 32ff53e foundation reset (12 systemic CSS locks)
- 30d20b5 anti-slop sweep (8 banned-word + structural rewrites)
- fbcae5f hero retitle "Secure Infrastructure for AI"
- fd55432 nav IA split + a11y tabindex + gradient fallback + vault brand contrast
- 5cdf0e9 blueprint-agent rebuild (3/10 → bad-audit 6/10, banned-word grep clean)
- 0d4453a overview reframe — Four Surfaces deep-dive
- 7177704 round-1.5 contrast pass (vault text scope, btn bg → brand-dim, cw-p → brand-glow, legacy showcase greys)

## Bad design-audit (round 1)
| Page | Baseline | Round 1 | Δ |
|------|----------|---------|---|
| / | 6 | 6 | 0 (vault contrast lost ground; expect +1-2 after 1.5) |
| /services/blueprint-agent | 7 | 6 | -1 (audit caught NEW vault-text contrast issues introduced) |
| /developers | 5 | 6 | +1 |
| /services/browser-agent + sandbox | hit cap | hit cap | (re-run after midnight UTC) |

## Persona-B (skeptical-dev) target deltas (predicted, not re-rated yet)
- /services/blueprint-agent: 3 → 8+ (banned-word grep clean, install pill present, mechanism-forward subhead)
- /developers: 4 → 7+ (vault WAYS TO EARN section + 2-col code hero present)
- /operators: 2 → 6+ (mechanism-forward earnings cards)

## Persona-C (AI-VC) deltas (predicted)
- 30-second test: still likely fail because hero is "Secure Infrastructure for AI" not deck thesis "Optimization infrastructure for AI agents" — Drew chose the former in an earlier turn
- /overview: tab-closer → on-deck (FOUR SURFACES section + "Optimization Substrate" pill + restaking-led copy retitled to "The Protocol Layer")
- Crypto bleed: web3 wallet gone, x402 swapped, BP partners relabeled. Operators/Stake demoted to "Protocol" dropdown.

## Remaining gap to 9.5
1. **`/services/sandbox` + `/services/browser-agent`**: legacy React showcase components still render with hardcoded `#0a0a0a` near-black bg. Round-1.5 attribute-selector override should help; full fix is to retire SandboxShowcase + BrowserAgentShowcase in favor of the ExamplePanel pattern.
2. **`x402` → `usage-based billing`**: nav-CTA white on brand-primary 4.47:1 — fixed in round 1.5 via brand-dim swap; needs verification.
3. **`/overview` partner marquee + remainder of page** — only the hero zone was reframed. Bento + Restake panels still read as pre-reframe.
4. **`Hero.astro` extraction**: brand-kit ships Linear-grade work; marketing pages have a dozen bespoke hero CSS blocks. A shared `Hero.astro` with `clamp` h1, install pill, 2-col grid, eyebrow tag would lift every page consistency.

## Next round (round 2) — pursue if needed
- Re-audit each page tomorrow when free-tier cap resets
- Persona-A staff re-rate (cheap, structural)
- If Δ < 0.5 on /overview or /sandbox after 1.5 → escalate to /pursue: extract Hero.astro, retire React showcases, kill all `wf-*-cell` legacy bento CSS

## Plateau / pursue triggers
- 3 rounds without 0.5pt movement on a target → /pursue (architectural redesign)
- Currently round 1.5 just landed — wait for re-audit before escalating
