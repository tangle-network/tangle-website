# Delivery status — checked 2026-10-03 22:24 UTC

Read-only GitHub/API audit using `gh-drew` as `drewstone`.
No CI waiting, deployments, paid workloads, account changes, or Git changes.
This archived copy preserves the original observation time.
`status-summary.json` and `production-http-current.json` retain the compact findings and public HTTP receipts.
Full GitHub responses remain in the local handoff archive; they are not copied into this public checkpoint.

## Important correction

The delivered successful recording is headless Claude Code output rendered as a terminal recording.
It is not the native Claude Code interactive TUI and does not satisfy the requested interactive demonstration.
The underlying task result is retained as real execution; that does not make its presentation a native TUI.
No successful native task recording is established by this audit.

The 05:26 state saying the native fix awaits release is now stale.
ADC [#9017](https://github.com/tangle-network/agent-dev-container/pull/9017) merged at 04:53:10 UTC as `49e44d6ea94642837aecf9daed68fce961e7bc92`.
At 22:23 UTC, `https://orchestrator.tangle.tools/version` serves `116a31b9aa8bc5eeffb7f1f686645805e356e5b4`.
GitHub ancestry confirms this served source contains #9017.
Maintained [deployment 37124698651](https://github.com/tangle-network/agent-dev-container/actions/runs/37124698651) completed successfully at 13:42 UTC.
That proves source promotion and the served Orchestrator version, not the exact Sidecar in a newly created sandbox or native task completion.

## Delivered and remaining

| Surface | Checked source/publication | Production evidence | Still missing |
|---|---|---|---|
| SDK documentation | Docs [193](https://github.com/tangle-network/docs/pull/193), [194](https://github.com/tangle-network/docs/pull/194), [195](https://github.com/tangle-network/docs/pull/195), [196](https://github.com/tangle-network/docs/pull/196) all merged; no open Docs PRs | Fresh HTTP 200 for SDK index, native/headless guides and fleets; native controls and corrected fleet text present. Prior browser/copy/mobile receipts retained under `.agent/sdk-agent-modes-20261003` | Broad hosted execution per feature; Python execution; native task completion. Prior copy proof did not measure exact newline fidelity |
| Main site | [218](https://github.com/tangle-network/tangle-website/pull/218) merged: benchmark catalog, task sources, brand guidance. [213](https://github.com/tangle-network/tangle-website/pull/213) share thumbnail merged | Fresh benchmark and brand pages HTTP 200. Prior state says browser-live verified, but old `/tmp` website proof file is missing | Local homepage expansion not deployed; design/story alignment and real product recordings remain; current visual check not repeated |
| Benchmark charts | Website [208](https://github.com/tangle-network/tangle-website/pull/208), [214](https://github.com/tangle-network/tangle-website/pull/214) merged. Brand [194](https://github.com/tangle-network/brand/pull/194), [195](https://github.com/tangle-network/brand/pull/195) merged. npm Charts 0.2.0 published | Website benchmark catalog responds; retained PR screenshots report desktop/mobile chart checks | Fresh chart interaction not repeated; broader trace/attempt/distribution views and benchmark publication standard remain |
| VerticalBench | Blueprint [2743](https://github.com/tangle-network/blueprint-agent/pull/2743), [2744](https://github.com/tangle-network/blueprint-agent/pull/2744), [2748](https://github.com/tangle-network/blueprint-agent/pull/2748), [2751](https://github.com/tangle-network/blueprint-agent/pull/2751) merged | PRs retain actual report-consumer screenshots and checks; current end-user report deployment not re-rendered | Broader benchmark roadmap still open; merged chart/report work does not prove a new valid campaign or ranking |
| Router models UI | [598](https://github.com/tangle-network/tangle-router/pull/598), [599](https://github.com/tangle-network/tangle-router/pull/599) merged; no open Router PRs | Prior state says both origins verified; `/tmp` CSS proof file is missing | Trusted price/release-date coverage and retired-model inventory not closed by toolbar/cache fixes |
| Router operators | [600](https://github.com/tangle-network/tangle-router/pull/600) merged | Fresh `/api/operators` and `/api/operators/models`: 200, empty arrays, network `unconfigured`, reason `discovery_unconfigured`, `no-store`, 15s refresh. Persistent Oct 2 desktop/mobile screenshots retained | Healthy-network recovery not demonstrated live; scope is configured inference operators, not complete decentralized cloud inventory |
| Sandbox pricing | ADC [8612](https://github.com/tangle-network/agent-dev-container/pull/8612), [8651](https://github.com/tangle-network/agent-dev-container/pull/8651), [8688](https://github.com/tangle-network/agent-dev-container/pull/8688), [8691](https://github.com/tangle-network/agent-dev-container/pull/8691) merged | Fresh public plans API: Pro $29.99 includes $29.99; Team $99 includes $99; both concurrency=-1; 10/25 advertised snapshots | No real checkout/renewal/plan migration, >25 concurrency, snapshot boundary, invoice or full metering settlement proof in this audit. Team is $99, not $99.99 |
| Sandbox UI | ADC [8781](https://github.com/tangle-network/agent-dev-container/pull/8781) merged; shared Sandbox UI has no open PRs | Prior landing proof includes complete harness grid, workspace story, SDK+CLI. Current anonymous landing HTTP returned 403 from this client, so no current UI inference | Complete app-consumer verification and SOC 2 rollout across every app not established |
| Intelligence homepage | ADC [8827](https://github.com/tangle-network/agent-dev-container/pull/8827) merged | Prior retained state: browser rendered reviewed copy and removed `sdk-data`/`forwarding sink` on Oct 2 | No fresh browser audit in this pass; broader product workflow proof remains separate |

Charts is `packages/charts` in [tangle-network/brand](https://github.com/tangle-network/brand), not a standalone `tangle-network/charts` repository.
The current public npm version is 0.2.0; Brand has zero open PRs/issues.

## Native recording acceptance still owed

- [ ] Create one owned sandbox within the remaining original $5 pilot budget; retain exact served Sidecar revision.
- [ ] Launch native `interactive()` Claude Code, retain actual PTY bytes, show genuine onboarding/permission behavior.
- [ ] Complete a real task; headless `streamPrompt()` output does not count.
- [ ] Disconnect and reconnect to the same process/session during task execution.
- [ ] Independently verify changed files, unchanged tests and task outcomes outside the agent workspace.
- [ ] Export original PTY replay plus MP4/GIF; identify any trimming/speed changes explicitly.
- [ ] Open media as a viewer; delete the owned sandbox/fleet and confirm absence.
- [ ] Integrate approved real recording into the existing website design; do not substitute synthetic terminal UI.

The recording release dependency no longer justifies an indefinite pending status.
A precise completion ETA is unsupported until the fresh native launch is attempted.
Any estimate must be conditional on actual hosted auth/task success, not deployment status.

## SDK/OpenAPI distinction

This thread's Docs 193–196 work covers documentation organization, code components, runnable snippets, interactive/headless guidance and budget wording.
It did not change the Sandbox OpenAPI schema or generation pipeline.
Separate merged ADC work exists:

- [8911](https://github.com/tangle-network/agent-dev-container/pull/8911): use canonical exported AgentProfile JSON schema; fixes authenticated `/doc` 500.
- [8914](https://github.com/tangle-network/agent-dev-container/pull/8914): restore authenticated docs/diagnostics callers; inline protected generated spec into Swagger without credentials.
- [8920](https://github.com/tangle-network/agent-dev-container/pull/8920): consolidate mounted-app tests after inline Swagger change.
- [9047](https://github.com/tangle-network/agent-dev-container/pull/9047): publish Sandbox SDK 0.60.12; release-generated OpenAPI version changed along with package metadata. This is not comprehensive SDK reference authoring.

These PRs are authored by GitHub `drewstone`; exact agent/session ownership is not established by that identity.
Public PyPI `tangle-sandbox` still returns 404; Python HTTPX examples are intentionally not described as a published native Python SDK.

## Current open PR inventory

| Repository | Open PRs |
|---|---|
| tangle-website | [165](https://github.com/tangle-network/tangle-website/pull/165): reversible home speed path/live benchmark; ownership not established as this thread |
| docs | None |
| tangle-router | None |
| sandbox-ui | None |
| brand / Charts | None |
| agent-dev-container | [9077](https://github.com/tangle-network/agent-dev-container/pull/9077) main/develop sync; [9070](https://github.com/tangle-network/agent-dev-container/pull/9070) version packages; draft [8894](https://github.com/tangle-network/agent-dev-container/pull/8894) member-line contract |
| blueprint-agent | [2758](https://github.com/tangle-network/blueprint-agent/pull/2758) release; [2742](https://github.com/tangle-network/blueprint-agent/pull/2742) same-session staging replay |

## Existing remaining-work trackers

No open tangle-website issue exists, and no GitHub issue covering this complete website/docs/demo task was found.
The only combined remaining list located is local `state.json`; it is not a public roadmap.
Root should post one consolidated checklist and link existing subsystem issues rather than duplicate them.

Relevant existing open trackers:

- [Blueprint 2418](https://github.com/tangle-network/blueprint-agent/issues/2418): VerticalBench destination and linked work map.
- [Blueprint 2427](https://github.com/tangle-network/blueprint-agent/issues/2427): explicit publication acceptance checklist; still open.
- [Blueprint 2464](https://github.com/tangle-network/blueprint-agent/issues/2464): gap analysis across definition/run/archive/RL/new-arm/insight stages.
- [ADC 8717](https://github.com/tangle-network/agent-dev-container/issues/8717): egress counter reconciliation/Worker cutover; open but last updated Oct 1. Current release evidence may supersede parts; do not equate open issue with current outage.
- [ADC 7548](https://github.com/tangle-network/agent-dev-container/issues/7548): shapes/pools/plans and metering design.
- [ADC 8988](https://github.com/tangle-network/agent-dev-container/issues/8988): native token-continuation cleanup requires root-container qualification; separate from #9017's managed launch fix.
- [ADC 7981](https://github.com/tangle-network/agent-dev-container/issues/7981): Intelligence storage billing not charging; open, not independently reproduced here.
- [Router 551](https://github.com/tangle-network/tangle-router/issues/551): missing trusted direct-route pricing and upstream credential failure; open, not independently reproduced here.
- [Router 505](https://github.com/tangle-network/tangle-router/issues/505): advertised completion-token ceiling can exceed enforced pricing ceiling.

The ADC `docs/processes/ROADMAP.md` exists but covers many subsystems and mixes historical/current entries.
It does not replace a focused completion checklist for this request.

## Consolidated remaining checklist for root to post

- [ ] Genuine successful native interactive Claude recording and same-session reconnect proof.
- [ ] Commit all owned deliverables, including local homepage/code-example changes and recording source/receipts; preserve unrelated dirty files.
- [ ] Finish and ship the approved incremental homepage story while preserving current visual design and scroll interactions.
- [ ] Run representative published TypeScript and Python examples against hosted Sandbox; explicitly mark unavailable/unexecuted capabilities.
- [ ] Close Router catalog release dates, trusted prices and retired-model availability with current provider evidence.
- [ ] Finish full billing/metering proof: checkout/renewal, dollar-for-dollar credit, paid concurrency, snapshots, egress and settlement; reconcile old billing tracker status.
- [ ] Finish app-level shared UI/SOC 2 verification for Sandbox, Router, Agents, Browser, Audits and Intelligence.
- [ ] Continue benchmark trace/attempt/distribution exploration through shared Charts; resolve publication criteria in existing Blueprint trackers.
- [ ] Finish company/GTM audit recommendations that remain unapplied; record decisions separately from shipped UI.

## Evidence limits

Fresh checks are HTTP content/API checks, GitHub states, npm/PyPI metadata and ancestry.
No visual browser regression run or paid end-to-end task was performed by this audit lane.
The ADC generic issue list is capped at 100; targeted billing/native/OpenAPI searches supplement it, not an organization-wide defect census.
Historical `/tmp` website and Router CSS receipts are missing; new HTTP receipts do not recreate that visual evidence.
Existing `state.json` remains root-owned and was not modified here.
