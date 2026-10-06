# tangle-website

Source for [tangle.tools](https://tangle.tools): a static Astro site with React islands, served from Cloudflare Pages.

## Develop

```sh
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # static output in dist
```

Pages live in `src/pages`, blog posts in `src/content/blog`, and benchmark boards in `src/data/benchmarks`.
Brand tokens and shared components come from `@tangle-network/brand` and `@tangle-network/ui`.

## Checks

| Command | What it checks |
| --- | --- |
| `pnpm check:drift` | styling drift against `drift-baseline.json` |
| `pnpm check:blog`, `pnpm check:blog:reader` | blog frontmatter, editorial rules and reader audit |
| `pnpm check:copy` | model-scored copy audit of the built pages (needs `pnpm build` and a router key) |
| `pnpm check:models` | references to deprecated model names |
| `pnpm test:benchmarks`, `pnpm test:cta` | benchmark board records and CTA instrumentation |

## Deploy

Merging to `master` runs `.github/workflows/deploy.yml`.
That workflow builds with the commit SHA, runs `pnpm check:version` against it, and deploys `dist` to the `tangle-website` Pages project.
`.github/workflows/collect-status.yml` refreshes the public status history every six hours.

Agent instructions are in [AGENTS.md](AGENTS.md).
