// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

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
    filter: (page) => {
      const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
      return !pathname.includes('/preview/') && pathname !== '/research' && pathname !== '/version.json';
    },
  })],

  vite: {
    resolve: {
      alias: {
        // The recorded run needs the maintained timeline, not the full chat UI.
        '@tangle-network/ui/chat': fileURLToPath(new URL(
          './node_modules/@tangle-network/ui/dist/chat/agent-timeline.js',
          import.meta.url,
        )),
        // Only the shared code components are used here; keep this entry
        // independent of the rest of the Markdown barrel.
        '@tangle-network/ui/markdown': fileURLToPath(new URL(
          './node_modules/@tangle-network/ui/dist/markdown/code-block.js',
          import.meta.url,
        )),
      },
    },
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['astro:content'],
    },
    optimizeDeps: {
      exclude: ['astro:content'],
    },
  },

  // These pages are static. Render their React islands in Node at build/dev
  // time; Cloudflare still serves the generated site through the same adapter.
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});
