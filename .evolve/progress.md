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

## Round 2 — Gen-2 baseline (partial) + targeted fixes
2026-04-25 — measured 4 of 9 pages before Tangle Router free-tier 5/day cap kicked in. Cap is real (not the misdiagnosed missing-key from earlier in the day; that was fixed by switching to `TANGLE_ROUTER_USER_KEY` + `OPENAI_BASE_URL`). Recipe + script are in `scripts/bad-batch.sh` + the auto-memory.

### Measured (post-Hero.astro)
| Page | Score | Findings | Notes |
|------|-------|----------|-------|
| /overview | 7.0 | 0c/2maj/1min | typography hierarchy on "Build a Blueprint" h2, spacing under "Profile × Sandbox × Data × Evals", partner logo alignment |
| /stake | 6.0 | 2c/3maj/2min | axe link-name × 5 (dead `<a href="#">` icon anchors), contrast `#6b7094` on `#0c0b1d` 4.04:1 |
| /services/sandbox | 6.0 | 0c/2maj/2min | hero h1 → CodeWindow spacing rhythm, button consistency |
| /services/browser-agent | 6.0 | 0c/2maj/2min | heading rhythm, image sizing |

Avg measured = **6.25/10** vs target **9.5**. Gap = **3.25**.

### Cap-blocked (no round-2 score yet)
`/`, `/operators`, `/developers`, `/services/blueprint-agent`, `/brand-kit` — round-1 baselines carry over until cap resets / credits added.

### Round-2 fixes shipped (pre-measurement; verify next round)
1. **`#6b7094` → `#9696B8` site-wide** (`global.css` × 8, `FAQ.astro`, `stake.astro`) — kills the `/stake` critical color-contrast (4.04:1 → **6.80:1** on `#0c0b1d`) and lifts every page using `--text-muted`, `.faq-detail-label`, `.stake-detail-label`.
2. **`/stake` icon link-name a11y** — 6 dead `<a href="#" class="stake-asset-icon-link">` → `<div aria-hidden="true">` (the visible `<p class="stake-asset-label">` carries the accessible name). Kills the 5-element axe `link-name` critical.

Expected /stake delta: 6.0 → ~7.5+ once the 5-axe-critical and 1-color-contrast finding (combined ROI ~18) drop out.

### Open hypotheses for round 3
- **Hero.astro slot rhythm** — sandbox + browser-agent both flagged h1→slot vertical rhythm. Add an explicit `gap` between text and slot column, or `margin-bottom: 1.5rem` on h1.
- **/overview "Build a Blueprint" h2** — flagged too small. Likely rendered via `wf-h2` with surrounding section using `wf-h1`-class headings. Audit visual hierarchy.
- **Heading rhythm globally** — sandbox + browser-agent both noted inconsistent `h2/h3` margin-top/bottom. Candidate global rule: `h2, h3 { margin-top: 32px; margin-bottom: 16px; }` scoped to marketing pages.

## Plateau / pursue triggers
- 3 rounds without 0.5pt movement on a target → escalate to next `/pursue` (architectural redesign)
- Gen 2 + round-2 fixes shipped; round-3 evolve waits on cap-reset / credit add to re-measure.
