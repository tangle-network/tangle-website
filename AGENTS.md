# Repository Agent Notes

## Tangle Blog Skills

Before auditing, rewriting, or creating blog posts in `src/content/blog`, load the relevant repo-local skill:

- Existing post audit or rewrite: `.codex/skills/tangle-blog-editor/SKILL.md`
- New agent-intent/SEO/AEO post: `.codex/skills/tangle-agent-intent-series/SKILL.md`
- Pre-publish proof check: `.codex/skills/tangle-blog-proof/SKILL.md`

The proof skill includes an executable checker:

```bash
node .codex/skills/tangle-blog-proof/scripts/check-post.mjs src/content/blog/<slug>.mdx
```

Substantive blog changes should also run:

```bash
pnpm build
```
