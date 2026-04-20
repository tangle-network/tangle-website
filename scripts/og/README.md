# OG Image Generation

Static Open Graph / Twitter card images for tangle.tools, version-controlled so they never regress off-brand.

## Files

- `og-default.html` — source template for the default OG image (homepage + any page without an explicit `image` prop in `BaseLayout.astro`)
- Future: `og-<surface>.html` per named surface (e.g. `og-router.html`, `og-evals.html`)

## Brand constraints (from `src/pages/brand-kit.astro`)

- **Fonts:** Space Grotesk (primary, 700 weight for headlines), Space Mono (technical / tags)
- **Brand primary:** `#7B61FF` — gradient `#8E59FF` → `#6888F9` on the logomark and accents
- **Background:** `#0A0A14` with subtle 60px grid + brand-color radial glows
- **Logo:** use `public/brand/tangle-logo-light.svg` or inline the SVG paths directly (templates here inline for fidelity)
- **Canvas:** 1200×630 (standard OG), not the non-standard sizes the previous image used

## Regenerating

1. Edit the HTML template in-place
2. Render at 1200×630 via headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1200,630 \
  --virtual-time-budget=5000 \
  --screenshot=../../public/images/og-default.png \
  "file://$PWD/og-default.html"
```

Virtual-time-budget waits for Google Fonts to load before screenshotting. Do not skip this flag — without it Chrome can fire the screenshot mid-font-load and you get system fallback fonts.

3. Verify the output visually. Commit both the HTML and the generated PNG. The HTML is authoritative — if the PNG drifts from the HTML, regenerate.

## TODO (future improvement)

Migrate to an Astro integration (`astro-og-canvas` or `@vercel/og` / Satori) so OG images are built automatically during `astro build` from a shared template + page frontmatter. Removes the manual regeneration step entirely and gives every page a per-page OG card. Tracked separately.

## History

- **2026-04-20:** initial template. Replaces an off-brand image (wrong font, no Space Grotesk, undersized logo) that was deployed directly to Cloudflare Pages without a matching source file in this repo.
