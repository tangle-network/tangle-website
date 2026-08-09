// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const buildRevision = process.env.TANGLE_BUILD_REVISION?.trim();

if (buildRevision && !/^[0-9a-f]{40}$/i.test(buildRevision)) {
  throw new Error('TANGLE_BUILD_REVISION must be a full 40-character Git SHA');
}

// https://astro.build/config
export default defineConfig({
  site: 'https://tangle.tools',
  output: 'static',
  // Hide the dev toolbar so it doesn't leak into design-audit screenshots.
  // The toolbar's Inspect/Audit/Settings buttons were being flagged as
  // "internal controls visible in marketing flow" on /sandbox, /browser-agent,
  // /brand-kit. Re-enable with ASTRO_DEV_TOOLBAR=1.
  devToolbar: { enabled: process.env.ASTRO_DEV_TOOLBAR === '1' },
  integrations: [react(), mdx(), sitemap({
    filter: (page) => !page.includes('/preview/') && !page.endsWith('/version.json'),
  })],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['astro:content'],
    },
    optimizeDeps: {
      exclude: ['astro:content'],
    },
  },

  adapter: cloudflare(),
});
