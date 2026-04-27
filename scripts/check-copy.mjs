#!/usr/bin/env node
/**
 * Anti-slop copywriting audit — sends each built page's visible copy
 * to an LLM with a strict rubric, returns per-page slop scores +
 * flagged phrases. Catches the things that visual audits don't:
 *   - hollow adjectives ("production-grade", "world-class",
 *     "blazingly fast", "seamlessly", "next-generation")
 *   - counting headlines ("Three primitives", "Five lines", "Four moves")
 *   - em dashes — every one
 *   - claims without mechanisms (every claim should name a concrete
 *     thing the user can verify)
 *   - generic dev-tool boilerplate ("ship features faster",
 *     "scale with confidence")
 *
 * Run: pnpm check:copy
 *   - All pages by default
 *   - Single page: pnpm check:copy services/blueprint-agent
 *
 * Env:
 *   COPY_AUDIT_API_KEY  — defaults to TANGLE_ROUTER_USER_KEY pulled
 *                          from ~/company/devops/secrets/agent-state.env
 *   COPY_AUDIT_MODEL    — default: gpt-5.5 via Tangle Router
 *   COPY_AUDIT_THRESHOLD — pages below this score fail (default 7.0)
 *
 * Output: per-page score 1–10, flagged phrases with line context.
 * Exits non-zero if any page scores below threshold.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(process.cwd(), 'dist/client');
const SECRETS_PATH = `${process.env.HOME}/company/devops/secrets/agent-state.env`;
const THRESHOLD = Number(process.env.COPY_AUDIT_THRESHOLD ?? 7.0);
// Default model: gpt-4o-mini — free tier on the router and reliable.
// Override via `COPY_AUDIT_MODEL=gpt-5.5` (or claude-sonnet) for a
// stronger judge once your router key has credits.
const MODEL = process.env.COPY_AUDIT_MODEL ?? 'gpt-4o-mini';

if (!existsSync(ROOT)) {
  console.error('✗ dist/client/ not found — run `pnpm build` first.');
  process.exit(2);
}

// Resolve API key + endpoint. Prefer COPY_AUDIT_API_KEY if set, else
// fall back through router → direct OpenAI. The router's free tier is
// 5 calls/day per key — fine for single-page audits, hits the wall on
// full-site sweeps. Direct OpenAI bypasses the router entirely.
let API_KEY = process.env.COPY_AUDIT_API_KEY;
let API_BASE = process.env.COPY_AUDIT_API_BASE ?? 'https://router.tangle.tools/v1';

if (!API_KEY && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  // OpenAI direct.
  API_KEY = process.env.OPENAI_API_KEY;
  API_BASE = 'https://api.openai.com/v1';
}
if (!API_KEY) {
  API_KEY = process.env.TANGLE_ROUTER_USER_KEY;
}
if (!API_KEY && existsSync(SECRETS_PATH)) {
  try {
    API_KEY = execSync(`dotenvx get TANGLE_ROUTER_USER_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
  }
  catch {
    // ignore — caught below
  }
}
if (!API_KEY) {
  console.error('✗ No API key. Set COPY_AUDIT_API_KEY, OPENAI_API_KEY, or TANGLE_ROUTER_USER_KEY.');
  process.exit(2);
}

const pageArg = process.argv[2];

// ─── Load pages ──────────────────────────────────────────────────────
function findHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === '404.html' || name === 'preview') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findHtml(full));
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

const allPages = pageArg
  ? [resolve(ROOT, pageArg.replace(/^\//, ''), 'index.html')].filter(existsSync)
  : findHtml(ROOT);

if (allPages.length === 0) {
  console.error(`✗ No pages found${pageArg ? ` matching "${pageArg}"` : ''}.`);
  process.exit(2);
}

// ─── Extract visible copy from HTML ──────────────────────────────────
// Strip scripts, styles, attributes, SVG inner content. Keep text in
// a way that preserves the page's narrative flow.
function extractCopy(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(p|h[1-6]|li|div|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── LLM rubric ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior staff engineer auditing marketing-page copy for a developer-tool company. You have ZERO tolerance for AI slop. Your standard is Linear, Vercel, and Stripe — every sentence earns its place.

You will be given the visible copy from one page. Score it 1–10 on the strict rubric below and emit a single JSON object. Do not include any other prose.

RUBRIC (deduct points aggressively):

1. HOLLOW ADJECTIVES (−1 per offender): "production-grade", "world-class", "blazingly fast", "seamlessly", "next-generation", "cutting-edge", "robust", "scalable" used without a concrete number, "secure" used without naming the mechanism, "lightning fast", "powerful", "comprehensive", "revolutionary", "innovative", "leverage" as a verb.

2. COUNTING HEADLINES (−2 per offender): "Three primitives", "Four moves", "Five lines", "Six surfaces" — any "<N> <noun>" pattern as a section title.

3. EM DASHES (−0.5 per offender): every \`—\` character. Treat as AI-tic.

4. CLAIMS WITHOUT MECHANISMS (−1 per offender): every claim must name a concrete thing the reader can verify. "Sub-second cold-start" is fine (specific). "Built for scale" is not (vague). "VM-grade boundary" is fine if it's also explained. Generic boilerplate like "ship features faster", "scale with confidence", "enterprise-ready" earns the deduction.

5. GENERIC DEV-TOOL CLICHÉS (−1 per offender): "developer-first", "built for developers", "by developers, for developers", "we love what we do", "we're on a mission to", "the future of X", "purpose-built", "first-class".

6. POSITIVE SIGNALS (each adds +0 — these are the bar, not extra credit):
   - Every section's headline names a specific concrete thing
   - Every claim is followed by the mechanism that makes it true
   - Numbers are present and specific (0.6s, 8,214 boxes, 47 files)
   - Code samples or terminal output where appropriate
   - No two adjacent sentences both start with the same noun

OUTPUT (JSON only):
{
  "score": <1-10 integer>,
  "verdict": "<one-sentence holistic take>",
  "deductions": [
    {"category": "hollow|counting|em-dash|claim|cliche|other", "phrase": "<offending text, ≤80 chars>", "fix": "<concrete rewrite suggestion, ≤120 chars>"}
  ],
  "wins": ["<phrase that's actually sharp, ≤80 chars>"]
}`;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function auditPage(label, copy, attempt = 1) {
  const userMessage = `Page: ${label}\n\n=== COPY ===\n${copy.slice(0, 8000)}\n=== END ===`;

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    // Retry on transient errors with exponential backoff. 502 / 503 / 429
    // are all rate-limit-ish from the router.
    if (attempt < 4 && (res.status === 429 || res.status === 502 || res.status === 503)) {
      const wait = 1500 * Math.pow(2, attempt - 1);
      await sleep(wait);
      return auditPage(label, copy, attempt + 1);
    }
    throw new Error(`router ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

// ─── Run ─────────────────────────────────────────────────────────────
console.log(`▸ Auditing ${allPages.length} page${allPages.length === 1 ? '' : 's'} via ${MODEL}…`);
console.log(`▸ Threshold: ${THRESHOLD}/10. Pages below fail this script.`);
console.log('');

const results = [];
for (const file of allPages) {
  const rel = relative(ROOT, file).replace(/\/?index\.html$/, '');
  const route = rel ? `/${rel}` : '/';
  process.stdout.write(`  ▸ ${route.padEnd(38)} `);
  try {
    const html = readFileSync(file, 'utf8');
    const copy = extractCopy(html);
    if (copy.length < 80) {
      console.log('skip (no visible copy)');
      continue;
    }
    const audit = await auditPage(route, copy);
    // Polite throttle — keep router happy across many pages.
    await sleep(400);
    const score = Number(audit.score) || 0;
    const dedCount = (audit.deductions ?? []).length;
    const winCount = (audit.wins ?? []).length;
    const ok = score >= THRESHOLD;
    console.log(`${ok ? '✓' : '✗'} ${score.toFixed(1).padStart(4)}/10  · ${dedCount} flag${dedCount === 1 ? '' : 's'} · ${winCount} win${winCount === 1 ? '' : 's'}`);
    results.push({ route, audit, score, ok });
  }
  catch (err) {
    console.log(`error: ${err.message.slice(0, 80)}`);
    results.push({ route, error: err.message, ok: false });
  }
}

// ─── Detail ──────────────────────────────────────────────────────────
const failing = results.filter((r) => !r.ok);
if (failing.length > 0) {
  console.log('');
  console.log('FAILED PAGES:');
  for (const r of failing) {
    if (r.error) {
      console.log(`\n  ${r.route}  — error: ${r.error}`);
      continue;
    }
    console.log(`\n  ${r.route}  — ${r.score.toFixed(1)}/10`);
    console.log(`    ${r.audit.verdict}`);
    for (const d of r.audit.deductions ?? []) {
      console.log(`    [${d.category}] "${d.phrase}"`);
      if (d.fix) console.log(`        → ${d.fix}`);
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────
const passing = results.filter((r) => r.ok);
const avg = passing.length === 0 ? 0 : results.filter(r => typeof r.score === 'number').reduce((s, r) => s + r.score, 0) / results.filter(r => typeof r.score === 'number').length;
console.log('');
console.log(`Avg: ${avg.toFixed(2)}/10 across ${results.length} pages. Pass: ${passing.length}. Fail: ${failing.length}.`);

process.exit(failing.length > 0 ? 1 : 0);
