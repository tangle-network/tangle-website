---
name: tangle-blog-editor
description: "Audit, rewrite, or improve Tangle website blog posts in src/content/blog. Use for existing MDX posts that need stronger Tangle voice, SEO/AEO structure, answer capsules, proof blocks, internal links, FAQ, and publication-ready technical clarity."
---

# Tangle Blog Editor

Use this skill when editing existing Tangle blog posts, especially the self-improving stack, x402 Production Runway, Tangle Re-Introduction, Sandbox, Router, Browser Agent, Blueprint SDK, and agent infrastructure posts.

This skill turns technically correct drafts into website-grade posts. It does not replace research. It forces the post to begin from reader pressure, carry Tangle-specific proof, and end with a builder decision.

## Required References

Read these before acting:

- `references/voice-and-style.md` for the Tangle blog voice, banned patterns, and rewrite target.
- `references/rewrite-rubric.md` for the scoring rubric and per-post improvement workflow.

If the user asks for the self-improving stack specifically, also inspect the target post plus nearby series posts so the rewrite preserves series continuity without repeating scaffold language.

## Workflow

1. Identify the post goal.
   - Existing post polish: preserve facts, links, and technical claims unless verified wrong.
   - Structural rewrite: change opening, section order, headings, and examples while preserving the core argument.
   - SEO/AEO upgrade: add query-targeted answer capsules, FAQ, proof, internal links, and direct CTA.

2. Classify the post.
   - Foundation essay: fewer headings, more causal argument, stronger misconception.
   - Operator guide: concrete commands, health checks, failure modes, proof blocks.
   - Comparison post: fair positioning, decision matrix, query-matched title.
   - Architecture post: diagram or image, component flow, readiness checklist.

3. Rewrite the entry vector first.
   - Start from a concrete product, operator, agent, or builder problem.
   - Name the tempting but wrong interpretation.
   - Introduce formalism only after the reader understands why prose is insufficient.

4. Preserve hard parts.
   - Keep math when it disambiguates mutable surface, objective, gate, evidence, or cost.
   - Keep source links when they constrain claims.
   - Do not flatten precise terms into broad AI infrastructure fluff.

5. Add the Tangle layer earlier.
   - Show where Tangle provides the runtime, sandbox, router, Blueprint service, x402 payment path, TEE boundary, operator evidence, or manifest.
   - Do not add generic claims that any infra project could say.

6. Close with a decision.
   - End with what the reader should choose, test, deploy, verify, or avoid.
   - Avoid restated thesis closers.

## Output Rules

- If editing files, modify only the requested MDX post and directly required assets/metadata.
- Keep frontmatter valid for `src/content.config.ts`: `title`, `slug`, `summary`, `date`, `author`, `tags`, optional `series`, `seriesOrder`, `coverImage`, `heroImage`, `imageAlt`, `draft`.
- Preserve internal links unless a better current target exists.
- Add `## FAQ` with `###` questions when the post targets search/agent retrieval.
- Every SEO/AEO rewrite needs at least one exact install, curl, CLI, or API block unless the post is purely conceptual.
- Use images from `public/images/blog/<slug>/` or `public/images/covers/`; do not reference non-existent assets.
- Run `pnpm build` or a narrower available validation after substantive edits.
