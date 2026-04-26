// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
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
    filter: (page) => !page.includes('/preview/'),
  }), icon()],

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
