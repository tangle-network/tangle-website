#!/usr/bin/env node
/**
 * Multi-model visual design audit.
 *
 * Screenshots every public marketing page at desktop + mobile, then runs an
 * ensemble of vision LLMs (Claude Opus 4.7, GPT-5, Gemini 2.5 Pro, GLM-4.5V)
 * against a sharp design-director rubric. Findings are ranked by inter-model
 * agreement so consensus issues float to the top and 1-of-4 hot takes get
 * filed as "subjective."
 *
 * Usage:
 *   pnpm audit:visual                         full run
 *   pnpm audit:visual -- --pages /operators,/developers
 *   pnpm audit:visual -- --models claude,gpt
 *   pnpm audit:visual -- --skip-models        screenshots only
 *   pnpm audit:visual -- --reuse <run-id>     skip screenshots, re-score
 *
 * Secrets are read from ~/company/devops/secrets/agent-state.env via dotenvx.
 * The script will spawn `astro dev` if :4321 isn't already listening, and
 * kills it on exit. Output lands in audit-results/<timestamp>/.
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────

const DEV_URL = 'http://localhost:4321';
const DEV_PORT = 4321;
const OUT_ROOT = resolve(ROOT, 'audit-results');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const ROUTES = [
  '/',
  '/overview',
  '/operators',
  '/developers',
  '/ecosystem',
  '/stake',
  '/services/blueprint-agent',
  '/services/browser-agent',
  '/services/sandbox',
  '/brand-kit',
];

// Four-model ensemble. Selected for *diverse priors* — Western reasoning
// (Claude), Western design-trained (GPT), cheap-fast third opinion (Gemini),
// non-Western priors (GLM). Adding more models past 4 hits diminishing
// returns; this is the sweet spot for agreement-as-signal.
const MODELS = {
  claude: {
    label: 'Claude Opus 4.5',
    provider: 'anthropic',
    model: 'claude-opus-4-5',
    keyEnv: 'ANTHROPIC_API_KEY',
  },
  gpt: {
    label: 'GPT-5',
    provider: 'openai-compat',
    model: 'gpt-5',
    baseURL: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
  },
  gemini: {
    label: 'Gemini 2.5 Pro',
    provider: 'openai-compat',
    model: 'gemini-2.5-pro',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyEnv: 'GEMINI_API_KEY',
  },
  glm: {
    label: 'GLM-4.5V',
    provider: 'openai-compat',
    model: 'glm-4.5v',
    baseURL: 'https://api.z.ai/api/paas/v4',
    keyEnv: 'ZAI_API_KEY',
  },
};

// ─── CLI args ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { pages: null, models: null, skipModels: false, reuse: null, concurrency: 4 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--pages') opts.pages = args[++i].split(',').map((p) => p.trim());
    else if (a === '--models') opts.models = args[++i].split(',').map((m) => m.trim());
    else if (a === '--skip-models') opts.skipModels = true;
    else if (a === '--reuse') opts.reuse = args[++i];
    else if (a === '--concurrency') opts.concurrency = parseInt(args[++i], 10);
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(import.meta.filename || __filename, 'utf8').split('\n').slice(2, 22).join('\n').replace(/^ \* ?/gm, ''));
      process.exit(0);
    }
  }
  return opts;
}

const opts = parseArgs();
const OUT = opts.reuse ? resolve(OUT_ROOT, opts.reuse) : resolve(OUT_ROOT, RUN_ID);

// ─── Secrets ──────────────────────────────────────────────────────────────

function loadSecrets() {
  // ANTHROPIC_API_KEY + ZAI_API_KEY live in tangle-router.env; GEMINI_API_KEY
  // + OPENAI_API_KEY live in agent-state.env. Read both, tangle-router last
  // so it wins on overlap (it has the broader fleet keyset).
  const files = [
    '/home/drew/company/devops/secrets/agent-state.env',
    '/home/drew/company/devops/secrets/tangle-router.env',
  ];
  const dotenvx = '/home/drew/bin/dotenvx';
  if (!existsSync(dotenvx)) throw new Error(`Missing ${dotenvx}`);
  const env = {};
  for (const envFile of files) {
    if (!existsSync(envFile)) continue;
    const out = execSync(`${dotenvx} run --quiet -f ${envFile} -- env`, { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

// ─── Dev server lifecycle ─────────────────────────────────────────────────

async function isDevServerUp() {
  try {
    const res = await fetch(DEV_URL, { signal: AbortSignal.timeout(2000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function ensureDevServer() {
  if (await isDevServerUp()) {
    console.log(`✓ dev server already running at ${DEV_URL}`);
    return null;
  }
  console.log(`⌖ starting dev server (pnpm dev)…`);
  const child = spawn('pnpm', ['dev', '--port', String(DEV_PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  // Pipe a tiny tail to console so user sees progress.
  child.stdout.on('data', (d) => process.stdout.write(`  dev: ${d.toString().split('\n')[0]}\n`));
  child.stderr.on('data', (d) => process.stderr.write(`  dev! ${d.toString().split('\n')[0]}\n`));
  // Wait for port to come up. 60s ceiling.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isDevServerUp()) {
      console.log(`✓ dev server up`);
      return child;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill('SIGTERM');
  throw new Error('Dev server failed to start within 60s');
}

// ─── Screenshot capture ───────────────────────────────────────────────────

async function captureAll(routes) {
  const browser = await chromium.launch({ headless: true });
  const screenshots = [];
  try {
    for (const route of routes) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce', // freeze hero animations for stable shots
        });
        const page = await ctx.newPage();
        const url = `${DEV_URL}${route}`;
        const slug = route === '/' ? 'index' : route.replace(/^\//, '').replace(/\//g, '-');
        const out = resolve(OUT, 'screenshots', `${slug}-${vp.name}.png`);
        await mkdir(dirname(out), { recursive: true });
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
          // Belt-and-suspenders: give CodeWindow typing/IntersectionObserver
          // reveals a beat to finish before capturing.
          await page.waitForTimeout(1200);
          await page.screenshot({ path: out, fullPage: true });
          console.log(`  📸 ${route} (${vp.name}) → ${slug}-${vp.name}.png`);
          screenshots.push({ route, viewport: vp.name, file: out, slug });
        } catch (e) {
          console.error(`  ✗ ${route} (${vp.name}): ${e.message}`);
        }
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
  return screenshots;
}

// ─── Rubric prompt ────────────────────────────────────────────────────────

function rubricPrompt({ route, viewport, pageSourceExcerpt }) {
  return `You are a senior design director who has reviewed 10,000 SaaS landing pages for Stripe, Linear, Vercel, and Anthropic. You do not sugar-coat and you do not pad with niceties. When something is broken, you say "this is broken." When something is generic, you say "this could be on any landing page." Only flag what an A-tier reviewer would call out — quality over quantity.

You're auditing this screenshot of Tangle Network's marketing page: ${route} (${viewport} viewport).

CONTEXT — TANGLE'S VOICE & GOAL:
Tangle Network is a crypto-economic substrate for decentralized AI services. They sell Blueprints (reusable service templates that operators run for fees). Their target audience is senior infra engineers, CTOs of crypto/AI infra companies, and protocol developers. Their voice is concrete, mechanical, terse — Stripe-meets-Linear. They specifically reject:
- Hype words ("revolutionary", "unlock", "transform", "supercharge")
- Empty adjectives ("seamless", "robust", "powerful", "enterprise-grade")
- Web3 buzzword stew ("decentralized" used as a synonym for "good")
- Generic SaaS templates ("Build better X faster")

FIND ISSUES IN THESE CATEGORIES:
• copy        — weak headlines, generic claims, jargon, sentences that don't differentiate Tangle from any competitor
• hierarchy   — visual rhythm, h1/h2/h3 weight, eyebrow legibility, broken vertical pacing
• contrast    — text-on-bg AA failures, ghost elements (border-only on same-bg surface)
• spacing     — cramped sections, asymmetric padding, dead-space, content-density imbalance
• theme       — dark/light surface bugs, gradient text invisible on wrong surface, cards bleeding into bg
• cta         — button hierarchy, weak CTAs, missing CTA where the page is selling
• layout      — broken responsive, overflow, misalignment, off-grid elements

OUTPUT — strict JSON only, no markdown fences, no preamble:
{
  "findings": [
    {
      "severity": "critical" | "warn" | "nit",
      "category": "copy" | "hierarchy" | "contrast" | "spacing" | "theme" | "cta" | "layout",
      "location": "above-fold" | "hero" | "stats-strip" | "cards" | "features" | "midpage" | "cta-block" | "footer" | "faq",
      "finding": "ONE tight sentence naming the specific issue",
      "evidence": "what's visible in the screenshot that proves it",
      "fix": "one-line concrete fix"
    }
  ],
  "overall_score": <integer 1-10>,
  "one_line_verdict": "<single sentence>"
}

SEVERITY GUIDE:
- critical: ships broken (white-on-white, broken layout, hero claim is empty, CTA missing on purchase page)
- warn:     obvious to a senior reviewer (generic headline, weak CTA, jargon-stew copy)
- nit:      subjective polish (one px padding, color tone preference)

RULES:
- Max 10 findings per screenshot. Quality > quantity. Empty array is fine.
- Do NOT pad with nits. If the page is good, score it 8+ and list few or zero findings.
- Be specific. "Hero could be stronger" → bad. "Hero H1 'Build decentralized services' is a generic template — doesn't name the buyer or the mechanic" → good.
- Reference visible page elements when possible.

${pageSourceExcerpt ? `\nPAGE SOURCE (for context — JSX/Astro):\n\`\`\`\n${pageSourceExcerpt.slice(0, 4000)}\n\`\`\`\n` : ''}`;
}

// ─── Model callers ────────────────────────────────────────────────────────

async function callAnthropic({ modelDef, env, prompt, imagePath }) {
  const client = new Anthropic({ apiKey: env[modelDef.keyEnv] });
  const imageB64 = readFileSync(imagePath).toString('base64');
  const res = await client.messages.create({
    model: modelDef.model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageB64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });
  const text = res.content.find((b) => b.type === 'text')?.text ?? '';
  return text;
}

async function callOpenAICompat({ modelDef, env, prompt, imagePath }) {
  const client = new OpenAI({
    apiKey: env[modelDef.keyEnv],
    baseURL: modelDef.baseURL,
  });
  const imageB64 = readFileSync(imagePath).toString('base64');
  // gpt-5 / o-series don't accept temperature; safe to omit for everyone.
  const req = {
    model: modelDef.model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    max_completion_tokens: 4096,
  };
  const res = await client.chat.completions.create(req);
  return res.choices[0]?.message?.content ?? '';
}

async function callModel({ modelKey, modelDef, env, prompt, imagePath }) {
  try {
    if (modelDef.provider === 'anthropic') return await callAnthropic({ modelDef, env, prompt, imagePath });
    if (modelDef.provider === 'openai-compat') return await callOpenAICompat({ modelDef, env, prompt, imagePath });
    throw new Error(`unknown provider: ${modelDef.provider}`);
  } catch (e) {
    console.error(`  ✗ ${modelKey} failed: ${e.message}`);
    return null;
  }
}

function extractJSON(text) {
  if (!text) return null;
  // Strip code fences.
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
  // Try direct parse first.
  try {
    return JSON.parse(cleaned);
  } catch {}
  // Fall back: find the first {...} block.
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// ─── Page source for prompt context ──────────────────────────────────────

async function loadPageSource(route) {
  const filename = route === '/' ? 'index.astro' : `${route.replace(/^\//, '')}.astro`;
  const path = resolve(ROOT, 'src/pages', filename);
  if (!existsSync(path)) return null;
  return readFile(path, 'utf8');
}

// ─── Agreement scoring ────────────────────────────────────────────────────

/**
 * Bucket findings by (category, location). Within each bucket, count distinct
 * models that contributed. Bucket size ≥ 3 = HIGH consensus, 2 = MODERATE,
 * 1 = LOW (model-specific opinion). Within a bucket we keep every model's
 * finding text verbatim so you can see what they each said.
 */
function scoreAgreement(perModelFindings) {
  const buckets = new Map();
  for (const [modelKey, findings] of Object.entries(perModelFindings)) {
    if (!findings) continue;
    for (const f of findings) {
      const key = `${f.category}::${f.location}`;
      if (!buckets.has(key)) buckets.set(key, { category: f.category, location: f.location, byModel: {} });
      const b = buckets.get(key);
      if (!b.byModel[modelKey]) b.byModel[modelKey] = [];
      b.byModel[modelKey].push(f);
    }
  }
  return [...buckets.values()]
    .map((b) => ({
      ...b,
      modelCount: Object.keys(b.byModel).length,
      severityRank: Math.max(...Object.values(b.byModel).flat().map((f) => sevRank(f.severity))),
    }))
    .sort((a, b) => b.modelCount - a.modelCount || b.severityRank - a.severityRank);
}

function sevRank(s) {
  return s === 'critical' ? 3 : s === 'warn' ? 2 : 1;
}

function agreementLabel(modelCount) {
  if (modelCount >= 3) return 'HIGH';
  if (modelCount === 2) return 'MODERATE';
  return 'LOW';
}

// ─── Markdown report ──────────────────────────────────────────────────────

function renderPageReport({ route, viewport, perModelRaw, perModelFindings, buckets }) {
  const lines = [];
  lines.push(`# Audit: ${route} (${viewport})`);
  lines.push('');
  lines.push(`Run: \`${RUN_ID}\``);
  lines.push('');
  const scores = Object.entries(perModelRaw)
    .map(([k, r]) => `${MODELS[k].label}: ${r?.overall_score ?? '—'}/10`)
    .join(' · ');
  lines.push(`**Scores:** ${scores}`);
  lines.push('');
  const verdicts = Object.entries(perModelRaw)
    .filter(([_, r]) => r?.one_line_verdict)
    .map(([k, r]) => `> **${MODELS[k].label}:** ${r.one_line_verdict}`);
  if (verdicts.length) {
    lines.push('## One-line verdicts');
    lines.push('');
    lines.push(...verdicts);
    lines.push('');
  }
  // Group buckets by agreement level.
  const groups = { HIGH: [], MODERATE: [], LOW: [] };
  for (const b of buckets) groups[agreementLabel(b.modelCount)].push(b);
  for (const [level, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`## ${level} consensus (${items.length})`);
    lines.push('');
    for (const b of items) {
      lines.push(`### ${b.category} · ${b.location} · ${items === groups.LOW ? '1 model' : `${b.modelCount} models`}`);
      lines.push('');
      for (const [modelKey, fs] of Object.entries(b.byModel)) {
        for (const f of fs) {
          const sev = f.severity.toUpperCase();
          lines.push(`- **[${sev}] ${MODELS[modelKey].label}:** ${f.finding}`);
          if (f.evidence) lines.push(`  - *Evidence:* ${f.evidence}`);
          if (f.fix) lines.push(`  - *Fix:* ${f.fix}`);
        }
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

function renderSummary({ allPages, runId, modelKeys }) {
  // Cross-site consensus = same (category, location) bucket showing up across
  // many pages with HIGH agreement. Surfaces systemic issues vs page-specific.
  const systemic = new Map();
  for (const p of allPages) {
    for (const b of p.buckets) {
      if (b.modelCount >= 3) {
        const key = `${b.category}::${b.location}`;
        if (!systemic.has(key)) systemic.set(key, { category: b.category, location: b.location, pages: [] });
        systemic.get(key).pages.push(`${p.route} (${p.viewport})`);
      }
    }
  }
  const systemicList = [...systemic.values()].sort((a, b) => b.pages.length - a.pages.length);

  const pageRank = [...allPages].sort((a, b) => {
    const aHigh = a.buckets.filter((x) => x.modelCount >= 3).length;
    const bHigh = b.buckets.filter((x) => x.modelCount >= 3).length;
    return bHigh - aHigh;
  });

  const lines = [];
  lines.push(`# Visual Audit Summary — ${runId}`);
  lines.push('');
  lines.push(`Models: ${modelKeys.map((k) => MODELS[k].label).join(' · ')}`);
  lines.push('');
  lines.push(`## Pages ranked by # of HIGH-consensus issues`);
  lines.push('');
  lines.push('| Page | Viewport | HIGH | MODERATE | LOW | Avg score |');
  lines.push('|---|---|---|---|---|---|');
  for (const p of pageRank) {
    const h = p.buckets.filter((b) => b.modelCount >= 3).length;
    const m = p.buckets.filter((b) => b.modelCount === 2).length;
    const l = p.buckets.filter((b) => b.modelCount === 1).length;
    const scores = Object.values(p.perModelRaw).map((r) => r?.overall_score).filter(Boolean);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    lines.push(`| [${p.route}](./${p.slug}-${p.viewport}.md) | ${p.viewport} | ${h} | ${m} | ${l} | ${avg} |`);
  }
  lines.push('');

  lines.push(`## Systemic issues (HIGH consensus, multiple pages)`);
  lines.push('');
  if (!systemicList.length) {
    lines.push('_None — issues are page-specific._');
  } else {
    for (const s of systemicList) {
      lines.push(`### ${s.category} · ${s.location} — ${s.pages.length} page(s)`);
      for (const p of s.pages) lines.push(`- ${p}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const routes = opts.pages ?? ROUTES;
  const modelKeys = opts.models ?? Object.keys(MODELS);
  const env = loadSecrets();

  // Validate keys upfront so we fail fast.
  for (const k of modelKeys) {
    if (!MODELS[k]) throw new Error(`Unknown model: ${k}. Known: ${Object.keys(MODELS).join(',')}`);
    if (!env[MODELS[k].keyEnv]) throw new Error(`Missing env ${MODELS[k].keyEnv} for ${k}`);
  }

  await mkdir(OUT, { recursive: true });
  console.log(`▶ Visual audit run: ${RUN_ID}`);
  console.log(`  Routes: ${routes.join(', ')}`);
  console.log(`  Models: ${modelKeys.map((k) => MODELS[k].label).join(' · ')}`);
  console.log(`  Out:    ${OUT}`);
  console.log('');

  let screenshots;
  if (opts.reuse) {
    // Reuse mode: re-read screenshots from a prior run.
    const dir = resolve(OUT_ROOT, opts.reuse, 'screenshots');
    if (!existsSync(dir)) throw new Error(`Reuse dir not found: ${dir}`);
    const files = await readdir(dir);
    screenshots = files
      .filter((f) => f.endsWith('.png'))
      .map((f) => {
        const m = f.match(/^(.+)-(desktop|mobile)\.png$/);
        if (!m) return null;
        const slug = m[1];
        const viewport = m[2];
        const route = slug === 'index' ? '/' : '/' + slug.replace(/-/g, '/');
        return { route, viewport, slug, file: resolve(dir, f) };
      })
      .filter(Boolean);
    console.log(`✓ reusing ${screenshots.length} screenshots from ${opts.reuse}`);
  } else {
    let devProc = null;
    try {
      devProc = await ensureDevServer();
      screenshots = await captureAll(routes);
    } finally {
      if (devProc) {
        console.log('  stopping dev server…');
        devProc.kill('SIGTERM');
      }
    }
    console.log(`✓ captured ${screenshots.length} screenshots`);
  }

  if (opts.skipModels) {
    console.log('✓ --skip-models set; done.');
    return;
  }

  // Run all (screenshot × model) calls. Modest concurrency to be polite.
  const tasks = [];
  for (const s of screenshots) {
    for (const k of modelKeys) tasks.push({ shot: s, modelKey: k });
  }
  console.log(`\n▶ ${tasks.length} model calls queued (${screenshots.length} shots × ${modelKeys.length} models)`);

  const results = new Map(); // key: `${slug}-${viewport}`, val: { [modelKey]: { raw, findings } }
  const sources = new Map();
  for (const s of screenshots) {
    if (!sources.has(s.route)) sources.set(s.route, await loadPageSource(s.route));
  }

  const queue = [...tasks];
  const inflight = new Set();
  const finished = [];
  while (queue.length || inflight.size) {
    while (inflight.size < opts.concurrency && queue.length) {
      const task = queue.shift();
      const { shot, modelKey } = task;
      const prompt = rubricPrompt({
        route: shot.route,
        viewport: shot.viewport,
        pageSourceExcerpt: sources.get(shot.route),
      });
      const key = `${shot.slug}-${shot.viewport}`;
      const p = (async () => {
        const t0 = Date.now();
        const text = await callModel({
          modelKey,
          modelDef: MODELS[modelKey],
          env,
          prompt,
          imagePath: shot.file,
        });
        const parsed = extractJSON(text);
        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        const tag = parsed ? `${parsed.findings?.length ?? 0} findings` : 'PARSE FAIL';
        console.log(`  ✓ ${MODELS[modelKey].label.padEnd(18)} ${shot.route} (${shot.viewport}) — ${tag} [${dt}s]`);
        if (!results.has(key)) results.set(key, { route: shot.route, viewport: shot.viewport, slug: shot.slug, perModel: {} });
        results.get(key).perModel[modelKey] = { raw: parsed, findings: parsed?.findings ?? null, rawText: text };
      })().catch((e) => {
        console.error(`  ✗ ${MODELS[modelKey].label} ${shot.route}: ${e.message}`);
      });
      inflight.add(p);
      p.finally(() => inflight.delete(p));
    }
    if (inflight.size) await Promise.race(inflight);
  }

  // Render per-page reports.
  const pages = [];
  for (const [key, val] of results) {
    const perModelRaw = {};
    const perModelFindings = {};
    for (const [mk, mv] of Object.entries(val.perModel)) {
      perModelRaw[mk] = mv.raw;
      perModelFindings[mk] = mv.findings;
    }
    const buckets = scoreAgreement(perModelFindings);
    const md = renderPageReport({ route: val.route, viewport: val.viewport, perModelRaw, perModelFindings, buckets });
    const reportPath = resolve(OUT, `${val.slug}-${val.viewport}.md`);
    await writeFile(reportPath, md);
    await writeFile(resolve(OUT, `${val.slug}-${val.viewport}.raw.json`), JSON.stringify({ perModel: val.perModel }, null, 2));
    pages.push({ ...val, perModelRaw, buckets });
    console.log(`  📝 ${reportPath.replace(ROOT + '/', '')}`);
  }

  const summary = renderSummary({ allPages: pages, runId: RUN_ID, modelKeys });
  await writeFile(resolve(OUT, 'SUMMARY.md'), summary);
  console.log(`\n✓ SUMMARY.md → ${resolve(OUT, 'SUMMARY.md').replace(ROOT + '/', '')}`);
}

main().catch((e) => {
  console.error(`FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
