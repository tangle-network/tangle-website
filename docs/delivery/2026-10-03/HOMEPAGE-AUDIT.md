# Homepage draft review — October 3, 2026

**Keep the compact examples and the current design. Fix the onboarding gaps before shipping this increment. The broader product, workflow and enterprise story remains unfinished.**

- Preview: <http://127.0.0.1:4391/>
- Draft: [PR 225](https://github.com/tangle-network/tangle-website/pull/225), audited at `ae6808ea8bb681bbaa0cf85ee2eecee9ddd18ff0`.
- Implementation: `a08bf8c1bf54b2c931f5e003c8c6022bb5f5d865`.
- Compared with current [production](https://tangle.tools/) and remote master `e1d4a07c017c2a3a47939f1acf099c278a9b397d`.
- This pass changes no product code and deploys nothing.

## What is available to verify

| Area | Draft change | Assessment |
|---|---|---|
| Hero | Broader subhead about models, tools, workflows and products | Same approved visual design; wording still lists capabilities rather than connecting them |
| Examples | Light, compact panel directly below the hero; TypeScript/Python controls inside its header | Useful improvement; retains line numbers, highlighting and copy controls |
| Example coverage | Run code, files, agent calls, app preview, pause/resume, parallel sessions and network policy | Useful primitives; not full product coverage |
| Agent tiles | Existing visible tiles now link to Sandbox with a selected harness | Better than decorative “running” statuses; Prime remains absent |
| Product cards | New shared API-key/balance introduction | Clear proposition; cross-product billing still needs customer-flow verification |
| Enterprise close | Invitation to build a workflow with Tangle | Adds the audience, but does not demonstrate an engagement or result |
| Scroll walkthrough | Existing coding trace and review sequence retained | No new workflow animation or native TUI recording in this draft |

Python examples use HTTPX and the REST API. They are not a published native Python SDK: the checked `tangle-sandbox` PyPI endpoint returns 404.

## Findings, in delivery order

### 1. Show agent failures correctly

`src/data/sandboxQuickstart.ts:76,160` prints response text without consistently consulting `success`. The SDK can return `{ success: false, error }` without throwing. A failed example can therefore print `undefined`; a parallel run with partial output can hide its error.

Use `result.success ? result.response : result.error`. Executable verification scripts should also return a failed exit status after cleanup. This needs no try/catch wrapper.

### 2. Complete the visible first-run setup

The component shows installation but omits where to get/set `TANGLE_API_KEY` and how to run the file. Imports and local variables are complete; the onboarding path is not.

Add a compact key link and copyable setup/run commands inside the existing component. Validate from an empty directory. Keep instructions short; do not add another paragraph above the panel.

### 3. Add the requested Prime Agent tile

Pi is present. Prime Agent is absent from `src/pages/index.astro:86–95`, although the maintained Sandbox launcher accepts `harness=prime`. This is an unresolved earlier request, not a newly introduced regression. Verify the selected harness through the new-sandbox page without starting a paid instance.

### 4. Make the first example worth doing

“Create a sandbox. Run your code.” and a Node-version check demonstrate setup, not why someone should build on Tangle. The agent example also asks for the Node version. The parallel example inspects versions/files.

Keep `Run code` as a connectivity example. Give `Run an agent` one bounded, useful task that produces a real file or result, and prove it through hosted Sandbox before showing its output. A stronger heading candidate is **“Run agents from your application.”** No type enlargement is needed.

The Python default is substantially denser: startup polling fills the first visible portion of the panel before the useful command. Highlighting works, but visual parity with TypeScript does not imply API ergonomics parity. Keep the sample truthful; a maintained Python client is separate product work.

### 5. Broaden the demonstrated work, not only the wording

The hero now promises products and workflows. The detailed story still goes from a coding run to trace analysis to testing guidance. An enterprise buyer receives a contact button after the developer story. Browser work, research, customer-facing products and operational workflows are not demonstrated.

Preserve the existing scroll treatment. Add one real non-coding workflow using that visual language, showing its input, execution, useful output and starting point. Do not add a catalog of invented application screens. Native TUI media remains a separate unfinished deliverable.

The existing trace is explicitly labeled illustrative; the PR/Linear/Slack cards are examples. They are not recorded runs. This draft does not introduce fake terminal footage, but it does not fulfill the requested real demonstration either.

### 6. Tighten the surrounding copy

- Hero candidate: “Run agents in your products and workflows. Give each run an isolated workspace and inspect what happened.” It connects the audience to the demonstrated behavior more directly than the new list of verbs.
- Closing copy: remove the unconditional “We’ll build it with your team.” Keep a clear conversation action such as “Discuss your workflow,” supported by a defined engagement when that offer is ready.
- The same destination is called workbench, developer console and console. Use a consistent action, such as “Open Sandbox.”
- The inherited pricing paragraph explains absent credit and checkout procedure at length. Shorten it after checking the exact purchase terms; do not restore unverified quotas or bonus credits.

## What was checked

| Check | Evidence and limit |
|---|---|
| Current desktop appearance | Opened live and local pages; inspected hero and quickstart screenshots at a measured 1440×1000 viewport |
| Python selection/highlighting | Switched the control; filename, highlighted source and install command changed to Python/HTTPX |
| Desktop width | Measured document width 1434 inside a 1440 viewport; no page-level horizontal overflow in that state |
| Source/API contracts | Reviewed all example requests against maintained SDK and route sources; no confirmed invalid method or request shape |
| Harness destinations | Existing identifiers match the launch allowlist; authenticated continuation not newly exercised |
| Documentation | Current SDK reference and organized TypeScript/Python guide destinations return 200 |
| Preserved example checks | Exact data hash matches saved TypeScript checks against SDK 0.60.9 and Python syntax checks; current npm 0.60.13 was not requalified |
| Fresh copy/mobile/expanded selection checks | Incomplete: browser commands timed out, the phone override did not reach the draft, and a fresh tab attempt timed out. These are verification gaps, not diagnosed product failures |
| Earlier UI receipts | Existing checks cover original Run/Files/Agent copying and responsive layouts; not relabeled as fresh coverage of every expanded example |
| Hosted execution | Not performed in this audit. No new paid sandbox, inference, network-policy, persistence or cross-product billing proof |

Additional release risks: UI 11.15.1 expects brand ^1.10 while the local linked package is 0.9; CSS/renderer imports depend on private distribution paths. The local render works, but this is not a fresh frozen-install/Cloudflare build acceptance. TypeScript examples clean up on normal completion; thrown errors can leave the sandbox until its configured lifetime expires.

The current examples do not demonstrate interactive TUI streaming, fleet APIs, workflow APIs, GPU execution or trace analysis. Parallel agents are separate sessions sharing one sandbox, not separate isolated computers.

## Recommended next increment

1. Fix failure output, visible setup and Prime discovery.
2. Give the agent example a useful, hosted-verified task; keep the compact component and current visual system.
3. Simplify hero/closing/action copy without adding more sections of explanation.
4. Recheck the expanded controls and phone layout, then run the scoped release gate against the current packages.
5. Develop the real workflow story separately; do not describe PR 225 as completing the broader homepage vision.

## Browser artifacts

- [Current live hero](homepage-audit/live-desktop-hero.png)
- [Draft hero](homepage-audit/draft-desktop-hero.png)
- [Draft TypeScript panel](homepage-audit/draft-desktop-quickstart.png)
- [Draft Python panel](homepage-audit/draft-desktop-python.png)

The preview is retained for user review. Temporary browser viewport overrides were cleared. No production change was made.
