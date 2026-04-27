#!/usr/bin/env node
/**
 * Deprecated-model check — fetches the canonical deprecation pages
 * from OpenAI, Anthropic, and Google on every run, parses out the
 * union of deprecated + deprecating model names, then greps the
 * codebase for any reference. Fails if anything cited is in the union.
 *
 * Sources of truth (fetched on every run):
 *   - https://developers.openai.com/api/docs/deprecations
 *   - https://platform.claude.com/docs/en/about-claude/model-deprecations
 *   - https://ai.google.dev/gemini-api/docs/deprecations
 *
 * Why fetch every run? Provider deprecation cycles run on the order
 * of months. A baked-in denylist goes stale as soon as Anthropic
 * deprecates a model. Pulling the lists fresh means the check is
 * always current — the day a provider adds a model to deprecation,
 * our CI fails on it.
 *
 * If a fetch fails (network blip / rate limit / page restructure),
 * we fall back to a cached snapshot in `.deprecated-models.cache.json`
 * so CI doesn't go red on transient outages. The cache is committed
 * so first-time runs in fresh checkouts have something to fall back
 * on, and refreshed any time a successful fetch lands.
 *
 * Run: pnpm check:models
 *
 * Allowlist patterns (intentional historical references — e.g. comments
 * about "the gpt-3.5 era" or anti-references warning never to use it)
 * live in `.deprecated-models.allow.json`. Hand-maintained.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = process.cwd();
const CACHE_PATH = resolve(ROOT, '.deprecated-models.cache.json');
const ALLOW_PATH = resolve(ROOT, '.deprecated-models.allow.json');
const ACTIVE_PATH = resolve(ROOT, '.deprecated-models.active.json');

const SOURCES = [
  {
    name: 'openai',
    url: 'https://developers.openai.com/api/docs/deprecations',
    // Match all model id shapes OpenAI ships.
    patterns: [
      /\bgpt-[0-9]+(?:\.[0-9]+)?(?:-[a-z0-9-]+)?\b/g,
      /\bo[1-9](?:-[a-z0-9-]+)?\b/g,
      /\bft-[a-z0-9-]+\b/g,
      /\b(?:dall-e|sora|chatgpt|codex)-[a-z0-9-]+\b/g,
      /\b(?:babbage|davinci|curie|ada)(?:-[a-z0-9-]+)?\b/g,
      /\btext-(?:davinci|babbage|curie|ada|moderation|search|similarity|embedding)-[a-z0-9-]+\b/g,
      /\bcode-(?:davinci|cushman|search)-[a-z0-9-]+\b/g,
    ],
  },
  {
    name: 'anthropic',
    url: 'https://platform.claude.com/docs/en/about-claude/model-deprecations',
    // Anthropic uses claude-NAME-N-N(-DATE) format. Match every variant.
    patterns: [
      /\bclaude-(?:opus|sonnet|haiku|instant)-[0-9]+(?:[-.][0-9]+)*(?:-[0-9]{8})?\b/g,
      /\bclaude-[0-9]+\.[0-9]+\b/g,
      /\bclaude-[0-9]+(?:\.[0-9]+)?-(?:opus|sonnet|haiku)(?:-[0-9]{8})?\b/g,
      /\bclaude-[0-9]+(?:\.[0-9]+)?\b/g,
    ],
  },
  {
    name: 'gemini',
    url: 'https://ai.google.dev/gemini-api/docs/deprecations',
    patterns: [
      /\bgemini-[0-9]+(?:\.[0-9]+)?(?:-[a-z0-9-]+)?\b/g,
      /\b(?:imagen|veo)-[0-9]+(?:\.[0-9]+)?(?:-[a-z0-9-]+)?\b/g,
      /\b(?:embedding|text-embedding)-[a-z0-9-]+\b/g,
      /\bembedding-gecko-[0-9]+\b/g,
    ],
  },
];

// ─── Allowlist ───────────────────────────────────────────────────────
// Intentional references that should NOT trigger a finding:
//   - Comments warning never to use a deprecated model (anti-reference)
//   - Blog posts citing historical models for context
//   - Other places where the deprecated name appears as data, not as
//     a model invocation.
function loadAllowlist() {
  if (!existsSync(ALLOW_PATH)) {
    return { phrases: [], files: [] };
  }
  return JSON.parse(readFileSync(ALLOW_PATH, 'utf8'));
}

// ─── Fetch + parse ───────────────────────────────────────────────────
async function fetchDenylist() {
  const denylist = new Map(); // model id → array of providers that deprecated it
  let allFetched = true;

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: { 'user-agent': 'tangle-deprecated-model-check/1.0' },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();

      // Each provider's deprecation page lists ACTIVE and
      // DEPRECATED/RETIRED models in the same tables. We only want
      // the deprecated ones. Strategy: walk row-by-row, and only
      // collect model IDs from rows that include a deprecation
      // keyword. This works across OpenAI / Anthropic / Gemini
      // because they all use the same status vocabulary.
      const DEPRECATION_KEYWORDS = /\b(deprecated|retired|retirement|sunset|shut\s*down|shutdown|deprecation|legacy)\b/i;
      const ACTIVE_ONLY = /\bactive\b/i;

      // Strip script/style; keep the rest of the HTML mostly intact
      // so table structure survives.
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '');

      // Split into "rows" — works for HTML tables (<tr>) and for
      // markdown tables (newline-separated `| ... |` rows).
      const rowChunks = [];
      // HTML <tr> rows.
      for (const m of cleaned.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
        rowChunks.push(m[1].replace(/<[^>]+>/g, ' '));
      }
      // Markdown rows + plain newlines (catches WebFetch'd markdown
      // and plain prose lines mentioning a deprecation).
      for (const line of cleaned.split(/\n/)) {
        if (line.includes('|') || DEPRECATION_KEYWORDS.test(line)) {
          rowChunks.push(line.replace(/<[^>]+>/g, ' '));
        }
      }

      const found = new Set();
      for (const row of rowChunks) {
        // Must mention a deprecation keyword AND not be an active-only row.
        if (!DEPRECATION_KEYWORDS.test(row)) continue;
        // Anthropic puts "Active | N/A | …" on active rows. If the
        // row matches Active and does NOT also match Deprecated/
        // Retired, skip it.
        if (ACTIVE_ONLY.test(row)) {
          // Active rows typically don't have a retirement date
          // alongside deprecation. Look for *both* — only treat row
          // as deprecation when Deprecated/Retired is the explicit
          // state, not just mentioned in a header column.
          const stateMatch = row.match(/\b(Active|Deprecated|Retired|Legacy)\b/i);
          if (stateMatch && stateMatch[1].toLowerCase() === 'active') continue;
        }

        for (const pat of source.patterns) {
          for (const match of row.matchAll(pat)) {
            const id = match[0].toLowerCase();
            if (id.split('-').length < 2 && !['ada', 'babbage', 'curie', 'davinci'].includes(id)) {
              continue;
            }
            found.add(id);
          }
        }
      }

      console.log(`  ▸ ${source.name}: ${found.size} deprecated model ids parsed`);
      for (const id of found) {
        const arr = denylist.get(id) ?? [];
        arr.push(source.name);
        denylist.set(id, arr);
      }
    }
    catch (err) {
      console.warn(`  ⚠ ${source.name}: fetch failed (${err.message}); will fall back to cache`);
      allFetched = false;
    }
  }

  return { denylist, allFetched };
}

// ─── Cache ───────────────────────────────────────────────────────────
function loadCache() {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    if (!raw.fetchedAt || !Array.isArray(raw.deprecated)) return null;
    return raw;
  }
  catch {
    return null;
  }
}
function saveCache(deprecated) {
  writeFileSync(
    CACHE_PATH,
    JSON.stringify({ fetchedAt: new Date().toISOString(), deprecated }, null, 2) + '\n',
  );
}

// ─── Codebase scan ───────────────────────────────────────────────────
const SCAN_ROOTS = ['src', 'scripts', '.github'];
// Code/config that can actually invoke a model gets scanned. Blog
// .md/.mdx content is prose — it mentions historical models like
// "GPT-4" as data, not as a runtime selection — so we skip those
// extensions entirely. If a doc ever references a model in a code
// block we'll catch it via the surrounding .ts/.astro snippet.
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.yml', '.yaml', '.toml', '.json']);
const SCAN_IGNORE = new Set(['node_modules', '.astro', 'dist', '.deprecated-models.cache.json']);

function walkFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SCAN_IGNORE.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkFiles(full));
    else if (SCAN_EXTS.has(full.slice(full.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

function scan(files, denylist, allow) {
  // For each file, find every line that references a deprecated model.
  const findings = [];
  // Build a single regex that matches any deprecated model id as a
  // whole token. Sort by length desc so longer ids match before
  // their substrings. The trailing negative lookahead `(?![\w.-])`
  // ensures we match the full id, never a prefix — i.e. `gpt-5`
  // won't match inside `gpt-5.5`.
  const ids = [...denylist.keys()].sort((a, b) => b.length - a.length);
  if (ids.length === 0) return findings;
  const escaped = ids.map((id) => id.replace(/[.+*?^${}()|[\]\\]/g, '\\$&'));
  const allRe = new RegExp(`\\b(?:${escaped.join('|')})(?![\\w.-])`, 'gi');

  const allowFiles = new Set(allow.files ?? []);
  const allowPhrases = (allow.phrases ?? []).map((p) => new RegExp(p, 'i'));

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (allowFiles.has(rel)) continue;
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip lines explicitly allowed by phrase (e.g. "NEVER use
      // gpt-4o-mini" in a comment).
      if (allowPhrases.some((re) => re.test(line))) continue;
      for (const m of line.matchAll(allRe)) {
        findings.push({
          file: rel,
          line: i + 1,
          model: m[0].toLowerCase(),
          context: line.trim().slice(0, 160),
          providers: denylist.get(m[0].toLowerCase()) ?? [],
        });
      }
    }
  }
  return findings;
}

// ─── Main ────────────────────────────────────────────────────────────
console.log('▸ Fetching live deprecation lists…');
const fetched = await fetchDenylist();
let denylist = fetched.denylist;

if (denylist.size === 0 || !fetched.allFetched) {
  const cache = loadCache();
  if (cache) {
    console.log(`  ▸ falling back to cache (${cache.deprecated.length} ids, fetched ${cache.fetchedAt})`);
    if (denylist.size === 0) {
      denylist = new Map(cache.deprecated.map((id) => [id, ['cache']]));
    }
    else {
      // Merge cache into live results so cache fills gaps.
      for (const id of cache.deprecated) {
        if (!denylist.has(id)) denylist.set(id, ['cache']);
      }
    }
  }
}

// Subtract the active-models whitelist. Provider pages list active
// models alongside deprecated ones (in "Recommended Replacement"
// columns and status-table "Active" rows); the row-scoped parser
// can't always tell columns apart, so we filter known-active IDs
// here. Hand-maintained — drop an entry when it deprecates.
if (existsSync(ACTIVE_PATH)) {
  const active = JSON.parse(readFileSync(ACTIVE_PATH, 'utf8')).active ?? [];
  let removed = 0;
  for (const id of active) {
    if (denylist.delete(id.toLowerCase())) removed++;
  }
  if (removed > 0) {
    console.log(`▸ Subtracted ${removed} active model id${removed === 1 ? '' : 's'} from parsed denylist`);
  }
}

if (fetched.allFetched && denylist.size > 0) {
  saveCache([...denylist.keys()].sort());
  console.log(`▸ Cached ${denylist.size} deprecated model ids → .deprecated-models.cache.json`);
}

if (denylist.size === 0) {
  console.error('✗ No deprecation data — all fetches failed and no cache. Aborting.');
  process.exit(2);
}

const allow = loadAllowlist();
console.log(`▸ Allowlist: ${allow.phrases?.length ?? 0} phrase patterns, ${allow.files?.length ?? 0} file paths`);

console.log('');
console.log('▸ Scanning codebase…');
const files = SCAN_ROOTS
  .filter((r) => existsSync(join(ROOT, r)))
  .flatMap((r) => walkFiles(join(ROOT, r)));
console.log(`  ▸ ${files.length} files scanned`);

const findings = scan(files, denylist, allow);

console.log('');
if (findings.length === 0) {
  console.log(`✓ No deprecated model references in ${files.length} files.`);
  process.exit(0);
}

console.log(`✗ Found ${findings.length} deprecated model reference${findings.length === 1 ? '' : 's'}:`);
console.log('');
const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}
for (const [file, list] of byFile) {
  console.log(`  ${file}`);
  for (const f of list) {
    console.log(`    line ${f.line}  [${f.providers.join('+')}]  ${f.model}`);
    console.log(`      ${f.context}`);
  }
  console.log('');
}

console.log('To exempt an intentional reference:');
console.log('  - Whole-file:  add "<path>" to .deprecated-models.allow.json `files`');
console.log('  - Single line: include a phrase regex in `phrases` (e.g. "NEVER use" for anti-refs)');
process.exit(1);
