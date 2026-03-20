// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
// https://astro.build/config
export default defineConfig({
  site: 'https://tangle.tools',
  output: 'static',
  integrations: [react(), mdx(), sitemap()],

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
