# Website share preview

The default Open Graph and Twitter image uses the homepage knot artwork and the canonical Tangle logo.
Authored blog covers keep their own image overrides.

- Source: `scripts/og/og-tangle.svg`
- Renderer: `scripts/og/render-og.mjs`
- Output: `public/images/og-tangle.png` (1200 × 630)

Run from an installed website checkout:

```bash
node scripts/og/render-og.mjs
```

The renderer uses an installed Sharp package, or Astro's Sharp dependency, and the existing files at `public/images/brand/knot-poster.webp` and `public/brand/tangle-logo-light.svg`.
It needs no downloaded fonts or network requests.
Open the generated PNG before committing it.
The homepage and pages without an authored image inherit this preview from `BaseLayout.astro`.
