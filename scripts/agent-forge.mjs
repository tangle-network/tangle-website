// Agent Forge — reproducible AgentProfile -> agent-portrait pipeline.
//
// Two-stage design:
//   Stage 1 (expensive, rare): base robot BODIES are generated with FLUX and
//     live in public/images/agents/. This script does NOT call any paid API.
//   Stage 2 (this script, cheap + deterministic): composite the REAL harness
//     logo, model, tools, and tier treatment onto a base body, driven by the
//     AgentProfile. Real SVG logos are pixel-accurate and free, so features are
//     reproducible from data (unlike hallucinated AI logos).
//
// Usage (working node on PATH; see repo notes for the nvm binary):
//   node scripts/agent-forge.mjs --count 8 --seed 1 --tier mixed
//   node scripts/agent-forge.mjs --profiles path/to/profiles.json
//
// Output: public/images/agents/forged/<id>.png + forged/manifest.json
// Batched (default 8) so a run is cheap and re-runnable; same seed => same set.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');

// inline assets as data URIs so the render is self-contained (file:// and
// localhost both fail or add a server dependency; base64 is reproducible).
const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const dataURICache = new Map();
function dataURI(relPath) {
  if (dataURICache.has(relPath)) return dataURICache.get(relPath);
  const buf = readFileSync(join(PUB, relPath));
  const uri = `data:${MIME[extname(relPath).toLowerCase()] || 'image/png'};base64,${buf.toString('base64')}`;
  dataURICache.set(relPath, uri);
  return uri;
}
const OUT = join(PUB, 'images/agents/forged');
mkdirSync(OUT, { recursive: true });

// ---- args ----
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const COUNT = parseInt(arg('count', '8'), 10);
const SEED = parseInt(arg('seed', '1'), 10);
const TIERFILTER = arg('tier', 'mixed');
const PROFILES_PATH = arg('profiles', null);

// ---- config catalog (mirrors the AgentProfile shape) ----
const HARNESSES = [
  { id: 'claude', name: 'Claude Code', logo: 'images/harness/claude-code.svg' },
  { id: 'codex', name: 'Codex', logo: 'images/harness/codex.png' },
  { id: 'opencode', name: 'OpenCode', logo: 'images/harness/opencode.svg' },
  { id: 'hermes', name: 'Hermes', logo: 'images/harness/hermes.png' },
  { id: 'openclaw', name: 'OpenClaw', logo: 'images/harness/openclaw.png' },
  { id: 'nanoclaw', name: 'NanoClaw', logo: 'images/harness/nanoclaw.png' },
  { id: 'kimi', name: 'Kimi Code', logo: 'images/harness/kimi-code.png' },
  { id: 'pi', name: 'Pi', logo: 'images/harness/pi.svg' },
];
const MODELS = ['claude-sonnet-5', 'claude-fable-5', 'gpt-5.5', 'gemini-3-pro', 'kimi-k2', 'llama-4-405b'];
const TOOLS = ['shell', 'files', 'browser', 'python', 'git', 'sql', 'web', 'http'];
const TIERS = ['Common', 'Uncommon', 'Rare', 'Epic'];

// base bodies grouped by tier (from the fal-generated pool). Auto-discovers any
// bases/ renders; falls back to the flat pool so the script runs today.
function discoverBases() {
  const flat = readdirSync(join(PUB, 'images/agents')).filter((f) => f.endsWith('.png'));
  const basesDir = join(PUB, 'images/agents/bases');
  const bases = existsSync(basesDir) ? readdirSync(basesDir).filter((f) => f.endsWith('.png')) : [];
  const pick = (re, dir, arr) => arr.filter((f) => re.test(f)).map((f) => `images/agents/${dir}${f}`);
  const byTier = {
    Epic: [...pick(/^body-rare/, 'bases/', bases), ...pick(/^(epic|woven)/, '', flat)],
    Rare: [...pick(/^body-rare/, 'bases/', bases), ...pick(/^(rare|crystal)/, '', flat)],
    Uncommon: [...pick(/^body-common/, 'bases/', bases), ...pick(/^(matte)/, '', flat)],
    Common: [...pick(/^body-common/, 'bases/', bases), ...pick(/^(common|matte)/, '', flat)],
  };
  for (const t of TIERS) if (!byTier[t].length) byTier[t] = pick(/./, '', flat);
  return byTier;
}

// deterministic PRNG so a seed reproduces the exact roster
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function buildProfiles() {
  if (PROFILES_PATH) return JSON.parse(readFileSync(PROFILES_PATH, 'utf8'));
  const byTier = discoverBases();
  const out = [];
  for (let i = 0; i < COUNT; i++) {
    const r = mulberry32(SEED * 1000 + i * 97);
    const tier = TIERFILTER !== 'mixed' && TIERS.includes(TIERFILTER)
      ? TIERFILTER
      : TIERS[Math.floor(r() * r() * TIERS.length)]; // skew toward common
    const bases = byTier[tier];
    const harness = HARNESSES[Math.floor(r() * HARNESSES.length)];
    const nTools = 2 + Math.floor(r() * 4);
    const tools = [...TOOLS].sort(() => r() - 0.5).slice(0, nTools);
    out.push({
      id: `AGENT-${String(1000 + SEED * 100 + i).padStart(4, '0')}`,
      base: bases[Math.floor(r() * bases.length)],
      tier, harness, model: MODELS[Math.floor(r() * MODELS.length)],
      tools, level: 1 + TIERS.indexOf(tier) * 2 + Math.floor(r() * 3),
    });
  }
  return out;
}

// the composited card template (features baked onto the base body)
function cardHTML(p) {
  const tierGlow = { Common: '0', Uncommon: '0.15', Rare: '0.4', Epic: '0.75' }[p.tier];
  const toolPips = p.tools.map((t) => `<span class="pip">${t}</span>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{width:640px;height:640px;overflow:hidden;font-family:'Inter',system-ui,sans-serif;
      background:radial-gradient(120% 100% at 50% 30%, #17173e, #0b0b1c 70%);position:relative}
    .aura{position:absolute;inset:-20%;background:radial-gradient(circle at 50% 42%, rgba(129,140,248,${tierGlow}), transparent 55%)}
    .body{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
      filter:saturate(0.74) hue-rotate(-15deg) brightness(1.03)}
    /* chest emblem: the real harness logo on a glass badge */
    .emblem{position:absolute;left:50%;top:53%;transform:translate(-50%,-50%);
      width:84px;height:84px;border-radius:20px;display:grid;place-items:center;padding:16px;
      background:#f5f5fb;border:1px solid rgba(255,255,255,0.6);
      box-shadow:0 10px 30px rgba(0,0,0,0.55), 0 0 26px rgba(129,140,248,0.5), inset 0 1px 2px rgba(255,255,255,0.9)}
    .emblem img{width:100%;height:100%;object-fit:contain}
    /* frame + tier ribbon */
    .frame{position:absolute;inset:10px;border-radius:26px;pointer-events:none;
      border:1px solid rgba(129,140,248,${p.tier==='Epic'?'0.7':p.tier==='Rare'?'0.4':'0.16'})}
    .tier{position:absolute;top:22px;left:22px;padding:5px 12px;border-radius:999px;font:600 13px 'JetBrains Mono',monospace;
      letter-spacing:0.06em;text-transform:uppercase;color:#fff;
      background:${p.tier==='Epic'?'linear-gradient(90deg,#6366f1,#818cf8)':p.tier==='Rare'?'rgba(79,70,229,0.6)':'rgba(12,11,29,0.7)'};
      border:1px solid rgba(199,201,238,0.3)}
    .lvl{position:absolute;top:22px;right:22px;padding:5px 12px;border-radius:999px;font:700 13px 'JetBrains Mono',monospace;
      color:#fff;background:rgba(79,70,229,0.85)}
    /* footer: harness name + model + tool pips */
    .foot{position:absolute;left:22px;right:22px;bottom:20px;display:flex;flex-direction:column;gap:8px}
    .row{display:flex;align-items:center;gap:8px}
    .hname{font:600 20px 'Inter';color:#fff;letter-spacing:-0.01em}
    .model{font:500 13px 'JetBrains Mono',monospace;color:#c7c9f5;background:rgba(129,140,248,0.15);
      border:1px solid rgba(129,140,248,0.3);padding:3px 9px;border-radius:7px}
    .pips{display:flex;flex-wrap:wrap;gap:5px}
    .pip{font:500 11px 'JetBrains Mono',monospace;color:#9a9ac2;background:rgba(129,140,248,0.08);
      border:1px solid rgba(129,140,248,0.2);padding:2px 7px;border-radius:6px}
    .id{position:absolute;bottom:20px;right:22px;font:500 12px 'JetBrains Mono',monospace;color:#6f6f97}
    .scrim{position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(transparent,rgba(8,8,18,0.85))}
  </style></head><body>
    <div class="aura"></div>
    <img class="body" src="${dataURI(p.base)}">
    <div class="scrim"></div>
    <div class="emblem"><img src="${dataURI(p.harness.logo)}"></div>
    <div class="frame"></div>
    <span class="tier">${p.tier}</span>
    <span class="lvl">LV ${p.level}</span>
    <div class="foot">
      <div class="row"><span class="hname">${p.harness.name}</span><span class="model">${p.model}</span></div>
      <div class="pips">${toolPips}</div>
    </div>
    <span class="id">${p.id}</span>
  </body></html>`;
}

// ---- run ----
const profiles = buildProfiles();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 2 });
const manifest = [];
for (const p of profiles) {
  await page.setContent(cardHTML(p), { waitUntil: 'load' });
  await page.waitForTimeout(120);
  const file = join(OUT, `${p.id}.png`);
  await page.screenshot({ path: file });
  manifest.push({ ...p, file: `images/agents/forged/${p.id}.png` });
  console.log(`forged ${p.id}  ${p.tier.padEnd(9)} ${p.harness.name} / ${p.model}`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`\ndone: ${profiles.length} agents -> ${OUT}`);
console.log(`re-run reproducibly: node scripts/agent-forge.mjs --count ${COUNT} --seed ${SEED}`);
