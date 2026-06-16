---
name: tangle-agent-intent-series
description: "Create new Tangle agent-intent blog posts from query briefs, gists, outlines, or product specs. Use for posts targeting AI agents, AEO, SEO, Sandbox, Browser Agent, Router, x402, Blueprints, TEE attestation, manifests, OpenAPI, llms.txt, or package discovery."
---

# Tangle Agent-Intent Series

Use this skill when drafting new blog posts meant to be discovered by humans and agents. The first surface is `src/content/blog/*.mdx`, not a landing page.

Agent-intent posts must answer a specific query, prove Tangle's live capability, and leave behind machine-readable evidence an AI agent can cite or act on.

## Required References

Read these before acting:

- `references/program-spec.md` for the current 12-post program from the gist.
- `references/post-template.md` for the required post skeleton and graduation gates.

When drafting a post that compares products, verify current competitor positioning from primary sources before naming feature claims, pricing, or current capabilities.

## Workflow

1. Pick the query and slug.
   - Use the gist/program spec if the requested topic is listed there.
   - If the topic is new, create a one-line brief with primary query, secondary queries, product surface, buyer stage, proof source, CTA, and image need.

2. Collect proof before prose.
   - Prefer live manifests, `.well-known/tangle-agent.json`, OpenAPI, npm package pages, health endpoints, CLI help, package install blocks, Router smoke calls, Sandbox templates, Browser Agent evidence, x402 payment flows, or Blueprint invocation paths.
   - Do not claim live capability until the proof exists or the post clearly marks the item as planned.

3. Draft for answer retrieval.
   - Put a direct one-paragraph answer capsule in the first 150 words.
   - Include comparison tables for "vs" posts.
   - Include exact command/curl/install/API blocks.
   - Include at least two internal links and at least three primary-source external links.
   - Include FAQ with direct answers.

4. Make the Tangle distinction load-bearing.
   - Sandbox: real machine boundary: filesystem, process, network, snapshots, templates, policy, credentials.
   - Browser Agent: DOM evidence, screenshots, goal verification, traces, non-mutating safety where relevant.
   - Router: OpenAI-compatible calls, model discovery, health checks, fallback policy, cost/runtime dependency.
   - x402/Blueprints: payment challenge, retry, paid endpoint, operator work, verification, health, observability.
   - TEE: code identity and execution boundary, not task quality.
   - Discovery: manifests, llms.txt, OpenAPI, package metadata, health URLs.

5. Add visual requirements.
   - Every agent-intent post needs a `coverImage` or in-post image plan.
   - Put generated/static diagrams under `public/images/blog/<slug>/` and cover images under `public/images/covers/`.
   - Use real product states, terminal output, request flows, manifests, or architecture maps. Avoid abstract stock imagery.

6. Publish as MDX.
   - Create `src/content/blog/<slug>.mdx`.
   - Use valid frontmatter for this repo.
   - Keep prose concise, concrete, and proof-backed.

## Definition Of Done

- The post answers the primary query in the first 150 words.
- It contains one exact install, curl, CLI, API, or manifest block.
- It links at least two relevant Tangle pages/posts.
- It links at least three primary external sources when discussing external standards or competitors.
- It includes `## FAQ` with `###` questions.
- It has a direct CTA.
- It avoids generic "build an AI app" framing.
- `pnpm build` passes.
