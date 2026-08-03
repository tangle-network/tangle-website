# Blog series plan: agent-eval, agent-runtime, supervisor-lab

Reconciled from four parallel proposals.
Written 2026-08-01. Read-only research pass — no posts drafted, no existing content edited, nothing committed.

## Verdict

Two new series, one extension of an existing series, and **no vision series** — the composition argument is one post, not five, because four of its five proposed posts were other series' evidence and its fifth overclaimed on self-improvement that our own ledger says has not happened.

| Track | Ruling | Series value | New posts |
| --- | --- | --- | --- |
| agent-eval | NEW series | `The Instrument Problem` | 7 (orders 1-7) |
| agent-runtime | EXTEND `Agent Runtime Infrastructure` | unchanged | 7 (orders 1, 2, 3, 6, 7, 8, 9) |
| supervisor-lab | NEW series | `When Structure Pays` | 7 (orders 1-7) |
| vision | NOT a series | none (standalone) | 1 |

Total 22 posts at the long tier (2,500-4,000 words) is roughly 65,000 words where every number needs a source check.
That is a quarter of writing, not a sprint.
The **8-post spine** that carries the entire argument is named in §7; everything else is extension.

One measured fact drives most of the structure below: `supervisor-lab` is a **private** repo (`gh repo view tangle-network/supervisor-lab --json isPrivate` → `true`, checked this session), while `agent-eval`, `agent-runtime`, `traces` and `agent-sdk` are all public.
Roughly half the strongest numbers live where a reader cannot open them.
§6 gives the single shared answer.

---

## 1. Overlap: every duplicated topic assigned to exactly one series

Four agents working in parallel proposed the same twelve topics more than once.
Each is assigned once, with the reason it belongs there rather than in the other series that wanted it.

| # | Topic | Claimed by | **Owner** | Why here, not there |
| --- | --- | --- | --- | --- |
| 1 | CodeTraceBench recursive-vs-one-shot tie (F1 .3644 vs .3673, $6.73 vs $1.21, 60/64 vs 63/64) | agent-eval | **Instrument Problem #1** | Uncontested in the end, but promoted to the series opener. It is the only proposed post whose every number already sits in a public repo README, and its claim — a correctly-built benchmark measuring the wrong capability — is the series' thesis in its purest form. |
| 2 | Executor deletion (`fee88987`, 16 files, 50 insertions, 3,360 deletions) | agent-runtime, vision | **Agent Runtime Infrastructure #3** | Vision wanted it as an illustration of "the runner stays boring." But a post whose entire evidence is one commit diffstat plus a commit body is an engineering post, and the runtime series can show all four commits of the arc (verdict → build → delete → re-delete-after-merge) where vision could only show one. Vision links to it. |
| 3 | Noise floor (20/40 then 23/40, identical prompt, identical 40 HumanEval tasks) | agent-eval, supervisor-lab | **Instrument Problem #3** | The eval series is where "a number needs a band" is an axiom the rest of the series spends. `When Structure Pays` needs the band as a *constraint on its own tables* (it labels four rows directional against it), which is a one-line citation, not a post. Note this post is currently **blocked** — see §5, item A. |
| 4 | Winner-picker vs ship rule inversion (gen-4: 0.417/0.500 by selection vs 2/6 and 1/6 fail-closed) | agent-eval, supervisor-lab | **Instrument Problem #5** | Both proposals told the same story with the same four re-judge receipts. It is two instruments disagreeing, which is a defect in measurement, not a result about structure. `When Structure Pays` drops its post 6 entirely and cites this one. |
| 5 | Cost undercount (604,124 actual vs 247,567 ledgered; supervisor 2.55× / 2.42× wall) | agent-eval, supervisor-lab, vision | **Instrument Problem #6** owns the *method*; **When Structure Pays #5** consumes the corrected *numbers* | The accounting defect (CLI-backend workers never meter into the ledger) is an instrument story. The supervisor comparison is a result story that happens to need the repaired denominator. The result post states the number and links the method post in one sentence; it must not re-derive the recovery. |
| 6 | Adversarial verification (11 fabrications, 15 bypasses, ban present in 93/93 prompts, artifact-deliverables survived 4/4) | agent-eval, vision | **Instrument Problem #7** | Direct collision, both flagship. Vision's version was five unrelated defects in one post — a bag, not an argument. The eval version has one claim with a denominator (exhortation is 93/93 inert; deliverable type discriminates 4/4 vs 0). Vision drops its post 4. |
| 7 | Best-of-k structural lever (+18.3pp HumanEval, +21.3pp MBPP, four cells all p<1e-8) | supervisor-lab, agent-eval, vision | **When Structure Pays #1** owns the result; **Instrument Problem #2** owns the calibration that made it measurable | The lift is a result about structure. The 73-of-76 false-fail answer key that had to be fixed before any model token burned is an instrument story. Hard boundary: IP #2 does not restate the coverage-weighting derivation; WSP #2 does not restate the answer-key defect. Each names the other in one sentence. |
| 8 | Sample-0 luck retraction (+13.0pp cut to ≈+9.3pp; pick moved off sample 0 on 1 of 89) | supervisor-lab, vision | **When Structure Pays #2** | Vision wanted it as an example of intellectual honesty. It is more useful as the second post of the results series, where it functions as the evidence standard being spent on ourselves before it is spent on anyone else's idea. |
| 9 | Zero-token profile delivery (0 input tokens against ~824 carried; three dead surfaces) | agent-runtime, vision | **Agent Runtime Infrastructure #2** | It is a delivery-contract defect in the runner, four dependency hops deep (`^0.12.0` declared, `^0.9.5→0.9.6` resolved through tcloud 0.4.14, retired wire key `inlineProfile`). That is the runtime series' subject matter exactly. |
| 10 | AgentProfile as the unit of change | agent-runtime, vision | **Split, deliberately.** ARI #1 owns the **materialization contract** (which axes each path carries); the vision post owns the **lever ordering** (model ≫ selection > prompt text ≈ 0) | Two different claims on one object. The contract post is mechanics with `file:line` proof; the lever post is a ranked table of measured effects. Neither absorbs the other. Cross-link both ways. |
| 11 | Pre-registration and kill criteria | supervisor-lab, vision | **When Structure Pays #4** | Vision's post 5 was the kill criterion for the whole profile thesis; WSP #4 is the same mechanism shown firing three times, including the case where a pre-declared sizing rule killed the experiment we most wanted to run (σ=0.6520, MDEs 31.8/26.0/22.5 against a 19.1-point bar, DECISION = DEMOTE). The version with three firings wins. |
| 12 | Supervisor 4/10 vs solo 7/10 at 2.55× | supervisor-lab, agent-eval, vision | **When Structure Pays #5** | Only the results series can carry the full arc — the loss, the named defects found underneath it, the gap shrinking to −17 points on six pre-registered never-autopsied instances, and the verdict "keep, still losing." Everyone else cites. Nobody publishes the flat headline (§5, item F). |

Two near-collisions resolved by boundary rather than by assignment:

- **Model swap beats structure** (+33 points, 3/12 → 7/12 on identical bugs) appears in `When Structure Pays #7` as the closing verdict with its full seven-row lever table and per-row power labels, and in the vision post as a single row in the composition argument. The vision post cites the table; it does not rebuild it.
- **The calibration discipline** appears in `Instrument Problem #2` as a post and in `When Structure Pays #2` as a one-sentence precondition. Same rule as above.

---

## 2. Extend vs new, ruled per track

The instruction was to bias toward extending.
Three of four proposals asked to create a new series.
One survives that bias intact, one survives trimmed, one is denied.

### 2.1 agent-runtime → **EXTEND `Agent Runtime Infrastructure`**. Approved as proposed.

The series exists with exactly two posts, at `seriesOrder` 4 and 5, both dated 2026-06-17, both ~900-word Sandbox-SDK posts.
Orders 1-3 do not exist.
The name is precisely right for executors, profile contracts, budgets and run layout, and the series is a fragment missing its own foundation.

`src/pages/blog/series/[series].astro` sorts by `seriesOrder` with a `?? 999` fallback (lines 22-26, read this session), so claiming orders 1, 2, 3, 6, 7, 8, 9 renders as one clean sequence and no reader ever sees the gap.
Reader path becomes: what a run is made of (1-3) → where it runs (4-5, already published) → what you can see, afford, deliver, and resume (6-9).

Stated side effect: the two published Sandbox-SDK posts stop being the series opening.
That is intended.

### 2.2 agent-eval → **NEW series, `The Instrument Problem`**.

The nearest existing home is `'the-self-improving-stack'` (13 posts), whose post 7 "The Gate Is The Optimizer" is a complete theory of the promotion rule.
It cannot absorb this material, for three reasons all four proposals independently reached:

1. **It is a closed map, not an open shelf.** Its argument is "here are the twelve mutable layers," running orders 1-13 with one post per layer and a Series Map post that names all twelve siblings. Appending orders 14-20 breaks the series' own claim to be a complete layer map, and the sixth eval post would have no layer to be.
2. **Wrong organizing axis.** That series is indexed by *layer*; measured results index by *claim*. `blog-and-research.md` requires research indexes organized by claim and evidence standard, not by taxonomy. The noise-floor result alone refutes conclusions in the prompt layer, the coordination layer and the memory layer with one measurement — there is no single layer row it belongs under.
3. **Different evidence standard, measured not asserted.** Across all 13 stack posts, quantities matching `\d+(pp|%|x)` total **two**. Those posts close with a `## Source Trail` of arXiv links and access dates; these close with commit SHAs, run records, an n and a p. Two evidence standards under one series header teaches the reader nothing about which one they are reading.

**Extension contract, so this is not a fork.** Every post in the new series carries an in-body link, before its halfway point, to the doctrine post it tests — `self-improving-stack-evaluation-gates` for posts 2, 5, 6, 7; `self-improving-stack-agent-runtime-topology` for 1 and 4; `self-improving-stack-test-time-compute` for 3.
Post 1 names "The Gate Is The Optimizer" in its opening and states what it did not do: show the rule firing on a real number.
The new series says in its first paragraph that it is the evidence arm of the old one.
No doctrine is restated.

One recommended edit to existing content (not made — read-only pass): add a forward link from `self-improving-stack-evaluation-gates.mdx`'s FAQ to `The Instrument Problem` post 1.

### 2.3 supervisor-lab → **NEW series, `When Structure Pays`**. Approved, trimmed 8 → 7.

`grep -rli "supervisor-lab"` across `src/` returns zero hits.
`grep -rl "arena"` in the blog returns zero.
`grep -rli "pre-registered\|pre-registration"` returns zero.
The lab, its arenas and its pre-registration discipline are entirely unwritten on the site, and not one number from these experiments appears in any of the 80 existing posts.

It is a distinct series from `The Instrument Problem` because the reader's decision is different.
`The Instrument Problem` reader is deciding whether to trust one number they generated this week.
`When Structure Pays` reader is deciding where the next two weeks go: another orchestration layer, or sampling and selection.
Same evidence standard, different question, different reader path.

Trim: proposed post 6 (ranker vs ship rule) is reassigned to `The Instrument Problem #5` per §1, and the noise-floor tail of proposed post 3 becomes a citation.
Renumber 1-7.

### 2.4 vision → **DENIED as a series. One standalone post.**

The proposal was `'the-measurement-problem'`, five posts.
Four of the five duplicated other series (executor deletion → ARI #3; adversarial verification → IP #7; kill criteria → WSP #4; the lever table → WSP #7).
The remaining one — the composition argument plus the rejection ledger — is one argument, and one argument is one post.

A series whose every post is a citation to another series is a bag of related topics, which the quality bar forbids.
The title also collides with `The Instrument Problem` to the point of being the same phrase.

See §6 for what the surviving post can honestly claim.

### 2.5 Naming convention, decided once

**Title Case**, matching 10 of the 11 existing series.
`'the-self-improving-stack'` is the outlier and its literal slug value is what renders on the series page.
`slugifySeries()` in `[series].astro` lowercases and hyphenates, so Title Case is URL-safe and displays properly: `/blog/series/the-instrument-problem/`, `/blog/series/when-structure-pays/`.

Tags: reuse the live vocabulary — `agents` (25 posts), `self-improvement` (13), `evals` (7), `systems` (5).
Add exactly one new tag across the whole plan: `measurement`.

---

## 3. The three series, with their arguments

A series is a sequence with an argument.
Here is each argument in one sentence, then the post sequence with what each rests on.

### 3.1 `The Instrument Problem` (agent-eval) — 7 posts

**Argument.** Before an agent number can tell you anything about the agent, it has to survive an audit of the thing that produced it — and in seven documented cases from our own repos the instrument was the defect: a correct benchmark measured the wrong capability, the answer key failed 73 of 76 correct solutions, the noise band was wider than every effect we chased, a shipped check returned silent success, the winner-picker and the ship rule ranked candidates in opposite order, the cost meter counted only the driver, and every report marked "verified" collapsed under a refuting pass while its tests stayed green.

**Audience and decision.** Engineers about to make an irreversible call on a number they generated themselves: promote this candidate, fund this direction, publish this result, tell a customer the agent improved.

| Order | Working title | Rests on | Public? |
| --- | --- | --- | --- |
| 1 | The benchmark was right and measured the wrong thing | CodeTraceBench three-arm table: DSPy RLM F1 .3644 (60/64, $6.73) vs retired one-shot .3673 (63/64, $1.21) vs upstream CodeTracer .3128 (61/64); companion null: predicted ceiling .4512, measured .3407 vs .3273 baseline, 123 blocks mean width 2.27, placement 16.3% / 13.8% / 18.6%, per-step accuracy 19.7% → 16.5% | **Fully public** |
| 2 | The answer key failed 73 of 76 correct solutions | Doctest checker parsed the raw prompt and swallowed the closing `"""`; 73/76 false-fails; two normalizations took 9 → 2; final coverage 75/164, false-fail 2/75, 0 crashes; MBPP 427/427 references pass before any arm ran; pilot moved −6.7pp → +16.7pp on one ranking change | Rigs public, write-up private |
| 3 | The same prompt scored 20 of 40 and 23 of 40 | Identical seed, identical 40 HumanEval tasks, Llama-3-8B temp 0.2, re-run: 20/40 then 23/40 | **BLOCKED — see §5 A** |
| 4 | The check that returns silent success | Four shipped `DEFAULT_FINDERS` patterns in `muffled-gate-scanner`; the confidence-1.0 finding off a 784 → 646 three-call run, where a strictly decreasing run of n occurs at 1/n! so 3 fires on ~1 sequence in 6; fix requires 5 serial calls (<1%) and a fall to ≤60% of first output | **Fully public** |
| 5 | The winner-picker threw away the only real winner | gen-4 inversion table (claude-author 0.417 selection / 2/6 fail-closed; merge-author 0.500 / 1/6; baseline 1/6); four decisive patches re-judged one at a time through official swebench 4.1.0 Docker with patch bytes and seconds; `failClosedRankKey` fix | Fix public, write-up private |
| 6 | The meter only counted the driver | 604,124 true vs 247,567 ledgered on rep 0 (2.4× low); paired run solo 675k/3,769s/$0.53 vs supervisor 1,722k/9,124s/$1.34; factory 13/30 vs 12/30 for 569,670 vs 238,310 tokens; the honest-upper-bound pattern for ~2% usage-omitted responses | Fix commits public |
| 7 | Every verified report was wrong until someone attacked it | 4 workflows, 11 fabrications (6 then 5), 15 bypasses (13 then 2), regex lint caught 2 of 7 spellings; the ban appeared in 93/93 worker prompts including the fabricator's; recomputable-artifact deliverables survived 4/4, every fabrication was a prose deliverable | Surfaces public, catalog private |

### 3.2 `Agent Runtime Infrastructure` (agent-runtime) — 7 new posts, extending

**Argument.** One AgentProfile is the only thing you change about an agent, so every code path that handles one coding-agent CLI specially quietly narrows what a profile is allowed to say — and the narrowing is invisible until you measure it, because a dropped field, an unobservable worker, an unpayable budget and an unread run all look exactly like a normal failure.

| Order | Working title | Rests on |
| --- | --- | --- |
| 1 | One profile, and the contract that says which parts of it run | `src/agent/profile-materialization.ts`: three shipped contracts (full; prompt-and-model at exactly 6 axes; worktree-CLI at exactly 20), compound-to-leaf map at line 72 (identity→4, prompt→2, model→5, resources→7, mcpConnections→1) |
| 2 | The profile arrived and contributed zero tokens | 0 input tokens against ~824 carried; `AGENTS.md` re-probed at 12,845 tokens moved the prompt 16,627 → 16,627 → 16,627; only `.opencode/agent/<name>.md` + `--agent` delivers at +819 of ~824; root cause `^0.12.0` declared vs `^0.9.5→0.9.6` resolved through tcloud 0.4.14 emitting the retired key `inlineProfile` |
| 3 | Deleting the backend-specific executor: 3,360 lines out, four profile axes in | `fee88987` (16 files, 50 insertions, 3,360 deletions, 15 public exports removed), `32a9cf3f` (the prior keep-verdict with four gaps at cited source lines), `76db51d3` (build the capability generically first), `43b11053` (re-delete after a merge resurrected it), CHANGELOG 0.118.0 for the four axes gained — **and the named losses, which are the post's credibility** |
| 6 | A worker you cannot see is a decision you authored blind | `76db51d3` body; `statusCaptured: false` so `toToolSpan` omits status rather than inventing a 0ms latency or a defaulted `ok`; proven against a live bridge on `127.0.0.1:3355`; then `52c3f029` — an observability read polled a dead worker forever (6 GETs in 6 seconds) and the decoder dropped a call typed `'custom'` |
| 7 | The parent authored a budget the child could never satisfy | `012762f0`: four roots authored 2,000 / 8,000 / 12,000 / 20,000 tokens against six measured settlements of 31,211 / 32,296 / 47,365 / 47,965 / 48,253 / 62,616 input; `below-runtime-floor` as its own rejection reason; unmeasured floors stored null, never 0; 611 passed / 1 skipped / 52 files |
| 8 | Delivery is a property of the output | `2430ee5e`: the delivery check ran only on clean paths, so a worker killed by budget skipped it; the child wrote `child-artifact.txt` containing exactly `PROOF-RECURSIVE-CHILD` and was recorded as a failure for overrunning 12,000 authored against 76,657 spent; kill-tested — reverting fails the 3 new tests and passes the other 11 |
| 9 | A published reader needs a published writer | `7d900957` (three exports promoted after the `traces` CLI shipped a reader for a hand-rolled layout), `a7bcb946` (`.loops` → `.agent`, renamed before v0.111.0 tagged so no published version shipped the old path); `WORKER_TRACE_PROPAGATION` as a 7-entry `as const satisfies Record<ExecutorConfig['backend'], boolean>` so an eighth backend cannot be added without classifying it |

### 3.3 `When Structure Pays` (supervisor-lab) — 7 posts

**Argument.** Adding structure around a language model pays in exactly one measured shape — give the model several tries and a check it can already run, then keep the best — while coordination, hierarchy, evolved prompts, added tools and memory each cost more and returned zero or less on every arena we ran.

| Order | Working title | Rests on |
| --- | --- | --- |
| 1 | One thing paid: best of five against a check the model can already run | Four cells, all positive, all significant: Llama/MBPP 51.8→73.1 (+21.3pp, +226/−13, p=2.3e-51, n=427); Llama/HumanEval 43.9→62.2 (+18.3pp, +75/−15, p=9.2e-11, n=164); Qwen/HumanEval +9.0pp (p=1.0e-8); Qwen/MBPP +8.5pp (p=4.6e-16). Selection does 85-92% of the work; every cell captures ≥93% of its own pass@5 ceiling; temp-0 greedy control at 54.3% still beaten by +7.9pp |
| 2 | We cut our own headline from +13.0 to about +9.3 | On the 89 uncovered tasks the pick moved off sample 0 on exactly 1 of 89 — provably inert — yet those tasks show +7.3pp; sample 0 at 50.0% vs a five-sample mean of 44.3%, ~1.5σ; coverage-weighted honest estimate ≈+8pp selection, ≈+9.3pp full loop; replication: baseline moved 0.4pp while the single-sample estimator swung 6.7pp and the luck flipped sign |
| 3 | An arm that looked 20.7 points better was worth 0.6 | Per-slot strategy prefixes scored 62.8% final, +20.7pp against their own baseline (p=2.3e-14); paired final-against-final: +0.6pp, 18 wins / 17 losses, p=1.000; the all-five-fail bucket did not move (53 → 53) and the pass@5 ceiling was identical (67.7%); two of five prefixes hurt (40.2 / 47.0 / 50.6 / 28.0 / 44.5%) |
| 4 | The kill condition goes in the commit before the run | Task sets frozen by instance id before any arm ran; the null-control set of 20 already-solved problems fired (three arms kept 20/20, one kept 17/20, all three losses one mechanism); a pre-declared sizing rule killed the experiment we most wanted: σ=0.6520 at n=12 pairs against a 19.1-point bar, MDEs 31.8 / 26.0 / 22.5 for 2/3/4 replicates, DECISION = DEMOTE, buy-back priced at 416 cells and ~$176 |
| 5 | The supervisor lost 4-10 to 7-10, and every defect we fixed shrank the gap without crossing zero | 12 SWE-bench Verified instances paired, same model both sides, official swebench 4.1.0; 2 excluded because gold itself fails to grade in-container, giving a valid denominator of 10; 3 disagreements all favour solo, sign test p=0.25, formally underpowered; mechanism triangulated (workers capped at 2 iterations / ~8k tokens, all-or-nothing delivery, serial retries with no selection); `import astropy` crashed in 7 of 7 worker sandboxes; post-fix on 6 pre-registered never-autopsied instances 4/6 vs 5/6, gap −17 vs the original −30; verdict "keep, still losing" |
| 6 | Advice beat extra compute where extra compute was dead, and still lost on price | 62 HumanEval problems a proven loop had already failed, 53 all-five-fail; blind extra round 18/62 = 29.0% ($0.024); self-advice 24/62 = 38.7% ($0.043); strong-advises-weak 38/56 = 67.9% ($0.383); strong model solving directly 60/61 = 98.4% ($0.166); paired +37.5pp [+23.2,+51.8], +23/−2, p=1.9e-05, n=56; self-advice +9.7pp p=0.307 n.s.; 1 plan of 56 leaked code and its task failed anyway; the null control caught the hazard (advised arm kept 17/20 where three arms kept 20/20) |
| 7 | The model beat everything we built around it | Ranked by power: the four-cell selection grid from post 1 (well-powered); +33 points from a model swap on identical 12 bugs; then rows labelled **directional in the table itself** — worker-model swap 1/6 → 3/6 both replicates against four generations of supervisor redesign that moved it 1/6 → 2/6; evolved prompts 5/8 and 3/8 against a hand-written seed at 7/8, lift 0; a test-running tool 6/12 vs 7/12 with 4 of 12 runs making 30-38 calls and zero edits; memory 12/20 vs a frozen agent's 13/20 with recall firing 20/20; a model brain coordinating 10 modules at 100/100 tests for 120,647 tokens vs no brain at all at 100/100 for 8,509. Counterweight: on a terminal task the supervisor scored 2/3 where the raw agent scored 0/3 — and the raw agent plus one forced turn checking whether the answer file existed also scored 2/3, far cheaper |

---

## 4. Sequence: what ships first, and what it unlocks

Selection criteria, in order: evidence already public and already verified; no dependency on a post that does not exist; stands alone for a reader arriving cold; and highest credibility deposit per word.

**Ship in strict `seriesOrder` within each series.** The `Agent Runtime Infrastructure` orphan (orders 4 and 5 with nothing at 1-3) is the exact defect this plan is fixing; do not recreate it in a new series by publishing order 4 before order 1.

That constraint forced one reordering: `The Instrument Problem` was proposed opening on the noise floor, which is **blocked** on a re-run (§5 A).
Opening a series on its one unverified number would reproduce precisely the failure the series is about.
CodeTraceBench becomes order 1.

| Wave | Posts | Gating work |
| --- | --- | --- |
| 1 | IP #1, ARI #1-#3, WSP #1 | None for IP #1 and ARI #3. ARI #1 needs one command (§5 G). |
| 2 | IP #2, WSP #2, ARI #6 | IP #2 and WSP #2 need the private-repo answer (§6) for their write-up citations |
| 3 | IP #3 → then #4, #5, #6; WSP #3, #4; ARI #7, #8, #9 | IP #3 is the gate for IP #4+ in series order. Re-run required. |
| 4 | IP #7, WSP #5, #6, #7 | WSP #5-#7 need benchmark entries or full inline provenance |
| 5 | Vision standalone | Ships last by construction: it is the hub and links posts that must already exist |

**What the first post unlocks for the reader.**
IP #1 says: this company publishes the run where its own new engine tied its retired one at 5.6× the cost, with the third-party upstream tool's score in the same table.
Everything downstream — a +21.3pp lift, a +37.5pp lift, a claim that a supervisor is worth keeping — is readable only against that deposit.
Ship the null first, the engineering artifact second, the win third.
That order is the argument.

---

## 5. Unverifiable claims and publication blockers

Aggregated from all four risk assessments, plus checks I ran this session.
Each is either fixable with named work or dropped.

### Drop outright — no artifact exists, or the artifact says the opposite

| # | Claim | Status | Ruling |
| --- | --- | --- | --- |
| B | 591,738-byte jail escape through the Docker host gateway; benchmark rig where `allow_internet = false` was declared and unenforced; egress control that recorded a policy and enforced nothing; "roughly eight separate defects in one session" | All four independently grepped four repos for these and found nothing. The single on-disk `allow_internet` occurrence sets it to **true**, with a comment explaining why. Two agents searched for `591,738`, `591738`, `host.docker.internal`, `host-gateway`, `172.17.0.1` and hit only their own session transcript. | **DROP all four.** Do not write these posts. If someone wants the security stories they need their own artifact hunt first, and it is not in this plan. |
| C | "Knowledge cards show ZERO transfer: +0.56 on covered areas, 0.000 on all four held-out leaves" | **Refuted, verified by me this session.** On the k8s split the held-out card scored **0.000 → 0.500, 2 of 4 leaves flipped, 0 regressions** (`docs/research/k8s-bench/RESULTS.md`) — 0.000 is the **bare default**, not the card. On the tax split the same 26 held-out leaves went 0.423 → **0.846**, 22 wins / 0 losses / 4 ties, sign test **p = 4.8e-07**, with bare and placebo at exactly 0.000 across all 26 (`docs/research/us-tax-bench/RESULTS.md` lines 19-27). The card transferred. | **DROP the framing entirely.** Publishing it as briefed would be a false negative, which for this audience is worse than a false positive. The real story there — held-out 0.423 sits 0.138 below search 0.561, a measurable generalisation cost visible only because the split was frozen on task content before any work — belongs to the profile-compiler thread as a future post. |
| E | "A generation loop's wins sat inside their own noise floor: 2/6 vs 1/6 at n=6" | **Inverted, verified.** The repo document is titled "gen-4 winner-selector discarded a real 2/6 winner — VERIFIED" and the 2/6 was re-confirmed on all four decisive patches through the official swebench 4.1.0 Docker judge, run one at a time. | Publish as a **selection defect** (IP #5). The n=6 non-significance is a caveat bounding the gain, not the finding. |
| F | "Hierarchical supervision loses" as a headline | `NORTHSTAR.md`, dated 2026-07-27, states three-for-three that every headline negative dissolved into a named infrastructure defect and concludes "the thesis has not been fairly tested, in either direction." | **Never publish the flat headline.** WSP #5 publishes the measurement, the defects, the shrinking gap and the standing verdict. Nothing else in the plan makes a supervisor-versus-solo claim, and nothing should acquire one during drafting. |

### Fix before publishing — named work, then the post is clear

| # | Claim | What is missing | Work that makes it publishable |
| --- | --- | --- | --- |
| A | **20/40 then 23/40 noise floor** (IP #3, and cited as a constraint by WSP #3 and #7) | The figure comes from a session memory note dated 23 days ago whose own header warns it is a point-in-time observation. No raw pass/fail rows found on disk. This is the series' axiom, sourced worse than anything else in it. | Re-run the public rig `agent-runtime/bench/src/hev-eval.mts` twice at an identical seed, commit the two rows files to a public location, and cite those. One command, one afternoon. If the swing does not reproduce, IP #3 changes and so does the constraint the other two posts cite. **This is the single highest-leverage piece of lab work in the plan.** |
| D | "+13.0pp, p=9.2e-11" | **Mispairing, verified by me at `docs/results/structural-lever-humaneval.md`.** Line 45: +13.0pp carries **p=1.5e-5**, CI [+7.8, +18.4], +62/−22. Line 92: **p=9.2e-11** belongs to the **+18.3pp** generated-asserts arm, CI [+12.7, +23.7], +75/−15. Line 55 adds what the brief omits: ~+4pp of the unconditional +13.0pp is sample-0 luck, coverage-honest estimate ≈+8pp selection / ≈+9.3pp full loop. | Already fixed in this plan. WSP #1 headlines +18.3pp / p=9.2e-11 / n=164 and +21.3pp / p=2.3e-51 / n=427. WSP #2 is the coverage-weighting correction. No post quotes the brief's pairing. |
| G | `fullProfileMaterialization` axis count (ARI #1) | `AGENT_PROFILE_MATERIALIZATION_AXES` resolves from `@tangle-network/agent-interface`, not installed in the local checkout. Exact counts are in hand for the other two contracts (6 and 20) and the compound map. | One command against an installed copy: `node -e "console.log(require('@tangle-network/agent-interface').AGENT_PROFILE_MATERIALIZATION_AXES.length)"`. Until then, ARI #1 states no total for `full`. |
| H | cli-bridge `file:line` citations in ARI #3 (`src/backends/pi.ts:368`, `grep -cE 'steer|followUp|interrupt' → 0`) | Nobody opened that repo this session. | Attribute to the verdict document ("read out of the bridge source at the time of the verdict"), or open the repo and re-check. Do not assert as independently verified. |
| I | Run `proof-native-tools-20260801b` (the shared artifact linking ARI #7 and #8) | Named in two commit bodies; the run directory was not found on disk. | Cite as recorded in the fix commits, not as an artifact anyone inspected. |
| J | agent-runtime CHANGELOG 0.118.0 contradicts its own repo | Under "What the bridge path does NOT do today" it states `Executor.progress()` and `Executor.traceSource()` are absent, tracked as #683. PR #687 landed both and closed #683 at 07:22:51Z; PR #688 merged at 07:25:10Z still carrying the bullet. | Correct the changelog **before** ARI #1, #3 or #6 links it. Otherwise the series cites a document that contradicts the series. This is a real repo defect, not a writing risk. |
| K | 0.118.0 is merged but unpublished | `npm view @tangle-network/agent-runtime version` → **0.117.0** (checked this session). Every claim about the deleted executor and the widened contract is true of `main` and of nothing installable. | Either wait for the publish, or state plainly "merged, not yet released" with the commit link as the proof. Implying installability would fail the AI Product Gate. |
| L | Rung-6 knowledge-damage curve (0.846 → 0.538, 1 win / 9 losses / 16 ties, p=0.0215), the clean-control curve, "3,170 cells across 5 arms for $4.97", "1,741 real dispatches and 289,921 commands" | Read from prose in `NORTHSTAR.md` and `docs/design/what-the-supervisor-is.md`. Underlying cells never opened. | Our own finding (IP #7) is that prose marked "verified" is where every fabrication has been found. **Recompute from cells or cut.** Currently these appear in no post in this plan; keep it that way until recomputed. |
| M | glm-4.5-air 99.4% blind pass@1 on HumanEval | Only the table header row was read (n=163, one task lost to an API abort). Lift rows unread. | Cite the saturation figure only — it is used in WSP #1 to bound where the lever stops paying — or read the rest first. |
| N | factory-bench numbers (13/30 vs 12/30, 569,670 vs 238,310 tokens, the empty 0/21 patch after 43 minutes and 386,942 worker tokens) | Verified in the write-up, but the rig is **not** on `agent-runtime` main (branch `feat/factory-runner`), so there is no public reproduction path. Worse: that instance barely discriminates — all 7 runs fail the same 17 of 30 hidden tests, only 2 tests ever differ, and ~11 of the 30 require API names the specification never states. | If used in IP #6, the unreachable-test band appears **before** the comparison, not in a footnote. Otherwise it is exactly the hidden-asymmetry failure the doctrine bans. Merging the rig to main would also give it a repro path. |
| O | agent-eval commit `b44898e` (the 1/n! confidence-1.0 fix, IP #4) | One agent verified it directly (`git show b44898e`, subject `fix(behavioral): output-length decay fired on three-call noise`, 63 insertions / 11 deletions across `behavioral-metrics.ts` and its test). Another did not open it. | Confirm the github.com URL returns 200 before linking. Treat as verified pending that one check. |
| P | Three existing published posts leak `/Users/drew/webb/agent-runtime` in their public Source Trails, and those same Source Trails pin `agent-runtime@0.26.0` and `agent-eval@0.34.1` | Confirmed by me this session: 3 files, and live npm is **0.117.0** and **0.140.1** — 91 and 106 minor versions of drift on public pages. | **Separate fix, out of this plan's scope, but someone should own it.** New posts use npm coordinates and public GitHub URLs, never local paths. |

---

## 6. The vision series, honestly

**It cannot be a series, and the composition argument as briefed overclaims.**

Here is the ledger the vision proposal itself surfaced and then argued around: the improvement loop has produced **7 machine-authored candidates, 7 rejections, 0 certified promotions** (3 rejected-incomplete, 2 rejected-no-gain, 2 rejected-cost, recomputed from `.evolve/rounds/gen-0.jsonl`).
A later generation ended `rejected-no-gain` at $3.23 across 3.8M input and 1.07M output tokens, with its own accounting flags reading `fullyPriced: false, accountingComplete: false`.
`NORTHSTAR.md` states the profile thesis has not been fairly tested in either direction.
An un-ratcheted rewrite loop damaged knowledge a person had already repaired; a ratchet stops the damage and produces no climb; the clean control never climbs at all.

So the sentence "these three systems compose into a system that improves agents" is not available.
Nothing in the record supports it.
Writing it would be the goal-drift failure — swapping the claim for the adjacent easier one because the real claim keeps losing.

**What IS proven, and what the post can therefore argue:**

1. Give a model several tries and a check it can already run, keep the best: four cells, four positive, all p < 1e-8, +8.5 to +21.3 points.
2. A stronger model advising a weaker one on problems where more blind sampling provably cannot help: +37.5pp, p=1.9e-05, n=56 paired.
3. Changing the model at the same price tier moved the number further than every piece of structure built around it: +33 points on identical bugs, n=12.
4. Deleting a backend-specific execution path removed 3,360 lines and widened what a profile could express from 6 axes to full — one public commit, both halves quotable from its own body.
5. The promotion rule refuses: 7 for 7.

**The reshaped post.** One standalone post (no `series` field), shipping last, titled around the rejection ledger.
Its claim is not "we built a self-improving stack."
Its claim is: *improving an agent needs three separable systems — one that can execute a changed agent, one that can price whether the change helped, one whose job is running the experiments and recording what died — and the third is where the field is thinnest, because its output is usually a negative.*
It spends its credibility budget in the first 200 words on 7 rejections and 0 promotions, gives the ordered lever table with power labels, and closes on the pre-registered condition that would change our minds.
It is the hub: it routes to `The Instrument Problem` for "can I trust this number," to `When Structure Pays` for "where does the next two weeks go," and to `Agent Runtime Infrastructure` for "how does a changed agent actually run."

That is a real argument, it is fully supported, and it is one post.

---

## 7. The three posts to write first

### 1. `The Instrument Problem` #1 — the CodeTraceBench tie

**Claim.** A benchmark can be correctly implemented, honestly scored, and still be a liability, because it can pass while the capability you are actually selling is untested.

**Evidence, and where it lives — all public, all in `tangle-network/agent-eval`:**
- `benchmarks/trace-analysis/codetracebench-rlm-glm52-20260731/README.md`, `report.md`, `result.json` — the three-arm table on 32 pinned trajectories × 2 reps, one GLM-5.2 model, unchanged official scorer, inputs verified byte-identical to the pinned corpus: recursive DSPy RLM **F1 0.3644** (P 0.3413, R 0.3909, 60/64 completed, **$6.73**) against the retired one-shot runner's **0.3673** (P 0.3333, R 0.4091, 63/64, **$1.21**), and upstream NJU-LINK CodeTracer at **0.3128** (61/64). Cost ratio recomputed from `result.json`: 6.7304022 ÷ 1.2084616 = **5.57×**. The lab's own sentence is in that README and is the post's spine: "The recursive engine's value is not this score."
- `benchmarks/trace-analysis/codetracebench-phasea-blocks-20260731/README.md` — the companion null: predicted arithmetic ceiling **F1 .4512** (+12.4pp), measured **.3407** against a **.3273** baseline; the mechanism fired exactly as designed (123 blocks, mean width 2.27, median 2, max 11, against effective width 1.0 at baseline) and did not convert because placement is wrong far more often than width — 16.3% of predicted blocks overlap any labeled step, the block's own first step lands on one 13.8% of the time, widening added 156 steps of which 18.6% were labeled, per-step accuracy fell 19.7% → 16.5%.
- Limitations that ship in-post, not in a footnote: 9 of 64 runs failed on contract violations the model could not satisfy; n=16 labeled cases with one case supplying a disproportionate share of matches; and an earlier internal analysis reporting 40 blocks and a +20.8pp ceiling was wrong and was recounted from `input-labels.json`.

**Why first.** Zero blockers, zero private paths, every number already in a public README, and it is the strongest credibility deposit available — a company publishing that its own new engine tied its retired one at 5.6× the cost, with the third-party tool's score in the same table.

### 2. `Agent Runtime Infrastructure` #3 — the executor deletion

**Claim.** The special case survived because nobody had measured what it did that the generic path did not; once that list was written down and built, the deletion removed 3,360 lines and simultaneously widened the profile contract from 6 axes to full.

**Evidence, and where it lives — `tangle-network/agent-runtime`, public, four commits:**
- `32a9cf3f` — the prior keep-verdict, with four blocking gaps each read at a cited source line and one measured live: no `progress()`, no `traceSource()`, no mid-turn steering channel, and swallowed provider errors (a request with `stopReason: "error"`, `errorMessage: "400: …"` returned HTTP 200, `finish_reason: "stop"`, empty content, cost 0). The doc was deleted with the module, so cite it at that SHA — which is the more interesting citation anyway.
- `76db51d3` / PR #687 — build the missing capability generically first.
- `fee88987` / PR #688 — the deletion. `git show --numstat` this session: **16 files, 50 insertions, 3,360 deletions** (`pi-executor.ts` 880, `pi-mcp.ts` 534, their tests 685 and 840, `docs/api/runtime.md` 346), **15 public exports removed**. The capability gain is quotable from the commit body: `reasoningEffort` → `--thinking`, `profile.tools` → `--exclude-tools`, `profile.resources` materialized into the run directory, `systemPrompt` as a native `--system-prompt` file.
- `43b11053` — a parallel branch had edited the file, so the merge brought it back against the delete. Re-deleted.

**Mandatory:** the accepted losses (mid-turn steering fidelity, per-worker env/args/binary overrides, the `pi: true` trace-propagation row) are named in the post. Publishing only the gain reproduces the hidden-asymmetry failure the doctrine bans, and the named-losses list is what makes the post credible.

**Why second.** One public commit URL carries both halves of the argument, the numstat is verified, and it is the only post in the plan where the entire story is provable from four `git show` commands.

### 3. `When Structure Pays` #1 — best of five against a check the model can already run

**Claim.** Sampling five answers and picking the one that passes a check built only from information already in the prompt lifts pass@1 by +8.5 to +21.3 points on four separate model × benchmark pairs, every one significant.

**Evidence, and where it lives:**
- `supervisor-lab/docs/results/structural-lever-humaneval.md` (private repo — see the disclosure rule below). Verified line-by-line this session: line 92 (+18.3pp [+12.7,+23.7], +75/−15, **p=9.2e-11**, n=164), line 133 (the four-cell cross-grid: MBPP-Llama +21.3pp > HumanEval-Llama +18.3pp > MBPP-Qwen +8.5pp ≈ HumanEval-Qwen +9.0pp, all cells ≥93% of their pass@5 bound, selection doing 85-92% of the work, net repair swaps 6/1, 2/0, 5/0, 9/2), line 199 (Qwen/HumanEval +9.0pp [+5.2,+12.9], p=1.0e-8, +38/−3), line 206 (the lift shrinks as the model strengthens, +18.3pp at a 44% baseline → +9.0pp at an 82% baseline).
- Public rigs that reproduce it: `agent-runtime/bench/src/hev-structural.mts` and `bench/src/mbpp-structural.mts` on `main`, rig commit `415a033e`. The proof block is the exact invocation, with `CALIBRATE=1` documented as skipping the model entirely so a reader can reproduce the 427/427 reference pass at zero token cost before running any arm.
- The correction that ships with it: WSP #2, not this post, but this post must not quote +13.0pp at all. Headline is +18.3pp and +21.3pp with their correct p-values.

**Why third.** It is the largest verified effect in the entire corpus and the only confirmed win, and it lands after a null and an engineering artifact, which is the order that makes it believable.

---

## 8. Cross-cutting rulings, decided once so three series do not each pick differently

### 8.1 The private-repo answer

`supervisor-lab` is private; roughly half the strongest numbers are inside it.
Two options, in order of preference, and no post ships on a third:

1. **Publish the run record.** The in-flight `src/data/benchmarks/schema.ts` + `src/pages/benchmarks/[id].astro` route on this branch is the natural public home. Its own header comment already reads: "every row is a real measured run with provenance (n, date, source). A domain with runs pending renders 'awaiting run', never a fabricated row." Precedent for the alternative shape exists too: agent-eval commit `04c856a feat(analyst): publish public benchmark evidence` extracted the CodeTraceBench results into a public `benchmarks/` tree. **Decision needed before drafting WSP #5-#7**, which lean hardest on private write-ups.
2. **Carry it inline.** State the number with its full method — protocol, model, n, judge version, artifact names, date — and link the public rig that produces it. Every post using this option says once, plainly, that the lab repo is not public and these numbers are stated on our word with their denominators attached.

**No post cites a path a reader cannot open.** Not once.

### 8.2 Vocabulary, fixed across all three series

`harness` is banned outright by `copywriting.md` (line 139, alongside delve, leverage, robust, transformative) and is on the reader's own retired list — and it is this codebase's core noun.
Decided substitutions, used identically everywhere:

| Retired | Use instead |
| --- | --- |
| harness | **the rig** (benchmark machinery), **the runner** (execution layer), **coding-agent CLI** (the backend product) |
| gate | **the promotion rule**; verbs *promote* and *refuse* |
| oracle | **the answer key** |
| verifier | **the checker** |
| selector | **the winner-picker** |
| topology | **coordination shape** |
| arena | glossed on first use: "two designs run on the same problems at the same budget" |
| scorecard | **the results table** / **the per-run record** |
| substrate, seam, e2e, BLUF | not used |

Original words are allowed only inside verbatim quotes and code identifiers, where they are quotation rather than authorial voice.
At most one unexplained insider word per paragraph; never two in a sentence.

### 8.3 The house voice conflict, ruled

All four proposals flagged it and all four recommended the same thing.
The signature construction across the existing 80 posts is binary contrast — "Self-improvement is not a model property. It is a system property."
`copywriting.md` line 124 bans it by name: *"Binary contrast — 'It's not X, it's Y.' State Y directly."*

**Ruled: drop it, including in titles.**
The doctrine postdates the posts and this construction is the single most identifiable machine-writing pattern in the existing corpus.
Every post here opens on the measurement instead: "Re-running the identical prompt on the identical 40 tasks gave 20 of 40, then 23 of 40."
That is also a better opening for material that is entirely numbers.

Consequence: `Agent Runtime Infrastructure` #8's working title ("Delivery is a property of the output, not of how the worker died") is the banned shape and must be rewritten before drafting. It is the only title in the plan that trips it.

### 8.4 CTA, ruled

`copywriting.md`: *"No CTA, if the page is research or reference."*
These are research posts.
**None of the 22 gets a CTA.**
`check-post.mjs` emits a warning for a missing CTA verb; that warning is accepted deliberately and the reason goes in the PR description rather than being papered over with a fake call to action.

### 8.5 Publication gates, corrected

Read from `.codex/skills/tangle-blog-proof/scripts/check-post.mjs` this session, lines 40-108:

- **Answer capsule.** `firstWords` is the first 150 words **joined into a string**, and the check is `firstWords.length < 240` — so the threshold is **240 characters, not 240 words**. One agent had this right and it is worth stating once. Cleared easily by a capsule that carries the result and its denominator, which is what the doctrine wants anyway.
- **Proof block** is the only hard `fail()` besides frontmatter: `codeBlocks === 0` and no `curl`/`npm install`/`pnpm`/`TANGLE_API_KEY`/fenced-block match. None of these posts has an honest install command, and forcing one would be dishonest. Every post uses **the reproduction command plus the artifact path** in a fenced block, which the pattern `/```(?:bash|sh|typescript|json|http)?/i` matches directly and which is a stronger proof block than an install line.
- **Internal links ≥ 2** (matching `/(blog|services|overview|developers|operators|stake)`) — satisfied by the deliberate link to the counterpart doctrine post plus the previous post in the same series. Argumentative links, not SEO links. Trailing slashes, per house convention.
- **External links ≥ 3** — the arXiv sources the doctrine series already established (HumanEval 2107.03374, MBPP, SWE-bench 2310.06770, HELM 2211.09110, G-Eval 2303.16634, CodeT, GEPA) plus public GitHub commit URLs and npm package pages.
- **`## FAQ` with `### …?` headings** — 73 of 80 existing posts have this and it feeds the FAQ JSON-LD in `src/pages/blog/[...slug].astro`. All 22 get one.
- **Banned phrases** — zero occurrences of delve, comprehensive, facilitate, utilizing, moreover, furthermore, landscape, crucial, paradigm, "let's dive in", "here's the thing", "turns out".
- **Source Trail** with a freshness date and a package audit pinned to live versions: `@tangle-network/agent-eval@0.140.1`, `@tangle-network/agent-runtime@0.117.0`, `@tangle-network/agent-interface@0.40.0`, `@tangle-network/traces@0.11.0` (all four checked with `npm view` this session). Never a local filesystem path.
- **Pre-publish, every post:** `node .codex/skills/tangle-blog-proof/scripts/check-post.mjs src/content/blog/<slug>.mdx` then `pnpm build`. Neither was run for this plan — there is nothing to check yet.

### 8.6 The 8-post spine

If only eight posts are ever written, these eight carry the whole argument:

1. IP #1 — the benchmark measured the wrong thing (the credibility deposit)
2. ARI #3 — the executor deletion (the engineering artifact)
3. WSP #1 — best-of-k pays (the one confirmed win)
4. IP #3 — the noise floor (the axiom everything else needs) *— gated on §5 A*
5. IP #5 — winner-picker vs ship rule (two correct instruments disagreeing)
6. WSP #5 — the supervisor result and its arc (the honest negative)
7. IP #7 — every verified report was wrong until attacked (the standing practice)
8. Vision standalone — three systems, 7 rejections, 0 promotions (the hub)

### 8.7 Flagged, out of scope, owned by nobody yet

- The three published posts leaking `/Users/drew/webb/agent-runtime` in public Source Trails, pinning `agent-runtime@0.26.0` and `agent-eval@0.34.1` against live 0.117.0 and 0.140.1.
- The agent-runtime CHANGELOG 0.118.0 contradiction (§5 J) — a repo defect, fix before any post links it.
- Whether the 22 posts should register entries in `src/data/benchmarks/` rather than restating tables in prose. The schema exists on this branch and looks like the right home; nobody has read it against these results.
- `tangle-website` is currently on branch `feat/seo-coverage-batch-20260617` with uncommitted work including `src/pages/blog/series/[series].astro` itself. The `slugifySeries()` behaviour that §2.5's naming ruling depends on is **uncommitted** and could change.
