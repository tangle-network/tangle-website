#!/usr/bin/env node
/**
 * Full-site copy audit. Sends each built page's visible copy to a model
 * with a route-appropriate rubric for technical articles, editorial
 * indexes, legal policies, or product pages. Retains one machine-readable
 * result per requested route so CI failures remain diagnosable.
 *
 * Run: pnpm check:copy
 *   - All pages by default
 *   - One or more pages: pnpm check:copy /blog/ai-agent-sandbox /blog/agent-runtime-environments
 *
 * Env:
 *   COPY_AUDIT_API_KEY  — defaults to TANGLE_API_KEY /
 *                          TANGLE_ROUTER_USER_KEY pulled from
 *                          ~/company/devops/secrets/agent-state.env
 *   COPY_AUDIT_MODEL    — default: openrouter/openai/gpt-5.6-luna via the router
 *   COPY_AUDIT_TIMEOUT_MS — per-page provider timeout (default 45000)
 *   COPY_AUDIT_THRESHOLD — pages below this score fail (default 7.5)
 *   COPY_AUDIT_ROOT      — rendered-site root (default dist/client)
 *
 * Output: per-page score 1–10, flagged phrases with line context.
 * Exits non-zero if any page scores below threshold.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(process.env.COPY_AUDIT_ROOT ?? 'dist/client');
const SECRETS_PATH = `${process.env.HOME}/company/devops/secrets/agent-state.env`;
const ARTIFACT_PATH = resolve(process.env.COPY_AUDIT_OUTPUT ?? 'audit-results/copy-audit.json');
const THRESHOLD = Number(process.env.COPY_AUDIT_THRESHOLD ?? 7.5);
const AUDITOR_TIMEOUT_MS = Number(process.env.COPY_AUDIT_TIMEOUT_MS ?? 45_000);
const TRANSIENT_FAILURE_SHORT_CIRCUIT = Number(process.env.COPY_AUDIT_TRANSIENT_FAILURE_SHORT_CIRCUIT ?? 3);
let MODEL = process.env.COPY_AUDIT_MODEL;

if (!existsSync(ROOT)) {
  console.error('✗ dist/client/ not found — run `pnpm build` first.');
  process.exit(2);
}

// Resolve API key + endpoint. Prefer COPY_AUDIT_API_KEY if set, then a
// company router key.
let API_KEY = process.env.COPY_AUDIT_API_KEY;
let API_BASE = process.env.COPY_AUDIT_API_BASE;

if (!API_KEY && process.env.TANGLE_API_KEY) {
  API_KEY = process.env.TANGLE_API_KEY;
  API_BASE = 'https://router.tangle.tools/v1';
  MODEL ??= 'openrouter/openai/gpt-5.6-luna';
}

if (!API_KEY) {
  API_KEY = process.env.TANGLE_ROUTER_USER_KEY;
  if (API_KEY) {
    API_BASE = 'https://router.tangle.tools/v1';
    MODEL ??= 'openrouter/openai/gpt-5.6-luna';
  }
}
if (!API_KEY && existsSync(SECRETS_PATH)) {
  try {
    const k = execSync(`dotenvx get TANGLE_API_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
    if (k) {
      API_KEY = k;
      API_BASE = 'https://router.tangle.tools/v1';
      MODEL ??= 'openrouter/openai/gpt-5.6-luna';
    }
  }
  catch {
    // ignore
  }
  if (!API_KEY) {
    try {
      API_KEY = execSync(`dotenvx get TANGLE_ROUTER_USER_KEY -f "${SECRETS_PATH}"`, { encoding: 'utf8' }).trim();
      if (API_KEY) {
        API_BASE = 'https://router.tangle.tools/v1';
        MODEL ??= 'openrouter/openai/gpt-5.6-luna';
      }
    }
    catch {
      // ignore — caught below
    }
  }
}
if (!API_KEY) {
  console.error('✗ No API key. Set COPY_AUDIT_API_KEY, TANGLE_API_KEY, or TANGLE_ROUTER_USER_KEY.');
  process.exit(2);
}

API_BASE ??= 'https://router.tangle.tools/v1';
MODEL ??= 'openrouter/openai/gpt-5.6-luna';

if (!/(^|\/)gpt-5\.6-luna$/.test(MODEL)) {
  console.error(`✗ Unsupported copy-audit model ${MODEL}. This audit is pinned to the gpt-5.6-luna family.`);
  process.exit(2);
}

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

function normalizeRoute(route) {
  const normalized = route.replace(/\/$/, '');
  return normalized || '/';
}

function loadRedirects() {
  const redirectsPath = join(ROOT, '_redirects');
  const redirects = new Map();
  const dynamicRedirects = new Map();
  const declarations = [];
  const errors = [];
  if (!existsSync(redirectsPath)) return { redirects, dynamicRedirects, declarations, errors };

  const lines = readFileSync(redirectsPath, 'utf8').split('\n');
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2 || parts.length > 3) {
      errors.push(`_redirects:${index + 1} expected "from to [3xx]", received ${parts.length} fields`);
      continue;
    }

    const [from, target, rawStatus = '301'] = parts;
    const status = Number(rawStatus);
    if (!Number.isInteger(status) || status < 300 || status > 399) {
      errors.push(`_redirects:${index + 1} has unsupported status ${rawStatus}; copy-audit redirects must use 300–399`);
      continue;
    }

    const dynamic = from.includes('*');
    const declaration = { line: index + 1, from, target, status, dynamic };
    declarations.push(declaration);
    if (dynamic) {
      const existing = dynamicRedirects.get(from);
      if (existing && (existing.target !== target || existing.status !== status)) {
        errors.push(`_redirects:${index + 1} conflicts with another declaration for ${from}`);
        continue;
      }
      dynamicRedirects.set(from, declaration);
      continue;
    }

    const route = normalizeRoute(from);
    const existing = redirects.get(route);
    if (existing && (existing.target !== target || existing.status !== status)) {
      errors.push(`_redirects:${index + 1} conflicts with another declaration for ${route}`);
      continue;
    }
    redirects.set(route, { target, status });
  }

  return { redirects, dynamicRedirects, declarations, errors };
}

const {
  redirects,
  dynamicRedirects,
  declarations: redirectDeclarations,
  errors: redirectConfigurationErrors,
} = loadRedirects();

function routeForFile(file) {
  const rel = relative(ROOT, file).replace(/\/?index\.html$/, '');
  return rel ? `/${rel}` : '/';
}

const auditTargets = pageArgs.length
  ? [...new Map(pageArgs.map((pageArg) => {
      const route = normalizeRoute(pageArg.startsWith('/') ? pageArg : `/${pageArg}`);
      return [route, { route, file: resolve(ROOT, route.replace(/^\//, ''), 'index.html') }];
    })).values()]
  : findHtml(ROOT).map((file) => ({ route: routeForFile(file), file }));

if (!pageArgs.length) {
  const existingRoutes = new Set(auditTargets.map((target) => target.route));
  for (const route of redirects.keys()) {
    if (!existingRoutes.has(route)) auditTargets.push({ route, file: null });
  }
  for (const declaration of dynamicRedirects.values()) {
    if (!existingRoutes.has(declaration.from)) {
      auditTargets.push({ route: declaration.from, file: null, redirectDeclaration: declaration });
    }
  }
  auditTargets.sort((a, b) => a.route.localeCompare(b.route));
}

if (auditTargets.length === 0) {
  console.error(`✗ No pages found${pageArgs.length ? ` matching ${pageArgs.join(', ')}` : ''}.`);
  process.exit(2);
}

// ─── Extract visible copy from HTML ──────────────────────────────────
// Strip scripts, styles, attributes, SVG inner content. Keep text in
// a way that preserves the page's narrative flow.
function extractCopy(html, route = '') {
  // Audit the article itself, not the shared navigation and footer.
  // Those shared regions can consume the input cap and make a complete
  // article look truncated to the reviewer.
  const article = html.match(/<article\b[^>]*\bclass="[^"]*\bblog-article\b[^"]*"[\s\S]*?<\/article>/i)?.[0] ?? html;
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? html;
  // The homepage audits the shared header and footer once. Every other
  // route is judged on its own main content so shared copy cannot create
  // the same deduction across the entire site.
  const page = article !== html ? article : route === '/' ? html : main;
  return page
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // CSS can visually separate adjacent inline labels even though raw
    // textContent joins them. Preserve that boundary without inserting
    // spaces between syntax-highlighter spans, which use style attributes.
    .replace(/<\/span>\s*(?=<span\b[^>]*\bclass=["'][^"']*\bline\b)/gi, '</span>\n')
    .replace(/<\/span>\s*<span\b(?=[^>]*\bclass=["'][^"']*\bvbb-(?:sub|profile)\b)/gi, '</span> · <span')
    .replace(/<\/span>\s*<em\b/gi, '</span> <em')
    .replace(/<\/em>\s*<span\b/gi, '</em> <span')
    .replace(/<\/em>\s*<small\b/gi, '</em> · <small')
    .replace(/<\/button>\s*(?=<button\b)/gi, '</button> · ')
    .replace(/<\/dt>\s*<dd\b/gi, '</dt> · <dd')
    .replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _quote, href, label) => `${label} [${href}]`)
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
const MARKETING_SYSTEM_PROMPT = `You are a senior developer-product copy editor reviewing a public Tangle page. The reader has never heard of Tangle. Judge the complete page holistically against the standard of clear, restrained product writing from Linear, Stripe, and Vercel.

Score it from 1–10 and emit one JSON object with no surrounding prose. A 7 is publishable, 8 is strong, 9 is exceptional, and 10 is rare. Do not subtract points mechanically for every sentence you could tighten.

RUBRIC:

1. READER DECISION: The opening makes the product, benchmark, or resource understandable from zero context. The page helps a specific reader decide what to inspect, use, or compare.

2. CONCRETE MECHANISMS: Important claims name the product surface, artifact, boundary, number, or process that makes them true. Penalize unsupported superlatives and generic claims such as "built for scale" or "enterprise-ready."

3. EVIDENCE AND LINKS: Reward measured conditions, explicit limitations, public sources, inspectable examples, and links whose destinations appear in brackets. Do not demand unpublished metrics, customer data, internal security configuration, or invented service levels.

4. HUMAN PROSE: Penalize hollow adjectives, generic developer-tool clichés, decorative labels, repeated slogans, canned contrasts, and excessive fragments. An occasional short sentence or em dash is not an automatic deduction.

5. INFORMATION SHAPE: Headings should name concrete topics. Numeric headings are legitimate when the number is real benchmark scope, a measured finding, a price, or a procedure. Penalize only templated promotional counting such as "Three pillars" when the count carries no information.

6. BRAND HEADLINE: One memorable headline is allowed when its nearby supporting copy supplies the concrete meaning. In particular, "Run agents. Make them better." is an approved Tangle headline; judge the product explanation immediately around it rather than treating each fragment as a standalone technical claim.

7. SEARCH AND BOUNDARIES: The likely query is answered naturally. The page distinguishes execution, model routing, traces, evaluations, payment, attestation, and result quality whenever those distinctions matter.

OUTPUT (JSON only):
{
  "score": <1-10 integer>,
  "verdict": "<one-sentence holistic take>",
  "deductions": [
    {"category": "decision|claim|evidence|structure|style|search|boundary|other", "phrase": "<offending text, ≤80 chars>", "fix": "<concrete rewrite suggestion, ≤120 chars>"}
  ],
  "wins": ["<specific strength, ≤80 chars>"]
}`;

const EDITORIAL_INDEX_SYSTEM_PROMPT = `You are a senior technical editor reviewing a compact public editorial index for Tangle. Judge it as an orientation and navigation page, not as a standalone article. The reader has never heard of Tangle or the collection.

Score it from 1–10 and emit one JSON object with no surrounding prose. A 7 is publishable, 8 is strong, 9 is exceptional, and 10 is rare.

RUBRIC:

1. ZERO-CONTEXT PREMISE: The title and introduction explain what the collection covers, who it helps, and which decision or problem connects its entries.

2. COHERENT READER PATH: The ordering helps a newcomer choose where to start and what follows. Dates, titles, and links are useful navigation. Do not demand an article-length argument, worked example, conclusion, or code sample from an index.

3. CONCRETE SUMMARIES: Each entry summary distinguishes that item from its neighbors by naming a question, mechanism, finding, or decision. Penalize repeated generic teasers and unexplained Tangle-native terms.

4. HUMAN PROSE: Reward concise, natural orientation. Penalize keyword stuffing, decorative labels, hollow claims, generic calls to action, and raw post totals used as marketing proof.

5. SEARCH AND BOUNDARIES: The likely collection query is answered naturally. Product claims distinguish execution, evidence, payment, attestation, and correctness where relevant. Links shown in brackets count as visible proof paths.

OUTPUT (JSON only):
{
  "score": <1-10 integer>,
  "verdict": "<one-sentence holistic take>",
  "deductions": [
    {"category": "premise|path|summary|jargon|style|search|boundary|other", "phrase": "<offending text, ≤80 chars>", "fix": "<concrete rewrite suggestion, ≤120 chars>"}
  ],
  "wins": ["<specific strength, ≤80 chars>"]
}`;

const LEGAL_SYSTEM_PROMPT = `You are a senior plain-language editor reviewing a public Tangle policy. Judge the clarity and internal consistency of the commitments it actually makes, not its legal sufficiency and not its marketing appeal.

Score it from 1–10 and emit one JSON object with no surrounding prose. A 7 is publishable, 8 is strong, 9 is exceptional, and 10 is rare. This is an editorial quality review, not a jurisdiction-specific legal opinion.

CALIBRATION: These are controlled legal documents, not product copy. A concise page that states its existing scope, dates, duties, contacts, and links clearly and without internal contradiction should score at least 8. Brevity is intentional. Before making a deduction, confirm that the suggested fix is purely editorial and would not add, remove, or reinterpret a legal commitment.

RUBRIC:

1. SCOPE AND PARTIES: The document identifies the services, people, organizations, data, or conduct it covers. Defined terms remain consistent.

2. SPECIFIC OBLIGATIONS: Important promises, restrictions, retention periods, processors, rights, contacts, and change procedures already present are concrete enough for a reader to act on. Judge only categories the document actually addresses.

3. CLARITY: Sections are logically ordered and readable without weakening necessary legal meaning. Numbered headings, cautious language, and standard legal terms are legitimate and must not be treated as AI slop.

4. CLAIM HYGIENE: Penalize contradictions, undefined commitments, sweeping privacy or security claims, and claims that outrun the mechanisms stated. Do not demand publication of sensitive controls, ciphers, customer data, or internal incident procedures.

5. CURRENCY AND PROOF PATHS: Effective dates, policy-change language, contact routes, and visible links make the document maintainable and verifiable where applicable.

SCOPE LIMIT: Do not penalize the absence of new contract clauses, remedies, liability carve-outs, billing rules, transfer modules, or jurisdiction-specific obligations. Do not draft new legal terms. In particular, do not deduct or suggest changes for indemnity scope or procedure; notice mechanics, channels, or timing; legal-hold definitions; transfer arrangements; expansion of standard data or content definitions; domain or product enumeration; retention override rules; applicability to people without accounts; or unpublished internal policy and endpoint documentation. Capitalized terms and concise standard clauses do not need to be expanded merely to earn a higher score.

CONTROLLED WORDING: Do not propose stylistic synonyms or new scope for approved headings, table labels, conditional vendor terms, or retention clauses. Treat phrases such as “Sub-processor categories Customers may opt out of,” “Legal basis,” “External egress redaction + no-retention,” a conditional per-request store setting, “Same as” a fully specified preceding row, a stated two-layer control, “Account data is deleted within 30 days of an account-deletion request,” and “Logs are retained per our Logging and Monitoring Policy” as complete controlled policy wording. The named internal logging policy does not need a public link. Flag these phrases only if another passage on the same page directly contradicts them, not because you would draft, label, or expand them differently. This audit covers editorial clarity, visible public links, and internal consistency within the published scope.

OUTPUT (JSON only):
{
  "score": <1-10 integer>,
  "verdict": "<one-sentence holistic take>",
  "deductions": [
    {"category": "scope|obligation|clarity|claim|currency|other", "phrase": "<offending text, ≤80 chars>", "fix": "<concrete rewrite suggestion, ≤120 chars>"}
  ],
  "wins": ["<specific strength, ≤80 chars>"]
}`;

const BLOG_SYSTEM_PROMPT = `You are a senior technical editor reviewing a public engineering article for Tangle. The reader has never heard of Tangle or its products. Judge the article as an expert technical blog, not as a landing page, product page, reference manual, tweet thread, or academic paper.

Read the complete article. Score it from 1–10 and emit one JSON object with no surrounding prose. A 7 is publishable, 8 is strong, 9 is exceptional, and 10 is rare. Score the article holistically; do not subtract points mechanically for every sentence you could tighten.

RUBRIC:

1. STORY AND USEFULNESS: The opening presents a concrete reader problem or scene. The article develops one coherent argument, supplies enough context to stand alone, and ends with a practical decision. Penalize disconnected facts, generic listicles, repeated summaries, and documentation dumps.

2. ZERO-CONTEXT CLARITY: Define Tangle-native and technical terms before relying on them. Necessary inline definitions are a strength, not bloat. Penalize repeated glossary entries, unexplained insider language, and definitions that interrupt the story without helping the reader.

3. TECHNICAL DEPTH: Reward worked examples, current public code or API shapes, state models, calculations, traces, tables, and failure investigations. Long articles of roughly 2,000–4,500 words are appropriate when each section advances the argument. Do not penalize length by itself.

4. CLAIM AND EVIDENCE HYGIENE: Important claims name a mechanism, public primary source, measured conditions, or explicit limitation. Link destinations shown in brackets are real rendered citations. Teaching examples are clearly illustrative. Penalize invented results, unsupported superlatives, private implementation details, local paths, commit archaeology, and author-side repository commands.

5. HUMAN PROSE: Penalize clipped tweet-thread cadence, canned transitions, ritual FAQs, fake quotations, throat-clearing, repeated heading templates, hollow adjectives, marketing clichés, and conclusions that merely restate the introduction. Do not penalize an occasional short sentence, numbered procedure, or descriptive heading that genuinely helps.

6. PRODUCT BOUNDARIES: The article distinguishes protocol state, payment, execution, traces, evaluations, attestation, and result quality. It never implies that payment, a TEE, a model, an operator, or Tangle proves correctness beyond the evidence described.

7. SEARCH AND ANSWER QUALITY: The reader's likely query is answered naturally in the title, opening, and descriptive headings. Direct question headings are useful when they answer distinct intent. Penalize keyword stuffing and generic FAQ scaffolding.

8. RENDERED COPY: Treat table rows separated by pipes as real tables, bracketed URLs as link destinations, and code or CLI examples as technical artifacts. The public Tangle Browser Agent CLI is genuinely named "bad"; do not flag that executable as a typo. Do not invent truncation, malformed formatting, or missing sections when the supplied article reaches the END marker.

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

const LEGAL_ROUTES = new Set(['/privacy-policy', '/sub-processors', '/terms-of-service']);
const EDITORIAL_INDEX_ROUTES = new Set(['/blog', '/releases', '/research']);

function selectRubric(route) {
  if (EDITORIAL_INDEX_ROUTES.has(route) || route.startsWith('/blog/series/')) {
    return { name: 'editorial-index', prompt: EDITORIAL_INDEX_SYSTEM_PROMPT };
  }
  if (LEGAL_ROUTES.has(route)) {
    return { name: 'legal', prompt: LEGAL_SYSTEM_PROMPT };
  }
  if (route.startsWith('/blog/')) {
    return { name: 'article', prompt: BLOG_SYSTEM_PROMPT };
  }
  return { name: 'marketing', prompt: MARKETING_SYSTEM_PROMPT };
}

function validateAudit(audit) {
  const validScore = Number.isInteger(audit?.score) && audit.score >= 1 && audit.score <= 10;
  const validVerdict = typeof audit?.verdict === 'string' && audit.verdict.trim().length > 0;
  const validDeductions = Array.isArray(audit?.deductions)
    && audit.deductions.every((deduction) => deduction
      && typeof deduction === 'object'
      && typeof deduction.category === 'string'
      && typeof deduction.phrase === 'string'
      && typeof deduction.fix === 'string');
  const validWins = Array.isArray(audit?.wins)
    && audit.wins.every((win) => typeof win === 'string');

  if (!validScore || !validVerdict || !validDeductions || !validWins) {
    throw new Error('provider response failed the copy-audit schema');
  }

  return audit;
}

async function auditPage(label, copy, attempt = 1) {
  const userMessage = `Page: ${label}\n\n=== COPY ===\n${copy}\n=== END ===`;
  const rubric = selectRubric(label);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`copy auditor timed out after ${AUDITOR_TIMEOUT_MS}ms`)), AUDITOR_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: rubric.prompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`provider ${res.status}: ${errBody.slice(0, 200)}`);
      err.attempts = attempt;
      err.transientAuditFailure = res.status === 429 || res.status === 502 || res.status === 503;
      err.configurationAuditFailure = res.status === 401 || res.status === 403;
      throw err;
    }

    const json = await res.json();
    if (typeof json.model !== 'string' || !/(^|\/)gpt-5\.6-luna$/.test(json.model)) {
      const err = new Error(`provider model identity mismatch: expected gpt-5.6-luna, received ${json.model ?? 'null'}`);
      err.attempts = attempt;
      throw err;
    }
    const content = json.choices?.[0]?.message?.content ?? '{}';
    let audit;
    try {
      audit = validateAudit(JSON.parse(content));
    }
    catch (cause) {
      const err = new Error(`provider returned invalid audit JSON: ${cause.message}`);
      err.attempts = attempt;
      throw err;
    }

    return {
      audit,
      attempts: attempt,
      rubric: rubric.name,
      providerMetadata: {
        servedModel: typeof json.model === 'string' ? json.model : null,
        provider: res.headers.get('x-tangle-provider')
          ?? res.headers.get('x-tangle-prompt-cache-provider')
          ?? null,
        requestId: res.headers.get('x-request-id')
          ?? res.headers.get('request-id')
          ?? (typeof json.id === 'string' ? json.id : null),
        responseCache: res.headers.get('x-tangle-cache') ?? null,
      },
    };
  }
  catch (cause) {
    const err = cause instanceof Error ? cause : new Error(String(cause));
    err.attempts = attempt;
    if (attempt < 4 && isTransientAuditFailure(err)) {
      const wait = 1500 * Math.pow(2, attempt - 1);
      await sleep(wait);
      return auditPage(label, copy, attempt + 1);
    }
    throw err;
  }
  finally {
    clearTimeout(timeout);
  }
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
console.log(`▸ Auditing ${auditTargets.length} route${auditTargets.length === 1 ? '' : 's'} via ${MODEL}…`);
console.log(`▸ Threshold: ${THRESHOLD}/10. Pages below fail this script.`);
console.log('');

const results = [];
const startedAt = new Date().toISOString();

function writeAuditArtifact(status) {
  const scored = results.filter((r) => r.status === 'scored');
  const passing = scored.filter((r) => r.ok);
  const failing = scored.filter((r) => !r.ok);
  const errors = results.filter((r) => r.status === 'error');
  const skipped = results.filter((r) => r.status === 'skipped');
  const redirected = results.filter((r) => r.status === 'redirect');
  const averageScore = scored.length === 0
    ? null
    : scored.reduce((sum, result) => sum + result.score, 0) / scored.length;

  mkdirSync(dirname(ARTIFACT_PATH), { recursive: true });
  writeFileSync(ARTIFACT_PATH, `${JSON.stringify({
    schemaVersion: 1,
    status,
    startedAt,
    updatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    configuration: {
      model: MODEL,
      threshold: THRESHOLD,
      timeoutMs: AUDITOR_TIMEOUT_MS,
      totalRoutes: auditTargets.length,
      requestedRoutes: pageArgs,
      redirectDeclarations,
      configurationErrors: redirectConfigurationErrors,
    },
    summary: {
      processed: results.length,
      scored: scored.length,
      passed: passing.length,
      failed: failing.length,
      errors: errors.length,
      skipped: skipped.length,
      redirected: redirected.length,
      unprocessed: auditTargets.length - results.length,
      configurationErrors: redirectConfigurationErrors.length,
      averageScore,
    },
    results,
  }, null, 2)}\n`);
}

writeAuditArtifact('running');

if (redirectConfigurationErrors.length > 0) {
  for (const error of redirectConfigurationErrors) console.error(`✗ ${error}`);
  writeAuditArtifact('failed');
  process.exit(2);
}

for (const { route, file, redirectDeclaration } of auditTargets) {
  process.stdout.write(`  ▸ ${route.padEnd(38)} `);
  const pageStartedAt = Date.now();
  try {
    const redirect = redirectDeclaration ?? redirects.get(route);
    if (redirect) {
      console.log(`redirect ${redirect.status} → ${redirect.target}`);
      results.push({
        route,
        status: 'redirect',
        target: redirect.target,
        httpStatus: redirect.status,
        dynamic: Boolean(redirect.dynamic),
        rubric: 'redirect',
        providerMetadata: {
          servedModel: null,
          provider: null,
          requestId: null,
          responseCache: null,
        },
        durationMs: Date.now() - pageStartedAt,
      });
      writeAuditArtifact('running');
      continue;
    }

    if (!file || !existsSync(file)) {
      throw new Error('rendered route is missing and has no declared redirect');
    }
    const html = readFileSync(file, 'utf8');
    const copy = extractCopy(html, route);
    if (copy.length < 80) {
      throw new Error(`rendered page has only ${copy.length} visible characters and no declared redirect`);
    }
    const { audit, attempts, rubric, providerMetadata } = await auditPage(route, copy);
    // Polite throttle — keep router happy across many pages.
    await sleep(400);
    const score = Number(audit.score) || 0;
    const dedCount = (audit.deductions ?? []).length;
    const winCount = (audit.wins ?? []).length;
    const ok = score >= THRESHOLD;
    console.log(`${ok ? '✓' : '✗'} ${score.toFixed(1).padStart(4)}/10  · ${dedCount} flag${dedCount === 1 ? '' : 's'} · ${winCount} win${winCount === 1 ? '' : 's'}`);
    results.push({
      route,
      status: 'scored',
      score,
      ok,
      attempts,
      rubric,
      providerMetadata,
      copyLength: copy.length,
      durationMs: Date.now() - pageStartedAt,
      audit,
    });
    writeAuditArtifact('running');
  }
  catch (err) {
    console.log(`error: ${err.message.slice(0, 80)}`);
    results.push({
      route,
      status: 'error',
      error: err.message,
      attempts: err.attempts ?? null,
      rubric: selectRubric(route).name,
      providerMetadata: {
        servedModel: null,
        provider: null,
        requestId: null,
        responseCache: null,
      },
      transientAuditFailure: isTransientAuditFailure(err),
      configurationAuditFailure: Boolean(err.configurationAuditFailure),
      durationMs: Date.now() - pageStartedAt,
    });
    writeAuditArtifact('running');
    if (err.configurationAuditFailure) {
      console.log('stop (copy-audit credentials were rejected)');
      break;
    }
    const recentResults = results.slice(-TRANSIENT_FAILURE_SHORT_CIRCUIT);
    if (
      recentResults.length === TRANSIENT_FAILURE_SHORT_CIRCUIT
      && recentResults.every((r) => r.status === 'error' && r.transientAuditFailure)
    ) {
      console.log(`stop (auditor unavailable after ${TRANSIENT_FAILURE_SHORT_CIRCUIT} consecutive transient failures)`);
      break;
    }
  }
}

const scored = results.filter((r) => r.status === 'scored');
const failing = scored.filter((r) => !r.ok);
const passing = scored.filter((r) => r.ok);
const errors = results.filter((r) => r.status === 'error');
const skipped = results.filter((r) => r.status === 'skipped');
const redirected = results.filter((r) => r.status === 'redirect');
const unprocessed = auditTargets.length - results.length;

// ─── Detail ──────────────────────────────────────────────────────────
if (failing.length > 0 || errors.length > 0) {
  console.log('');
  console.log('FAILED PAGES:');
  for (const r of [...failing, ...errors]) {
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
console.log(`Avg: ${avg.toFixed(2)}/10. Routes: ${auditTargets.length}. Scored: ${scored.length}. Pass: ${passing.length}. Fail: ${failing.length}. Errors: ${errors.length}. Redirected: ${redirected.length}. Skipped: ${skipped.length}. Unprocessed: ${unprocessed}.`);

const infrastructureFailure = redirectConfigurationErrors.length > 0 || errors.length > 0 || skipped.length > 0 || unprocessed > 0;
writeAuditArtifact(infrastructureFailure || failing.length > 0 ? 'failed' : 'passed');
process.exit(infrastructureFailure ? 2 : failing.length > 0 ? 1 : 0);
