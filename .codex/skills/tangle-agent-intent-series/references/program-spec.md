# Tangle Agent-Intent Blog Program Spec

Source: https://gist.github.com/drewstone/7cb516cec9c4faecf0d68732e0537c9b

Date: 2026-06-16

Primary surface: `https://tangle.tools/blog/*`

Decision: run the first 12 agent-intent pages as blog posts, not landing pages. Blog posts ship sitemap URLs, article pages, frontmatter, Open Graph images, and internal listing pages.

## Global Gates

Every agent-intent post needs:

- Query target and slug.
- One-paragraph answer capsule.
- Image or image prompt.
- At least one exact install, curl, CLI, API, or manifest block.
- At least two internal links.
- At least three primary-source external links when external standards/competitors are involved.
- FAQ.
- Direct CTA.
- Live proof when possible: manifests, scoped packages, Sandbox templates, Router smoke calls, Browser Agent evidence, x402 payment flows, or marketplace invocation contracts.

## Live Tangle Surfaces

- Sandbox page: `https://tangle.tools/services/sandbox`
- Tangle root manifest: `https://tangle.tools/.well-known/tangle-agent.json`
- Router manifest: `https://router.tangle.tools/.well-known/tangle-agent.json`
- Sandbox manifest: `https://agents.tangle.tools/.well-known/tangle-agent.json`
- Sandbox health: `https://sandbox.tangle.tools/health`
- Sandbox public templates: `https://sandbox.tangle.tools/v1/public-templates`
- Sandbox package: `npm install @tangle-network/sandbox`

## Post Queue

### 1. Sandbox Core

Primary query: `ai agent sandbox` or `llm sandbox environment`

Core distinction: a sandbox is where an agent gets a real machine, not just an API call. The difference is filesystem, process, network, snapshot, template, credential, and policy control.

Must include:

- Answer capsule.
- Table: agent sandbox vs code interpreter vs browser automation vs serverless job runner.
- Curl proof for Sandbox health and public templates.
- Scoped package install.
- CTA: read Sandbox manifest templates.

### 2. Tangle Sandbox vs E2B

Slug: `tangle-sandbox-vs-e2b`

Primary query: `e2b alternative`

Secondary queries: `tangle sandbox vs e2b`, `ai agent sandbox`

Angle: E2B is the reference point for fast code sandboxes. Compare session lifetime, snapshots, sidecar policy, templates, speed, persistence, and SDK shape. Keep the comparison fair and current.

### 3. Tangle Sandbox vs Daytona and Modal

Slug: `tangle-sandbox-vs-daytona-modal`

Primary/secondary query: `ai dev container` and related comparison terms.

Angle: Daytona, Modal, and Tangle overlap only at "runs code." The buying question is whether the workload is a developer workspace, serverless compute job, or autonomous agent workspace.

Must include:

- Decision matrix by workload.
- Agent workspace definition: files, tools, browser, traces, snapshots, sidecar, credentials.
- Keep Modal strong for serverless GPU/jobs.
- Keep Daytona strong for dev environments.
- Tangle proof: source template slugs `node-typescript` and `python-data-science`.

### 4. Browser Automation For AI Agents

Slug: `browser-automation-for-ai-agents`

Primary query: `browser automation ai`

Secondary queries: `ai browser testing`, `natural language test automation`

Product: Browser Agent

Angle: browser automation for agents is not just "click around with a model." Reliable agents need DOM evidence, screenshots, goal verification, recovery, and reproducible traces.

Must include:

- Answer capsule defining AI browser automation.
- Code block: `bad run --goal "..." --url ...`
- DOM mode, vision mode, hybrid mode.
- Difference from Playwright.
- Browser Agent manifest/package link.
- CTA: install `bad` CLI and run one goal.

### 5. Tangle Browser Agent vs Browserbase vs Browser Use

Slug: `tangle-browser-agent-vs-browserbase-browser-use`

Primary query: `browserbase alternative`

Secondary queries: `browser use alternative`, `ai browser testing`

Angle: compare categories, not brand attacks. Browserbase is hosted browser infrastructure. Browser Use is an agent loop library. Tangle Browser Agent is package and CLI for browser execution evidence.

Must include:

- Fair comparison table: hosted browsers, agent loop, CLI, SDK, testing workflow, evidence artifacts, pricing model if public.
- Safe discovery commands: `bad --help` and `bad run --help`.
- CTA: use Browser Agent for CLI-first automation with screenshots and DOM proof.

### 6. Natural Language E2E Testing For Wallet Apps

Slug: `natural-language-e2e-testing-wallet-apps`

Secondary queries: `ai e2e testing`, `defi wallet testing`, `metamask automated testing`

Product: Browser Agent

Angle: wallet app testing is useful only when it produces hard evidence. Success means screenshots, DOM state, network state, and stopping before destructive signing unless explicitly allowed.

Must include:

- Safety section: non-mutating by default.
- Stop at signature request.
- Capture state.
- `bad run` example.
- CTA: run a non-mutating wallet smoke before shipping DeFi UI.

### 7. x402 Payments For AI Agents

Slug: `x402-payments-for-ai-agents`

Angle: agents can pay per request with a protocol-level payment challenge instead of SaaS billing.

Must include:

- 402 response, payment, retry sequence.
- Tie to Tangle Agent Builder invocation and Blueprint paid services.
- Link to x402.org, Coinbase docs, Stripe docs, Cloudflare article where relevant.
- Conceptual sequence diagram.
- Avoid market dominance claims.
- CTA around programmatic buyers, not seats.

### 8. Deploy A Paid AI Agent Service

Slug: `deploy-paid-ai-agent-service`

Primary query: `how to deploy ai agent service`

Secondary queries: `best SDK for deploying AI agents`, `blueprint sdk deployment`

Product: Blueprint SDK / Agent Builder

Angle: concrete path: package service, expose API, attach payment, route requests, prove work. Do not write a generic "build an AI app" post.

Must include:

- Step-by-step architecture.
- Distinguish Blueprint service from Agent Builder marketplace agent.
- What must be verified before launch.
- Link to Router and Agent Builder manifests.
- Failure modes: auth, payment retry, operator health, observability.

### 9. TEE Attestation For AI Services

Slug: `tee-attestation-ai-services`

Primary query: `tee attestation ai service`

Secondary queries: `verified compute ai`, `secure code execution ai agents`

Product: Tangle protocol / Blueprints

Angle: TEE attestation proves code identity, hardware state, and execution boundary. It does not prove task quality.

Must include:

- "Proves / does not prove" table.
- Where TEE fits in Tangle.
- Link existing trusted execution and verification posts.
- Result verification distinction.
- FAQ.

### 10. Agent Runtime Environments

Slug: `agent-runtime-environments`

Primary query: `agent runtime environment`

Secondary queries: `ai agent infrastructure`, `autonomous agent infrastructure`

Product: Sandbox / Router / agent stack

Must include:

- Definition.
- Table: model router, sandbox, browser, memory/knowledge, eval, payment.
- Clean product infrastructure diagram with Tangle branding.
- CTA: read manifests before picking packages.

### 11. OpenAI-Compatible Routers For Agents

Slug: `openai-compatible-routers-for-agents`

Primary query: `openai compatible router for agents`

Secondary queries: `ai agent infrastructure`, `anonymous llm usage`

Product: Router

Angle: the model router is a runtime dependency. Cover model discovery, health checks, fallback policy, cost attribution, and OpenAI-compatible requests.

Must include:

- Curl proof for Router health/status/models.
- OpenAI-compatible chat snippet.
- Explain `TANGLE_API_KEY`.
- Link Router OpenAPI and Router manifest.
- CTA: call `/v1/models` before hardcoding model IDs.

### 12. How AI Agents Discover Products

Slug: `how-ai-agents-discover-products`

Primary query: `agent seo`

Secondary query: `ai agents products`

Product: all discovery surfaces.

Must include:

- `/llms.txt`
- `/.well-known/tangle-agent.json`
- OpenAPI
- npm/package metadata
- health URLs
- link every live manifest.
