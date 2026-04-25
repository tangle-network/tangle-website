# Evolve Progress — tangle-website to 9.5+/10

Round 1 — 2026-04-24

## Baseline (4-persona + bad audit)
| Page | Staff design | Skeptical dev | AI-VC | Anti-slop hits |
|------|--------------|---------------|-------|----------------|
| / | 6.0 | 6 | fail (30s test) | 2 |
| /brand-kit | 7.9 | n/a | n/a | 0 |
| /blog | 7.3 | n/a | n/a | 0 |
| /services/sandbox | 6.0 | 7 | undifferentiated | 1 |
| /services/browser-agent | 6.0 | 7 | crypto bleed (web3 bento) | 2 |
| /services/blueprint-agent | 6.3 | **3** | **tab-closer** | 4 |
| /developers | 6.0 | 4 | bait-and-switch | 1 |
| /operators | 5.1 | 2 | crypto-coded | 2 |
| /stake | 5.6 | n/a | demote IA | 2 |
| /ecosystem | 6.6 | n/a | 100% crypto roster | 1 |
| /overview | 6.6 | n/a | **closes tab** | 3 |

## Round 1 mutation streams (parallel)

A. blueprint-agent rebuild → 9+/10
B. operators + stake rebuild → 9+/10
C. overview reframe → 9+/10
D. browser-agent crypto bleed pruning + ecosystem polish

Cross-cutting (me, sequential to subagents):
- nav IA: Operators/Stake/Ecosystem → /protocol cluster
- contrast pass: gradient-text fallback, ExamplePanel tabindex, vault brand-cool

Re-audit at end of round.

## Plateau / pursue triggers
- If 3 rounds yield <0.5 point movement on remaining gaps → escalate to /pursue (architectural redesign, e.g. extract Hero.astro from brand-kit pattern, kill all wf-* CSS).
