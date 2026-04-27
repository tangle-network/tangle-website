# OG Image Generation

Static Open Graph / Twitter card images for tangle.tools, version-controlled so they never regress off-brand.

## Files

- `og-default.html` — source template for the default OG image (homepage + any page without an explicit `image` prop in `BaseLayout.astro`)
- Future: `og-<surface>.html` per named surface (e.g. `og-router.html`, `og-evals.html`)

## Brand constraints (from `src/pages/brand-kit.astro`)

- **Fonts:** Space Grotesk (primary, 700 weight for headlines), Space Mono (technical / tags)
- **Brand primary:** `#7B61FF` — gradient `#8E59FF` → `#6888F9` on the logomark and accents
- **Background:** homepage hero poster (`public/images/hero/glass-cylinders-poster.jpg`) inlined as base64 for deterministic render, with dark-left gradient overlay for text legibility
- **Logo:** inline the canonical `public/brand/tangle-icon-filled.svg` mark (no chip container — same presentation as the header Logo component)
- **Canvas:** 1200×630 (standard OG)

## Regenerating

1. Edit `og-default.html`. Keep the inline base64 image block in sync with `public/images/hero/glass-cylinders-poster.jpg` — if that file changes, regenerate the base64 block from the same file and paste it into the `background-image: url("data:image/jpeg;base64,...")` line.
2. Render at 1200×700 and crop to 1200×630 to work around Chrome headless clipping the bottom when window-size matches body height exactly:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,700 --virtual-time-budget=8000 \
  --screenshot=/tmp/og-raw.png \
  "file://$PWD/og-default.html"

python3 -c "from PIL import Image; Image.open('/tmp/og-raw.png').crop((0,0,1200,630)).save('../../public/images/og-default.png')"
```

`virtual-time-budget=8000` gives Google Fonts time to load. The 70px headroom + crop is necessary because Chrome's `--headless=new` clips the last ~80px when `--window-size` matches the body height exactly.

3. Verify the output visually at full size before committing. The HTML is authoritative — if the PNG drifts from the HTML, regenerate.

## TODO (future improvement)

Migrate to an Astro integration (`astro-og-canvas` or `@vercel/og` / Satori) so OG images are built during `astro build` from a shared template + page frontmatter. Removes the manual regeneration step and gives every page a per-page OG card. Tracked separately.

## History

- **2026-04-20:** initial template. Replaces an off-brand image (wrong font, undersized logo, no hero). Iterated through chip-style and wordmark layouts; final version uses the glass-cylinders hero poster with clean mark + wordmark top-left, matching the live homepage hero.
