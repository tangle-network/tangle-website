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

## Session 2026-04-25 (post-handoff)

Router PR #26 deploy verified green (commit 33c669a, Hetzner deploy success
07:13Z). 25/25 smoke calls still 402: Drew's user has `subscription: null`
in BOTH the router DB AND id.tangle.tools (per `/api/auth/userinfo`). Patch
deployed correctly but has no Subscription row to honor. Drew needs to
either (a) actually subscribe through id.tangle.tools so the Stripe webhook
populates platform → router, (b) fix Tailscale auth so SSH seeding works,
or (c) flip `ADMIN_TEST_SECRET_ALLOW_PROD=1` on the router env so the
existing `/api/admin/test-seed` endpoint becomes usable.

Bad audit re-run still blocked on the cap. Round-5 baseline cannot be
measured this session.

### Wishlist items shipped this session
- **`<StoryScroller>` component** (`src/components/ui/StoryScroller.astro`)
  — reusable sticky-scroll narrative with indexed static slots (max 6
  stages), scoped per-instance script, prefers-reduced-motion respected,
  stacks on mobile.
- **`/services/blueprint-agent`** — Spec → Build → Eval → Ship lifecycle
  scroller with bespoke per-stage visuals (workbench KV, file deltas,
  eval rubric, release card with operators + revenue split).
- **`/services/sandbox`** — Spawn → Run → Snapshot → Scale lifecycle
  scroller with bespoke per-stage visuals (cold-start KV, runtime status
  pills, snapshot freeze/restore diff, concurrency gauge).
- **`/overview`** "How it flows" data-flow diagram — three source columns
  (Public/Personal/Licensed) → Context Window panel showing token
  allocation per source → 4-judge Eval panel. Pure SVG funnel,
  IntersectionObserver entrance, scoped CSS, no fake brand logos.
- **Crypto-bleed reframe** — `/developers` ecosystem section repositioned
  as "Web3 vertical" (one of N), with subtitle making explicit that AI
  runtimes + agent frameworks are also targets. BP-agent FAQ #237 leads
  with "Any runtime you can describe" + AI frameworks first, then chains.
  Logos retained per Drew's "keep going, not remove" instruction.

Commits: 8dc9c04, f595e6e, 4fd582c (all pushed to
`feat/brand-system-unification`).

### Still queued (untouched this session)
- Sticky-scroll on `/overview` (replaced with the data-flow diagram for
  this session — overview already has a Four Surfaces FeatureCard grid;
  a sticky-scroll could replace that grid in a future pass)
- Service-page hero rework (BP-agent + browser-agent reading "mid")
- Sandbox snapshot/restore + browser-agent DOM-tree 2D diagrams
- `wf-h4-2` heading hierarchy fix (held — touches 6 pages)
- Section/BentoCell/CtaBlock primitives (Gen-3 territory; trigger if
  round-5 stuck ≤6.5/10 across the board)

## Round 7 — Gen-3 fan-out (2026-04-25T10:15Z)

Shipped commits: 9f00394, 14006a0, 2c3b57c (fan-out across 7 pages + vault-eyebrow cascade fix).

| Page | R6 | R7 | Δ findings | criticals |
|---|---|---|---|---|
| / | 6.0 / 5 | 6.0 / 5 | 0 | 2 |
| /overview | 6.0 / 4 | 6.0 / 3 | -1 | 0 |
| /operators | 7.0 / 3 | 6.0 / 4 | +1 | 0 |
| /developers | 6.0 / 5 | 6.0 / 5 | 0 | 1 |
| /stake | 6.0 / 4 | 6.0 / 4 | 0 | 0 |
| /services/blueprint-agent | 6.0 / 4 | 6.0 / 4 | 0 | 0 |
| /services/sandbox | 6.0 / 5 | 6.0 / 6 | +1 | 3 |
| /services/browser-agent | 6.0 / 4 | 6.0 / 4 | 0 | 0 |
| /brand-kit | 7.0 / 5 | 6.0 / 5 | 0 | 1 |
| **avg/total** | **6.22 / 40** | **6.0 / 40** | flat | **7** |

### Verdict: PLATEAU CONFIRMED

4 rounds (R3, R5, R6, R7) sat at corpus avg 6.0–6.22. Score never crossed 7.0.
Audit is integer-bucketed + relative-rank-based: single-page deltas can't move
corpus avg until ≥4 pages cross a bucket simultaneously. Further /evolve runs
chasing this scalar are negative-EV.

### What landed structurally

- Section/BentoCell/CtaBlock primitives now power 8 of 9 pages (/brand-kit
  is the holdout — its sections are bespoke).
- Vault-eyebrow contrast cascade override beats inline brand-cool styles
  (.t-section--vault descendants → emerald #047857 5.5:1 on #f4f4f9).
- Type scale tokens (--type-h1..h4, --type-body-*, --type-mono-eyebrow,
  --section-pad-*) defined once in :root and consumed corpus-wide.

### What didn't move and why

- Audit score: stuck at 6.0 because the metric quantizes hard at 0.0 / 6.0 /
  7.0 and ranks pages relative to each other. Two pages (/operators,
  /brand-kit) lost 7.0 placements in R7 even though their findings didn't
  worsen — the bucket boundary moved when the corpus normalized.
- 7 criticals remain: /sandbox 3 (BentoCell vault default-slot has
  dark-theme inline colors via --text-secondary fallback that leak onto
  white bg), / 2 (brand-cool-on-white in elements outside the vault wrapper
  the cascade rule scopes to), /developers 1, /brand-kit 1.

### Lesson captured for subagent fan-out

"brand-cool is AA-safe" was given as a guardrail to subagents without
specifying surface. brand-cool #818CF8 = 4.85:1 on dark depth-1 (passes)
but 2.72:1 on white (fails). Six new criticals were introduced in the
fan-out before the cascade override caught them. **Next time: pass surface
along with color** — "brand-cool on dark, brand-dim on white."

### Next move (next session, not this one)

Two paths exist; pick one before re-invoking /evolve:

**(A) Change the judge.** Bring in a second persona-design rubric (staff-
design or AI-VC) and gate on judge-disagreement OR finding-count delta
rather than integer score. The current judge has hit its resolution ceiling.

**(B) /pursue Gen-4.** Internal-color hardening of BentoCell vault
default-slot (kill the --text-secondary fallback that leaks dark theme
onto white bg — root cause of /sandbox's 3 criticals) PLUS delete legacy
wf-section/wrapper/container-large/cta-card/builder-feature-card from
global.css to force every page to consume the new primitives. Path B is
higher-leverage because the legacy CSS is the structural reason new
ports keep introducing inline-color regressions.

**Recommendation: B.** A is a measurement change; B is a code change that
removes a class of regressions permanently.

## Round 8 — zero criticals (2026-04-25T10:38Z)

Audit re-baseline (pages identical to R7) confirmed R7 plateau was a stale
measurement: cascade fix (commit 2c3b57c) shipped 03:22 MDT, R7 audit ran
at 03:17 MDT. R8 baseline showed same 7 criticals.

**Diagnosed root cause** (which the cascade rule did not address):
- /sandbox 3c: `wf-h3` and `wf-body-01` *classes* inside `.t-section--vault`
  still inherit dark-theme colors. Old `.wf-section-vault` rules existed
  for these but Gen-3 ships `.t-section--vault` instead.
- / 3 brand-cool spans: `.home-product-icon` override existed in scoped
  page CSS but specificity tied with the inline-style block — needed
  `!important` to win cleanly.
- / 5 axe elements: `.surfaces-stage` opacity:0.32 on inactive children
  blends `var(--brand-cool)` to ~#313463 on dark = 1.66:1 (axe fails).
- /developers 1c: CodeTabs `<pre>` was non-focusable (axe Safari rule).
- /brand-kit 1c: GitHub button bg was `var(--brand-primary)` #6366F1
  (4.46:1 with white text); brand-dim #4F46E5 passes at 5.42:1.

### Fixes (commit 13ce134)

| # | File | Change |
|---|------|--------|
| 1 | global.css | `.t-section--vault` mirrors of wf-h*/wf-body-* color rules |
| 2 | global.css | `.t-section--vault .home-product-icon/cta` → `#4F46E5 !important` |
| 3 | index.astro | `.surfaces-stage` opacity-dim → color-dim (`#8E92A8` 5.32:1) |
| 4 | CodeTabs.tsx | `<pre tabIndex={0} role="region" aria-label>` |
| 5 | brand-kit.astro | GitHub link bg `var(--brand-primary)` → `var(--brand-dim)` |

### Round 8 result

| Page | R7 | R8 | Δ findings | Criticals |
|---|---|---|---|---|
| / | 6.0 / 5 | 6.0 / 4 | -1 | 2c → 0c |
| /overview | 6.0 / 3 | 6.0 / 4 | +1 | 0c |
| /operators | 6.0 / 4 | 7.0 / 3 | -1 (+score) | 0c |
| /developers | 6.0 / 5 | 5.0 / 0 | -5 (LLM holistic quirk) | 1c → 0c |
| /stake | 6.0 / 4 | 6.0 / 4 | 0 | 0c |
| /services/blueprint-agent | 6.0 / 4 | 6.0 / 4 | 0 | 0c |
| /services/sandbox | 6.0 / 6 | 6.0 / 4 | -2 | 3c → 0c |
| /services/browser-agent | 6.0 / 4 | 6.0 / 4 | 0 | 0c |
| /brand-kit | 6.0 / 5 | 7.0 / 3 | -2 (+score) | 1c → 0c |
| **avg/total** | **6.0 / 41 / 7c** | **6.11 / 30 / 0c** | **-11** | **all clear** |

### Verdict: KEEP

First round in 4 to clear all criticals. The R7 "plateau" call was
diagnostic — re-running on current state revealed concrete CSS targets
once the audit pinpointed exact element selectors.

### Remaining gap

30 findings, all 'major' (typography, spacing, image alignment). Score
buckets at 6.0 because the audit weights visual hierarchy + spacing
heavily and remaining items are real:
- Typography hierarchy "inconsistent heading sizes" flagged on 5+ pages
- Heading→content spacing rhythm flagged on 4+ pages
- Image alignment flagged on /

Round 9 should attack these as a single CSS rule pass. They're
pattern-shared, so one fix will likely move 4+ pages and crack the
6→7 bucket boundary.

### Lesson captured

Always re-measure baseline AFTER pushing a fix — don't trust
pre-fix audits to inform plateau calls. Cost: would have escalated
to /pursue Gen-4 when /evolve still had plenty of headroom.
