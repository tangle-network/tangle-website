#!/usr/bin/env node
/**
 * Local dead-link check — runs linkinator against the built static
 * site at dist/client/. Catches:
 *   - broken internal anchors (typo'd /partner/foo, missing /blog/x)
 *   - dead outbound links (404 from partner sites, dead docs URLs)
 *   - bad <img src> paths
 *
 * Run: pnpm check:links
 *
 * CI uses lychee (see .github/workflows/check-links.yml) for the
 * authoritative check; linkinator is the local fast-feedback path so
 * contributors don't need a Rust toolchain.
 *
 * Exits non-zero on any BROKEN link so it can gate scripts/CI.
 */
import { LinkChecker } from 'linkinator';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist/client');

if (!existsSync(ROOT)) {
  console.error(`✗ dist/client/ not found at ${ROOT}`);
  console.error('  Run `pnpm build` first.');
  process.exit(2);
}

const SKIP_PATTERNS = [
  '^https?://(twitter|x)\\.com',
  '^https?://(www\\.)?linkedin\\.com',
  '^https?://github\\.com/.*#',
  '^https?://fonts\\.googleapis\\.com',
  '^https?://discord\\.gg',
  // Bp-agent partner pages — most live via the partner generator
  // shipped on `feat/vertical-0-to-1-factory`, but the branch hasn't
  // been merged to ai.tangle.tools production yet. Drop this skip
  // once that PR lands so dead `/partner/<slug>` links fail CI.
  '^https?://ai\\.tangle\\.tools/partner/',
  // Own-domain URLs are validated by the deployment pipeline. Local
  // feature-branch builds may generate canonical URLs for pages/assets
  // that do not exist on production until the branch is deployed.
  '^https?://tangle\\.tools/',
  '^https?://ai\\.tangle\\.tools/',
  '^https?://docs\\.tangle\\.tools/',
  // Private repo — anonymous fetch returns 404 by design.
  '^https?://github\\.com/tangle-network/blueprint-agent(\\b|$|/)',
  // Deferred sandbox product screenshot. The rendered fallback handles
  // absence; keep this aligned with lychee.toml until the image lands.
  'images/products/sandbox-app\\.png$',
];

const checker = new LinkChecker();
let pages = 0;
checker.on('pagestart', (url) => {
  pages++;
  process.stdout.write(`  ▸ ${url}\n`);
});

console.log('▸ scanning dist/client/ recursively…');

// When `serverRoot` is set, linkinator joins it with each `path`
// before globbing. Paths must therefore be RELATIVE to serverRoot,
// not to cwd.
const result = await checker.check({
  path: ['*.html', '**/*.html'],
  recurse: true,
  linksToSkip: SKIP_PATTERNS,
  timeout: 15000,
  retry: true,
  concurrency: 12,
  serverRoot: ROOT,
});

const broken = result.links.filter((l) => l.state === 'BROKEN');
const total = result.links.length;
console.log('');
console.log(`Pages crawled: ${pages}. Links checked: ${total}. Broken: ${broken.length}.`);
if (broken.length > 0) {
  console.log('');
  console.log('Broken links:');
  for (const l of broken) {
    const status = l.status ?? 'no-response';
    console.log(`  ✗ [${status}] ${l.url}`);
    console.log(`      from ${l.parent ?? '(root)'}`);
    if (l.failureDetails && l.failureDetails.length > 0) {
      for (const d of l.failureDetails) {
        const msg = (typeof d === 'object' && 'message' in d) ? d.message : String(d);
        if (msg) console.log(`      reason: ${msg}`);
      }
    }
  }
}

process.exit(broken.length > 0 ? 1 : 0);
