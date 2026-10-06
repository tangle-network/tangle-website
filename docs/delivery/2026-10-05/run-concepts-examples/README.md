# Run an agent: choose the sandbox, harness, model and profile

The homepage "Run an agent" example now shows the canonical run model, [Run = Sandbox + AgentProfile + Prompt](https://github.com/tangle-network/agent-dev-container/blob/develop/docs/specs/agent-run-concepts.md).
Two selectors pick the harness and the model. The code updates to match, and the copy button copies the full program for that pair.

| | Desktop | Phone |
| --- | --- | --- |
| Before (tangle.tools) | [before-desktop-agent.png](before-desktop-agent.png) | [before-mobile-agent.png](before-mobile-agent.png) |
| After, default pair | [after-desktop-agent.png](after-desktop-agent.png) | [after-mobile-agent.png](after-mobile-agent.png) |
| After, Codex | [after-desktop-agent-codex.png](after-desktop-agent-codex.png) | [after-mobile-agent-codex.png](after-mobile-agent-codex.png) |
| After, Codex in Python | [after-desktop-agent-codex-python.png](after-desktop-agent-codex-python.png) | |

## Verification

Run on beelink1 against the production Sandbox API on 2026-10-05, using published `@tangle-network/sandbox` 0.60.14, Node 24.21 and Python 3.13 with httpx.

- **Types and syntax.** Each TypeScript program the page can copy, covering every offered harness and model pair, typechecks under `strict`. Each Python program compiles. The quickstart component and its data typecheck under `strict`.
- **TypeScript, live.** One run per offered pair, each against a real sandbox:
  - claude-code: Claude Sonnet 5.5 and Claude Opus 5.5;
  - codex: GPT-5.6 Luna and GPT-5.5;
  - opencode: both Claude models, both GPT models and GLM-5.3;
  - pi: GPT-5.5 and GLM-5.3.

  Each run returned a summary of the cloned repository.
- **Python, live.** The default pair (claude-code with Claude Sonnet 5.5) passed, as did opencode with Gemini 3.8 Flash and the parallel example. The parallel example failed once: opencode returned an invalid assistant message on the Router's default model. It passed on retry.
- **Excluded pairs.** These failed and are not offered:
  - pi with the Claude models: the Router rejects the `developer` role;
  - pi with GPT-5.6 Luna: tools with reasoning effort are unsupported on chat completions;
  - pi with Gemini 3.8 Flash: missing `thought_signature`;
  - DeepSeek V4.1 Flash on every harness: tangle-router#551.

  Gemini 3.8 Flash passed on opencode but is left out, because `pnpm check:models` matches it against the cached Gemini deprecation list.
- **Python examples now stream.** The blocking `/runtime/agents/run` endpoint returns 500 after 30 seconds (agent-dev-container#9381), so the Python agent examples read `/runtime/agents/run/stream` and send the profile with the run (agent-dev-container#9380).
- **Site checks.** `pnpm build` passed, and so did `pnpm check:models`. Screenshots are from the built site served with `astro preview`, at 1440×1000 and 390×844. The page does not scroll horizontally.

The phone check covers the layout only; it was not done on a real device.
