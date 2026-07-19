// Regenerate src/data/benchmarks/results/tax.json from the REAL TaxCalcBench runs.
// Ship rule: a config appears iff it completed the FULL held-out set (all 51
// scenarios). Score = mean by_line over the 51 final attempts. CI = 95% t-interval
// of the mean (df = n-1). Cost = mean $/return. No steered rows (none exist in data).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNS = process.argv[2] || '/Users/drew/webb/tax-agent/tests/eval/benchmarks/taxcalc/.runs';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/data/benchmarks/results/tax.json');

// which run files feed the board, and the display identity for each config.
// harness configs come from bridge-*; the lone completed raw model from matrix51.
const CONFIGS = [
  { file: 'bridge-codex_gpt-5.5.jsonl',        model: 'gpt-5.5', harness: 'codex',       method: 'harness', loop: 'harness-native', agentProfile: 'harness default' },
  { file: 'bridge-claude-code_opus.jsonl',     model: 'opus',    harness: 'claude-code', method: 'harness', loop: 'harness-native', agentProfile: 'harness default' },
  { file: 'bridge-claude-code_sonnet.jsonl',   model: 'sonnet',  harness: 'claude-code', method: 'harness', loop: 'harness-native', agentProfile: 'harness default' },
  { file: 'bridge-claude-code_haiku.jsonl',    model: 'haiku',   harness: 'claude-code', method: 'harness', loop: 'harness-native', agentProfile: 'harness default' },
  { file: 'matrix51-gpt-5.1.jsonl',            model: 'gpt-5.1', harness: 'router',      method: 'raw',     loop: 'single-shot',    agentProfile: 'raw' },
];

const FULL_SET = 51;              // TaxCalcBench held-out returns in this sweep
const T_975 = { 50: 2.0086 };     // Student-t 0.975 quantile, df=50 (n=51)

function collect(file) {
  const byScen = new Map(); // scenarioId -> {byLine, cost} (last record wins)
  for (const line of readFileSync(join(RUNS, file), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const byLine = r.outcome?.raw?.by_line;
    if (typeof byLine !== 'number') continue;
    byScen.set(r.scenarioId, { byLine, cost: r.costUsd || 0 });
  }
  return byScen;
}

const rows = [];
for (const c of CONFIGS) {
  const byScen = collect(c.file);
  const n = byScen.size;
  if (n !== FULL_SET) { console.error(`SKIP ${c.model}/${c.harness}: n=${n} != ${FULL_SET} (incomplete)`); continue; }
  const scores = [...byScen.values()].map(v => v.byLine);
  const costs = [...byScen.values()].map(v => v.cost);
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance) / Math.sqrt(n);
  const t = T_975[n - 1] ?? 1.96;
  const ciLow = Math.max(0, mean - t * se);
  const ciHigh = Math.min(1, mean + t * se);
  const costUsd = costs.reduce((a, b) => a + b, 0) / n;
  rows.push({
    model: c.model, harness: c.harness, method: c.method, loop: c.loop, agentProfile: c.agentProfile,
    score: +mean.toFixed(4), ciLow: +ciLow.toFixed(4), ciHigh: +ciHigh.toFixed(4),
    n, costUsd: +costUsd.toFixed(4), date: '2026-07-19',
  });
}
rows.sort((a, b) => b.score - a.score);
if (rows.length) rows[0].highlight = true;

const out = {
  benchmark: 'taxcalc-ty24',
  source: `TaxCalcBench (Column Tax, TY2024) — every configuration that completed the full held-out set, each on the same ${FULL_SET} returns (n=${FULL_SET}). Coding harnesses via cli-bridge; raw model via Tangle router.`,
  generated: '2026-07-19',
  note: `Every bar is the same ${FULL_SET} held-out TY2024 returns (uniform n=${FULL_SET}), scored line-by-line by Column Tax's own grader. Colour = method: a coding harness (its own agentic loop with tools) vs a raw single-shot model call. Harnesses each run a different base model, so this ranks configurations, not one controlled variable.`,
  rows,
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${rows.length} rows (all n=${FULL_SET}) -> ${OUT}`);
for (const r of rows) console.log(`  ${(r.score*100).toFixed(1)}%  [${(r.ciLow*100).toFixed(1)}-${(r.ciHigh*100).toFixed(1)}]  ${r.model}/${r.harness}  $${r.costUsd}  ${r.method}`);
