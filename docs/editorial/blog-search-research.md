# Blog Search Research

Checked: 2026-08-01.

This is a language-and-intent study, not a volume report.

No authenticated Google Ads Keyword Planner or Search Console export was available in this pass, so the phrases below are not presented as monthly-volume estimates.

The durable source of demand is our own Google Search Console query and page data.

Use this file to choose wording until that measured export is available, then replace directional phrases with measured query families and keep the date and region.

The starting map came from the existing company `seo-engine` configuration.
That map reused three phrases across eight posts, so this pass gives those pages distinct directional owners to reduce self-competition; Search Console data decides whether the owners should change.

## What the current results show

### “AI agent sandbox”

The result set contains product documentation and infrastructure explainers, including Alibaba Cloud's Agent Sandbox documentation, the Kubernetes Agent Sandbox documentation, and Tangle's own page.

The useful intent is not “mention sandbox often.”

It is “what environment lets an AI agent run files, processes, network calls, and state without giving it a developer's machine?”

Sources:

- [Alibaba Cloud Agent Sandbox](https://www.alibabacloud.com/help/en/cs/user-guide/agent-sandbox/)
- [Kubernetes Agent Sandbox](https://agent-sandbox.sigs.k8s.io/docs/)
- [Tangle AI Agent Sandbox](https://tangle.tools/blog/ai-agent-sandbox/)

### “x402 payments for AI agents”

The result set uses the exact phrase in explanatory articles, protocol material, and product pages.

The common answer shape is a five-step flow: request, `402 Payment Required`, payment proof, retry, and paid response.

The Tangle distinction worth owning is that request payment answers “may this call proceed?” while a Blueprint's evidence and verification answer “was the work correct?”

Sources:

- [Tangle x402 Payments for AI Agents](https://tangle.tools/blog/x402-payments-for-ai-agents/)
- [x402 payment protocol whitepaper](https://x402.org/wp-content/uploads/sites/10/2026/06/x402-whitepaper.pdf)
- [AgentCash payments for AI agents](https://agentcash.dev/learn/payments-for-ai-agents)

### “AI agent observability”

The result set consistently defines the phrase as reconstructing a multi-step run, including model calls, tool calls, state changes, latency, cost, and outcomes.

That language is more useful than the internal term “worker observability” on its own.

Sources:

- [Grafana GenAI Agent Observability](https://grafana.com/docs/grafana-cloud/monitor-applications/ai-observability/genai/agent-observability/)
- [IBM AI agent observability](https://www.ibm.com/think/insights/ai-agent-observability)
- [LangChain AI agent observability](https://www.langchain.com/resources/agent-observability)

### “AI code audit” and “AI security audit”

The result set separates a code audit from a generic model review by naming the artifact under review, the vulnerability classes, the evidence for a finding, and the remediation path.

Pages that earn attention lead with the failure a buyer recognizes, then state scope, method, and limits.

Sources:

- [Amura AI code audit](https://amurasoftware.com/en/services/ai-code-audit)
- [Sherlock AI-generated code security audit](https://www.sherlockforensics.com/pages/ai-code-audit.html)
- [Breachroad AI and LLM security audit guide](https://breachroad.com/en/blog/ai-llm-security-audit-guide/)

## New query owners added in this pass

These eight posts were missing from the existing `seo-engine` content map.

The phrases are directional owners selected from the title, reader problem, and current search language.

| Post | Primary query | Intent | Confidence | Next check |
| --- | --- | --- | --- | --- |
| `agent-readiness-index-methodology.mdx` | AI coding agent API integration | methodology | medium | Search Console query family |
| `agent-profile-materialization-contracts.mdx` | AI agent profile | definition | medium | Search Console query family |
| `agent-runtime-generic-executor-deletion.mdx` | AI agent runtime architecture | architecture | low | Search Console and SERP review |
| `agent-runtime-worker-observability.mdx` | AI agent observability | definition | high | Search Console query family |
| `codetracebench-benchmark-measured-wrong-capability.mdx` | AI coding agent benchmark | benchmark | medium | Search Console query family |
| `distributed-training-demo.mdx` | distributed training communication reduction | technical result | medium | Search Console query family |
| `rsa-recursive-self-aggregation.mdx` | recursive self-aggregation | research method | medium | Search Console query family |
| `30-blueprints.mdx` | Tangle blueprints | branded category | medium | Search Console branded/non-branded split |

These phrases should not be repeated mechanically.

If the page's measured queries differ, update the owner and rewrite the title or opening only when the new language still describes the same reader problem.

## Measurement plan

1. Export Google Search Console query and page rows for the last 28 days before edits.
2. Group close variants by intent, not by exact spelling.
3. Record the owning URL, title, description, and first-paragraph version for each group.
4. Recheck the same query and page groups after the page has had time to be crawled and served.
5. Record impressions, clicks, click-through rate, position, and which URL received each query.
6. Use Bing Webmaster Tools AI Performance when enabled to record citations, cited pages, and grounding queries.
7. Run answer-engine checks with a fixed prompt set and report successful attempts, provider failures, citations, cited URLs, and support for the cited claim.

Do not call a directional keyword list a ranking forecast.

## Method sources

- [Google Search Console Performance report](https://support.google.com/webmasters/answer/17010961)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google's generative AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Bing AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- [GEO: Generative Engine Optimization](https://arxiv.org/abs/2311.09735)
