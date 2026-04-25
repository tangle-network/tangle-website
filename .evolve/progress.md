# Evolve Progress — tangle-website to 9.5+/10

Generation 2 shipped — 2026-04-24/25

## Commits — Generation 1 (round 1 + 1.5)
- 32ff53e foundation reset (12 systemic CSS locks)
- 30d20b5 anti-slop sweep (8 banned-word + structural rewrites)
- fbcae5f hero retitle "Secure Infrastructure for AI"
- fd55432 nav IA split + a11y tabindex + gradient fallback + vault brand contrast
- 5cdf0e9 blueprint-agent rebuild (3/10 → bad-audit 6/10, banned-word grep clean)
- 0d4453a overview reframe — Four Surfaces deep-dive
- 7177704 round-1.5 contrast pass (vault text scope, btn bg → brand-dim, cw-p → brand-glow, legacy showcase greys)

## Commits — Generation 2 (Hero.astro extraction)
- 73a30f3 extract `Hero.astro` from brand-kit pattern + port `/`
- fe9cd9d port `/operators` + `/developers` + `/stake`
- db82118 port `/services/blueprint-agent` + `/overview`
- c5d583e port `/services/sandbox` + `/services/browser-agent`, retire `SandboxShowcase.tsx` + `BrowserAgentShowcase.tsx`

## Generation 2 thesis & verdict
**Thesis**: brand-kit ships at 7.9/10 because it's free of `wf-*` snowflake CSS. Extract that pattern into one shared `Hero.astro`, port every marketing page to it, and retire the React showcase components — eliminating the legacy CSS surface area where contrast/spacing/alignment failures kept regenerating.

**Verdict**: ADVANCE. All 8 marketing pages now consume the same Hero.astro contract. Net **+716 / −1290** across 14 files; **−574 lines** of bespoke hero CSS retired; **733 lines** of React-island showcase code (`SandboxShowcase` + `BrowserAgentShowcase`) deleted along with their 28+ hardcoded contrast violations.

Quantitative re-audit deferred to round-2 evolve — `bad design-audit` is at the 5/day free-tier cap and resets ~midnight UTC.

## Round 1 bad-audit baseline (carries forward)
| Page | Baseline | Round 1 | Δ |
|------|----------|---------|---|
| / | 6 | 6 | 0 (vault contrast regressed; round 1.5 + Gen 2 fix) |
| /services/blueprint-agent | 7 | 6 | -1 (vault contrast — fixed 1.5 + Gen 2) |
| /developers | 5 | 6 | +1 |
| /services/sandbox + /services/browser-agent | cap | cap | re-baseline round 2 |

## Generation 2 structural verification
- ✅ All 8 ported pages return HTTP 200 against local dev server
- ✅ Zero `*-hero-grid` / `wf-section-hero` / `wf-hero-section` class refs in `src/pages`
- ✅ Zero `BrowserAgentShowcase` / `SandboxShowcase` component refs in `src/`
- ✅ Zero hardcoded near-black/grey contrast traps in `src/pages` or `src/components`
- ✅ 8 of 8 marketing pages render via `<Hero>` (index, overview, operators, developers, stake, blueprint-agent, sandbox, browser-agent). `/brand-kit` is the source pattern (kept untouched).

## Remaining gap to 9.5+/10 (Gen 3 territory)
1. **Legacy `global.css` block (lines 1–1791)** — `wf-*` ships unused on most non-hero surfaces. Pages are now off `wf-h1` etc. via Hero.astro, but `wf-section-head`, `wf-bento-cell`, `wf-cta-block` still render through global.css. Gen 3 = nuke or migrate.
2. **Section / BentoCell / CtaBlock primitives** — Hero.astro proved the pattern; these are the next snowflake set. Pages have ~dozen bespoke section/bento blocks each.
3. **Lightweight static linter** for the 4-persona slop dimensions — replaces $$ LLM audit on cheap dimensions (banned-word density, italic-on-h1, hardcoded grey hex), reserves bad-audit budget for visual craft.

## Plateau / pursue triggers
- 3 rounds without 0.5pt movement on a target → escalate to next /pursue (architectural redesign)
- Gen 2 just landed — round 2 evolve runs against this new baseline once the bad-audit cap resets
