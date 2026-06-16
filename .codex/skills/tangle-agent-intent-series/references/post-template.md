# Agent-Intent Post Template

Use this shape for new Tangle agent-intent posts.

## Frontmatter

```yaml
---
title: '<query-matched title>'
slug: <slug>
summary: >-
  <direct answer with product, proof surface, and buyer outcome>
date: '<YYYY-MM-DD>'
author: Drew Stone
tags:
  - agents
  - infrastructure
  - <product>
coverImage: /images/covers/<slug>.png
heroImage: /images/covers/<slug>.png
imageAlt: '<literal description of the cover image>'
---
```

## Required Body Shape

1. Direct answer capsule in the first 150 words.
2. Problem section: what a builder/operator/agent is trying to decide.
3. Tangle mechanism section: what Tangle provides that changes the decision.
4. Proof section: exact command, curl, manifest, install, API, or code block.
5. Comparison or decision matrix when the query is comparative.
6. Failure modes or "what this does not prove".
7. Direct CTA.
8. `## FAQ` with `###` questions and short direct answers.

## Graduation Gates

- Search Console impressions for the target query or a plausible equivalent.
- Agent citation check can extract the direct answer, proof URL, and CTA.
- One exact install/curl/API/CLI block.
- At least two internal links.
- At least three primary external links when using standards or competitors.
- FAQ is present.
- Image or image plan exists.
- Build passes.

## Internal Link Targets

Use relevant current links from:

- `/services/sandbox`
- `/services/browser-agent`
- `/services/blueprint-agent`
- `/blog/how-blueprints-work`
- `/blog/how-tangle-verifies-work`
- `/blog/trusted-execution-on-tangle`
- `/blog/blueprint-sdk-x402-payments-runnable-jobs`
- `/blog/decentralizing-x402-facilitator`
- `/blog/blueprint-tee-x402-production-gating`
- `/blog/self-improving-stack-agent-runtime-topology`
- `/blog/self-improving-stack-trace-systems`
- `/blog/self-improving-stack-evaluation-gates`
