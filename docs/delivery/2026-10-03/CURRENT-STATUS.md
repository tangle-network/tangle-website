# Current delivery checkpoint

Recorded October 3, 2026; this is a draft handoff, not a completed release.
Remaining acceptance is tracked in [website issue 226](https://github.com/tangle-network/tangle-website/issues/226).
The historical [status audit](./STATUS-AUDIT.md) retains its 22:24 UTC observation time; newer checkpoints below supersede its open-PR and missing-roadmap entries.

## Source checkpoints

| Work | Checkpoint | Delivery state |
| --- | --- | --- |
| Incremental homepage and expanded code examples | [Website draft 225](https://github.com/tangle-network/tangle-website/pull/225), implementation `a08bf8c1bf54b2c931f5e003c8c6022bb5f5d865` | Committed and pushed; not merged or deployed. Existing production typography and scroll interactions remain the baseline. |
| Headless execution source, fixture, original recording and verifier | [Docs draft 197](https://github.com/tangle-network/docs/pull/197), checkpoint `fcd81b1` | Committed and pushed. Actual headless task passed 18 tests and 2,007 finite-input comparisons. The terminal presentation renders SDK events; it is not Claude Code's native TUI. |
| Sandbox SDK guides and shared code controls | Docs [193](https://github.com/tangle-network/docs/pull/193), [194](https://github.com/tangle-network/docs/pull/194), [195](https://github.com/tangle-network/docs/pull/195), [196](https://github.com/tangle-network/docs/pull/196) | Merged; public content checked. Earlier browser proof covers code switching/copy/mobile behavior, not every hosted example. |
| Native managed credentials/model fix | [ADC 9017](https://github.com/tangle-network/agent-dev-container/pull/9017), merge `49e44d6ea94642837aecf9daed68fce961e7bc92` | Included in served Orchestrator `116a31b9aa8bc5eeffb7f1f686645805e356e5b4` at 22:23 UTC. Fresh sandbox Sidecar and successful native task remain unverified. |
| Standalone Sandbox API reference | [ADC draft 9085](https://github.com/tangle-network/agent-dev-container/pull/9085) | Active implementation; source build passed. Browser inspection found the navigation still disappearing on deep endpoint jumps. Ancestor overflow fix and final browser/served-page proof remain pending. |

The [archive README](./README.md) describes the website implementation and its dependency/build gaps.
Rejected prototypes remain under `rejected-prototypes/`; they are historical, unapproved source outside application routes.
No production homepage change is claimed by these draft checkpoints.

## Missing real execution

- Native interactive Claude: create an owned sandbox, verify its Sidecar revision, use `session.interactive()`, complete a real task, handle actual prompts/permissions, reconnect to the same execution, verify files independently, record raw PTY output, and confirm cleanup.
- Homepage examples: execute code, files, agents, app previews, pause/resume, parallel sessions and network policy against hosted Sandbox in TypeScript and Python HTTPX.
- Python: the public `tangle-sandbox` package returned PyPI 404 at 22:23 UTC. Parsed HTTPX examples are not a published Python SDK or hosted execution proof. Remaining product imports of the unavailable package need replacement.
- API reference: verify persistent endpoint navigation after deep jumps on desktop and phone, source-preserving copy, and TypeScript/Python/shell/JSON highlighting in both themes. Parent owns final evidence.
- Billing: prove purchase/renewal, included credits, usage debit, paid concurrency, snapshot limits, egress and settlement through the real customer flow. Public configuration currently reports Pro $29.99/$29.99 usage and Team $99/$99 usage, unlimited paid concurrency, and 10/25 snapshots. This is not enforcement or settlement proof.

No successful native recording or completion ETA is established by the headless result.
The roadmap contains conditional engineering estimates; they are not promised ship dates.

## Remaining product work

The roadmap also tracks Router pricing/release-date/availability coverage; healthy-network operator recovery; richer benchmark attempt/trace/distribution views; shared UI and SOC 2 adoption per app; and unapplied company/GTM recommendations.
Existing subsystem issues retain ownership and acceptance checks; this checkpoint does not close them.

## Inventory and evidence boundaries

[Worktree inventory](./uncommitted-inventory.md) distinguishes session source, duplicate staging copies, and unrelated concurrent edits.
One GTR shared-chart worktree status read timed out; its dirty/unpublished state remains unknown.
Do not infer that all work across all machines or concurrent sessions is committed.

[Four skill-log records](./session-skill-log.jsonl) are exact historical copies; their old pending values do not override merged PR states.
[Handoff manifest](./handoff-manifest.json) hashes the archived audit, inventory, logs and compact receipts.
Raw GitHub responses, credentials, authenticated data, generated caches, and unrelated work are excluded.
Public HTTP proof establishes returned content and version data, not browser behavior or end-to-end task execution.
