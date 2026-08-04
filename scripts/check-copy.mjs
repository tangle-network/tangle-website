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
 *   - One or more pages: pnpm check:copy /blog/ai-agent-sandbox /blog/agent-runtime-environments
 *
 * Env:
 *   COPY_AUDIT_API_KEY  — defaults to TANGLE_API_KEY /
 *                          GOOGLE_AI_KEY / TANGLE_ROUTER_USER_KEY pulled from
 *                          ~/company/devops/secrets/agent-state.env
 *   COPY_AUDIT_MODEL    — default: gpt-5.6-luna via the router,
 *                          gemini-3-flash with Google, gpt-5.5 with direct
 *                          OpenAI
 *   COPY_AUDIT_TIMEOUT_MS — per-page provider timeout (default 45000)
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
const AUDITOR_TIMEOUT_MS = Number(process.env.COPY_AUDIT_TIMEOUT_MS ?? 45_000);
const TRANSIENT_FAILURE_SHORT_CIRCUIT = Number(process.env.COPY_AUDIT_TRANSIENT_FAILURE_SHORT_CIRCUIT ?? 3);
let MODEL = process.env.COPY_AUDIT_MODEL;

if (!existsSync(ROOT)) {
  console.error('✗ dist/client/ not found — run `pnpm build` first.');
  process.exit(2);
}

// Resolve API key + endpoint. Prefer COPY_AUDIT_API_KEY if set, then a
// company router key, and only then a direct provider key.
let API_KEY = process.env.COPY_AUDIT_API_KEY;
let API_BASE = process.env.COPY_AUDIT_API_BASE;

if (!API_KEY && process.env.TANGLE_API_KEY) {
  API_KEY = process.env.TANGLE_API_KEY;
  API_BASE = 'https://router.tangle.tools/v1';
  MODEL ??= 'gpt-5.6-luna';
}

if (!API_KEY && process.env.GOOGLE_AI_KEY) {
  API_KEY = process.env.GOOGLE_AI_KEY;
  API_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';
  MODEL ??= 'gemini-3-flash';
}

if (!API_KEY && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  API_KEY = process.env.OPENAI_API_KEY;
  API_BASE = 'https://api.openai.com/v1';
  MODEL ??= 'gpt-5.5';
}
if (!API_KEY) {
  API_KEY = process.env.TANGLE_ROUTER_USER_KEY;
  if (API_KEY) {
    API_BASE = 'https://router.tangle.tools/v1';
    MODEL ??= 'gpt-5.6-luna';
  }
}
if (!API_KEY && existsSync(SECRETS_PATH)) {
  try {
    const k = execSync(`dotenvx get TANGLE_API_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
    if (k) {
      API_KEY = k;
      API_BASE = 'https://router.tangle.tools/v1';
      MODEL ??= 'gpt-5.6-luna';
    }
  }
  catch {
    // ignore
  }
  // Direct providers remain fallbacks for environments without a company key.
  if (!API_KEY) {
    try {
      const k = execSync(`dotenvx get GOOGLE_AI_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
      if (k) {
        API_KEY = k;
        API_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';
        MODEL ??= 'gemini-3-flash';
      }
    }
    catch {
      // ignore
    }
  }
  if (!API_KEY) {
    try {
      const k = execSync(`dotenvx get OPENAI_API_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
      if (k && k.startsWith('sk-')) {
        API_KEY = k;
        API_BASE = 'https://api.openai.com/v1';
        MODEL ??= 'gpt-5.5';
      }
    }
    catch {
      // ignore
    }
  }
  if (!API_KEY) {
    try {
      API_KEY = execSync(`dotenvx get TANGLE_ROUTER_USER_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
      if (API_KEY) {
        API_BASE = 'https://router.tangle.tools/v1';
        MODEL ??= 'gpt-5.6-luna';
      }
    }
    catch {
      // ignore — caught below
    }
  }
}
if (!API_KEY) {
  console.error('✗ No API key. Set COPY_AUDIT_API_KEY, TANGLE_API_KEY, GOOGLE_AI_KEY, OPENAI_API_KEY, or TANGLE_ROUTER_USER_KEY.');
  process.exit(2);
}

API_BASE ??= 'https://router.tangle.tools/v1';
MODEL ??= 'gpt-5.6-luna';

const pageArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

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

const allPages = pageArgs.length
  ? pageArgs.flatMap((pageArg) => [resolve(ROOT, pageArg.replace(/^\//, ''), 'index.html')].filter(existsSync))
  : findHtml(ROOT);

if (allPages.length === 0) {
  console.error(`✗ No pages found${pageArgs.length ? ` matching ${pageArgs.join(', ')}` : ''}.`);
  process.exit(2);
}

// ─── Extract visible copy from HTML ──────────────────────────────────
// Strip scripts, styles, attributes, SVG inner content. Keep text in
// a way that preserves the page's narrative flow.
function extractCopy(html) {
  // Audit the article itself, not the shared navigation and footer.
  // Those shared regions can consume the input cap and make a complete
  // article look truncated to the reviewer.
  const article = html.match(/<article\b[^>]*\bclass="[^"]*\bblog-article\b[^"]*"[\s\S]*?<\/article>/i)?.[0] ?? html;
  return article
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(?:th|td)>/gi, ' | ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|div|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
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
const MARKETING_SYSTEM_PROMPT = `You are a senior staff engineer auditing marketing-page copy for a developer-tool company. You have ZERO tolerance for AI slop. Your standard is Linear, Vercel, and Stripe — every sentence earns its place.

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

const BLOG_SYSTEM_PROMPT = `You are a senior technical editor reviewing a public engineering article for Tangle. The reader has never heard of Tangle or its products. Judge the article as an expert technical blog, not as a landing page, product page, reference manual, tweet thread, or academic paper.

Read the complete article. Score it from 1–10 and emit one JSON object with no surrounding prose. A 7 is publishable, 8 is strong, 9 is exceptional, and 10 is rare. Score the article holistically; do not subtract points mechanically for every sentence you could tighten.

RUBRIC:

1. STORY AND USEFULNESS: The opening presents a concrete reader problem or scene. The article develops one coherent argument, supplies enough context to stand alone, and ends with a practical decision. Penalize disconnected facts, generic listicles, repeated summaries, and documentation dumps.

2. ZERO-CONTEXT CLARITY: Define Tangle-native and technical terms before relying on them. Necessary inline definitions are a strength, not bloat. Penalize repeated glossary entries, unexplained insider language, and definitions that interrupt the story without helping the reader.

3. TECHNICAL DEPTH: Reward worked examples, current public code or API shapes, state models, calculations, traces, tables, and failure investigations. Long articles of roughly 2,000–4,500 words are appropriate when each section advances the argument. Do not penalize length by itself.

4. CLAIM AND EVIDENCE HYGIENE: Important claims name a mechanism, public primary source, measured conditions, or explicit limitation. Teaching examples are clearly illustrative. Penalize invented results, unsupported superlatives, private implementation details, local paths, commit archaeology, and author-side repository commands.

5. HUMAN PROSE: Penalize clipped tweet-thread cadence, canned transitions, ritual FAQs, fake quotations, throat-clearing, repeated heading templates, hollow adjectives, marketing clichés, and conclusions that merely restate the introduction. Do not penalize an occasional short sentence, numbered procedure, or descriptive heading that genuinely helps.

6. PRODUCT BOUNDARIES: The article distinguishes protocol state, payment, execution, traces, evaluations, attestation, and result quality. It never implies that payment, a TEE, a model, an operator, or Tangle proves correctness beyond the evidence described.

7. SEARCH AND ANSWER QUALITY: The reader's likely query is answered naturally in the title, opening, and descriptive headings. Direct question headings are useful when they answer distinct intent. Penalize keyword stuffing and generic FAQ scaffolding.

8. RENDERED COPY: Treat table rows separated by pipes as real tables and code or CLI examples as technical artifacts. The public Tangle Browser Agent CLI is genuinely named "bad"; do not flag that executable as a typo. Do not invent truncation, malformed formatting, or missing sections when the supplied article reaches the END marker.

OUTPUT (JSON only):
{
  "score": <1-10 integer>,
  "verdict": "<one-sentence holistic take>",
  "deductions": [
    {"category": "story|jargon|claim|evidence|structure|style|boundary|search|other", "phrase": "<offending text, ≤80 chars>", "fix": "<concrete rewrite suggestion, ≤120 chars>"}
  ],
  "wins": ["<specific strength, ≤80 chars>"]
}`;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function auditPage(label, copy, attempt = 1) {
  const userMessage = `Page: ${label}\n\n=== COPY ===\n${copy}\n=== END ===`;
  const systemPrompt = label.startsWith('/blog/') ? BLOG_SYSTEM_PROMPT : MARKETING_SYSTEM_PROMPT;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`copy auditor timed out after ${AUDITOR_TIMEOUT_MS}ms`)), AUDITOR_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
      }),
    });
  }
  finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const errBody = await res.text();
    // Retry on transient errors with exponential backoff. 502 / 503 / 429
    // are all rate-limit-ish from the router.
    if (attempt < 4 && (res.status === 429 || res.status === 502 || res.status === 503)) {
      const wait = 1500 * Math.pow(2, attempt - 1);
      await sleep(wait);
      return auditPage(label, copy, attempt + 1);
    }
    const err = new Error(`provider ${res.status}: ${errBody.slice(0, 200)}`);
    err.transientAuditFailure = res.status === 429 || res.status === 502 || res.status === 503;
    err.configurationAuditFailure = res.status === 401 || res.status === 403;
    throw err;
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

function isTransientAuditFailure(err) {
  if (err?.transientAuditFailure) return true;
  const message = String(err?.message ?? err);
  return /\bprovider (429|502|503):/.test(message)
    || message.includes('fetch failed')
    || message.includes('copy auditor timed out')
    || message.includes('This operation was aborted')
    || message.includes('AbortError')
    || message.includes('UND_ERR_CONNECT_TIMEOUT')
    || message.includes('ETIMEDOUT')
    || message.includes('ECONNRESET');
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
    results.push({
      route,
      error: err.message,
      transientAuditFailure: isTransientAuditFailure(err),
      configurationAuditFailure: Boolean(err.configurationAuditFailure),
      ok: false,
    });
    if (err.configurationAuditFailure) {
      console.log('stop (copy-audit credentials were rejected)');
      break;
    }
    if (
      results.length >= TRANSIENT_FAILURE_SHORT_CIRCUIT
      && results.every((r) => r.transientAuditFailure)
      && results.every((r) => typeof r.score !== 'number')
    ) {
      console.log(`stop (auditor unavailable after ${results.length} consecutive transient failures)`);
      break;
    }
  }
}

const failing = results.filter((r) => !r.ok);
const passing = results.filter((r) => r.ok);
const scored = results.filter((r) => typeof r.score === 'number');
const transientFailures = failing.filter((r) => r.transientAuditFailure);
const auditInconclusive = results.length > 0 && scored.length === 0 && transientFailures.length === results.length;

// ─── Detail ──────────────────────────────────────────────────────────
if (failing.length > 0 && !auditInconclusive) {
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
const avg = scored.length === 0 ? 0 : scored.reduce((s, r) => s + r.score, 0) / scored.length;
console.log('');
console.log(`Avg: ${avg.toFixed(2)}/10 across ${results.length} pages. Pass: ${passing.length}. Fail: ${auditInconclusive ? 0 : failing.length}. Inconclusive: ${auditInconclusive ? transientFailures.length : 0}.`);

if (auditInconclusive) {
  console.log('');
  console.log('INCONCLUSIVE: copy auditor returned only transient infrastructure errors after retries; not treating this as a copy failure.');
  process.exit(0);
}

process.exit(failing.length > 0 ? 1 : 0);
