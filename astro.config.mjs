// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { loadCatalog } from './src/data/harness-catalog.mjs';

const buildRevision = process.env.TANGLE_BUILD_REVISION?.trim();

if (buildRevision && !/^[0-9a-f]{40}$/i.test(buildRevision)) {
  throw new Error('TANGLE_BUILD_REVISION must be a full 40-character Git SHA');
}

// Real dates only: a blog post's frontmatter `updated`, else `date`. Pages without one get no lastmod, since a build-time stamp changes on every deploy and search engines then ignore the field.
const postDates = new Map();
for (const file of readdirSync('./src/content/blog').filter((name) => /\.mdx?$/.test(name))) {
  const front = readFileSync(`./src/content/blog/${file}`, 'utf8').split(/^---\s*$/m)[1] ?? '';
  /** @param {string} key */
  const field = (key) => front.match(new RegExp(`^${key}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
  const slug = front.match(/^slug:\s*['"]?([^'"\s]+)/m)?.[1];
  const date = field('updated') ?? field('date');
  if (slug && date) postDates.set(slug, date);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://tangle.tools',
  output: 'static',
  // Every page is prerendered; Pages serves this directory as-is. The path
  // stays dist/client so the deploy, status and check scripts read one place.
  outDir: './dist/client',
  // Hide the dev toolbar so it doesn't leak into design-audit screenshots.
  // The toolbar's Inspect/Audit/Settings buttons were being flagged as
  // "internal controls visible in marketing flow" on /sandbox, /browser-agent,
  // /brand-kit. Re-enable with ASTRO_DEV_TOOLBAR=1.
  devToolbar: { enabled: process.env.ASTRO_DEV_TOOLBAR === '1' },
  integrations: [react(), mdx(), {
    // The harness recordings the home page replays, copied from Sandbox into this build.
    name: 'harness-casts',
    hooks: { 'astro:build:done': async ({ dir }) => {
      const out = new URL('harness-casts/', dir);
      mkdirSync(out, { recursive: true });
      for (const url of (await loadCatalog()).casts) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        writeFileSync(new URL(url.split('/').pop(), out), await response.text());
      }
    } },
  }, sitemap({
    serialize: (item) => {
      const slug = new URL(item.url).pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1];
      const date = slug && postDates.get(slug);
      return date ? { ...item, lastmod: date } : item;
    },
    // Runs after the pages are written, so a page whose robots meta says noindex (a Tangle Network protocol post) is left out.
    filter: (page) => {
      const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
      return !pathname.includes('/preview/') && pathname !== '/research' && !pathname.endsWith('.json')
        && !readFileSync(`./dist/client${pathname}/index.html`, 'utf8').includes('content="noindex');
    },
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
});
