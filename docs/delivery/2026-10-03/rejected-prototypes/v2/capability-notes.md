# Native agent terminals and shared billing

Checked October 2, 2026 against ADC `d205ef1587d5b6c48822786b18cc466e0212e47c`, published Sandbox `0.60.3`, and published Agent Interface `2.16.0`.
No paid task, remote mutation, or hosted terminal session ran in this investigation.
These are source and package checks, not a production readiness test.

## Decisions for the prototype

- Claude Code, Codex, Pi and OpenCode have native TUI launch paths with an initial prompt.
- Use the SDK native session path when claiming an agent session: `workspace.session(id).interactive()`.
- Use `initialPrompt` to launch with a task; the runtime supplies the CLI's native prompt argument after materializing its configuration.
- Render terminal bytes with the existing terminal component/emulator; raw PTY data contains ANSI control sequences.
- Read files and expose the app port from the same sandbox to show the resulting product.
- Create research workers through the existing fleet API, then collect their actual artifacts.
- Keep the account API key on the server; browser terminals use short-lived scoped tokens and the maintained interactive control controller.
- Automatic Router selection and evaluations remain untested here; do not describe them as verified behavior.

Scrolling can reveal a recorded or illustrative sequence without creating paid work.
A real customer launch needs an authenticated server action that creates once and reconnects to the same session.
A scroll-triggered UI animation is not evidence that a live remote agent was launched.

## Supported native API

The supplied `interactive-example.js` exports `interactiveExample`, `interactiveHarnesses` and `researchWorkflowExample`.
Its complete 43-line TypeScript example starts native Claude Code to research “How should we run agents inside our product?” and streams terminal bytes.
The prompt names the SDK reference, harnesses and authentication documentation, then requests `/workspace/research/brief.md` with source URLs.
Changing `profile.harness` to `codex`, `pi`, or `opencode` uses the same native session contract.
The example includes every import and definition, with no try/catch/finally.
The sandbox expires after 15 minutes; the example keeps the connection open to stream output.
It does not assert that the research finished successfully or display a fabricated result.

The exact start request requires profile and run identity digests.
Those digests come from the maintained Agent Interface helpers; inventing a shorter `spawnAgent()` API would misrepresent the current SDK.
The example should fit a detailed code view rather than forcing all of this ceremony into the hero.

Follow-up prompts use `handle.sendPrompt()` with the admitted reference, current control claim, operation ID and `interactivePromptRequestDigest()`.
Attaching without an explicit control claim acquires a newer claim, so a caller must not reuse a stale claim from `start()` afterward.
The example passes the returned claim explicitly and registers its output handler before connecting, so replay frames are not missed.

Plain terminals also exist: `workspace.terminals.attach(connectionId, { command, handlers })`, `stream.write(data)`, `stream.resize(cols, rows)`, and `stream.close()`.
That lower-level path does not by itself establish native agent profile preparation, model credentials, structured traces or completion.
Do not infer normalized tool traces from a PTY recording; trace ingestion needs its own verified connection.

## Shared key and balance

The same Tangle account API key is accepted by Sandbox, Router, Intelligence and Workflows, subject to its scopes and account access.
The Platform service owns the central ledger.
Sandbox compute, Router inference, Intelligence analysis and trace storage all have deductions against that ledger.
This supports the message: **Use your Tangle balance for sandboxes, models and Intelligence.**

Provider subscriptions and BYOK are separate funding paths.
A Claude subscription is not purchased by the Tangle balance merely because the Claude TUI runs in a sandbox.
The implementation evidence does not establish that every deployed accounting path is reconciled correctly.
No current prices, discounts, inference success rates or automatic optimization claims were inferred here.

## Evidence

| Fact | Source |
| --- | --- |
| Exact native start, prompt and attach methods | [SDK interactive handle](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/sdk/src/interactive.ts) |
| Session binds its native interactive handle | [SDK session](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/sdk/src/session.ts) |
| Native TUI binaries and initial prompt arguments for the requested harnesses | [Interactive launch registry](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/apps/sidecar/src/interactive/interactive-harness-launch.ts) |
| Profile materialization and native PTY launch | [Interactive session launch](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/apps/sidecar/src/interactive/interactive-session-launch.ts) |
| Terminal byte streaming, replay, scoped authentication | [Terminal stream](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/sdk/src/terminal-stream.ts) |
| Shared account key for Workflows | [Workflow docs](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/web/src/docs/content/workflows.md) |
| Sandbox central balance ownership | [Quota credit path](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/api/src/services/quota.ts) |
| Compute deductions use the Sandbox product and billing owner | [Compute deduction contract](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/sandbox/api/src/lib/usage-deduct-params.ts) |
| Router key verification and central deduction calls | [Router Platform client](/Users/drew/webb/_wt/router-live-operator-availability-20261002/lib/platform-client.ts) |
| Intelligence verifies the same Platform account key | [Intelligence auth](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/intelligence/api/src/middleware/auth.ts) |
| Intelligence analysis charges the central ledger | [Agentic billing](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/intelligence/api/src/lib/agentic-billing.ts) |
| Trace storage charges the central ledger | [Storage billing](https://github.com/tangle-network/agent-dev-container/blob/d205ef1587d5b6c48822786b18cc466e0212e47c/products/intelligence/api/src/lib/billing.ts) |

## Example verification

The example passed strict TypeScript `6.0.3` checking with zero diagnostics.
The check used published Sandbox `0.60.3`, Agent Interface `2.16.0` and Zod `4.6.5` declarations, with dependency declaration checking skipped.
Agent Interface and Zod tarballs were read in memory from npm and their SHA-512 registry integrity values verified.
No package installation or source-project build occurred.
The resolved types were `SandboxInstance`, `InteractiveSessionHandle`, `InteractiveSessionStartResult` and `AgentExactRunControlRef`, not `any`.
No hosted execution, authentication, rendering or generated research brief was verified by this check.
The passing TypeScript result is reused after changing only the prompt string and documentation link; imports, declarations and API calls are unchanged.

## Research workflow example

The 41-line `researchWorkflowExample` matches the prototype's research scene.
Its webhook input is a JSON `question`, with the exact prototype question shown in the opening comment.
The `docs` and `compare` nodes have `needs: []`, so they run independently in parallel.
The `brief` node declares `needs: [docs, compare]`, combines both outputs, writes `/workspace/research/brief.md`, and returns its text for approval.
The final decision presents that returned brief to a person.
The brief step is sandboxed, since a pure inference step could not write the requested file.

`compileWorkflowYaml()` accepted this exact YAML with `ok: true`.
The compiled graph contained `docs → brief`, `compare → brief`, and `brief → step-4` (the approval decision).
No research output, published file, hosted workflow run or approval was fabricated or executed.

## Existing recordings

An actual OpenCode adapter recording is retained at [/tmp/adc-pr-convergence-20261002/packages/sdk-provider-opencode/proof/owned-plan-stop/uncut.cast](/tmp/adc-pr-convergence-20261002/packages/sdk-provider-opencode/proof/owned-plan-stop/uncut.cast).
Its [README](/tmp/adc-pr-convergence-20261002/packages/sdk-provider-opencode/proof/owned-plan-stop/README.md) identifies source `4ec6cb583`, OpenCode `1.18.32`, a local Z.AI subscription run and a controlled PlanHost.
The asciicast is 110×42, contains 10 output frames, and ends at 13.087538 seconds.
The [MP4](/tmp/adc-pr-convergence-20261002/packages/sdk-provider-opencode/proof/owned-plan-stop/playback-4x.mp4) is accelerated 4× with shortened idle intervals.
This recording concerns a plan stop, not Fieldnotes, a hosted Sandbox run or the proposed research workflow.
It should not be relabeled as evidence of those tasks.

A Claude run receipt at [/tmp/adc-pr-convergence-20261002/docs/proofs/claude-native-model-20261001/native-receipt-r8.json](/tmp/adc-pr-convergence-20261002/docs/proofs/claude-native-model-20261001/native-receipt-r8.json) records `status: failed` and `success: false`.
It is not usable as a success demonstration.
Other terminal video files were found under `/tmp/rc-demo-proof/run-0450fccd522f`, but their task/source provenance was not established in this bounded pass.
No recording was copied, edited or embedded in the prototype by this investigation.
