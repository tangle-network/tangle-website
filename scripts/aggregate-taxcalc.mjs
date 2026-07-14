// Aggregate taxcalc RunRecords (from tax-agent's run_taxcalc.py) into the
// per-model leaderboard rows the benchmarks page consumes. Real data only:
// one row per (model, profile), score = mean by-line across that cell's cases.
//
// Usage: node scripts/aggregate-taxcalc.mjs <runs-dir> [--out src/data/benchmarks/results/tax.json]
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runsDir = process.argv[2] || '/Users/drew/webb/tax-agent/tests/eval/benchmarks/taxcalc/.runs';
const outArg = process.argv.indexOf('--out');
const outPath = outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, 'src/data/benchmarks/results/tax.json');

// collect every RunRecord line across matrix-*.jsonl (skip smoke)
const files = readdirSync(runsDir).filter((f) => f.startsWith('matrix-') && f.endsWith('.jsonl'));
const cells = new Map(); // key = model|profileVersion -> {scores[], cost[], model, profile, harness}

for (const f of files) {
  for (const line of readFileSync(join(runsDir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!r.agentProfile || !r.outcome) continue;
    const byLine = r.outcome?.raw?.by_line ?? r.outcome?.searchScore;
    if (typeof byLine !== 'number') continue;
    const model = (r.model || '').replace(/@.*$/, '');           // drop snapshot suffix
    const profile = r.agentProfile?.dimensions?.version || 'baseline';
    const harness = r.agentProfile?.harness?.id || 'taxcalc-direct';
    const key = `${model}|${profile}`;
    if (!cells.has(key)) cells.set(key, { model, profile, harness, scores: [], cost: 0 });
    const c = cells.get(key);
    c.scores.push(byLine);
    c.cost += r.costUsd || 0;
  }
}

const rows = [...cells.values()].map((c) => {
  const n = c.scores.length;
  const mean = c.scores.reduce((a, b) => a + b, 0) / n;
  return {
    model: c.model,
    harness: c.harness,
    promptVersion: c.profile !== 'baseline' ? c.profile : undefined,
    score: +mean.toFixed(4),
    n,
    costUsd: n ? +(c.cost / n).toFixed(4) : undefined,
    date: new Date().toISOString().slice(0, 10),
  };
}).sort((a, b) => b.score - a.score);

if (rows.length) rows[0].highlight = true;
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ benchmark: 'taxcalc-ty24', source: 'TaxCalcBench (Column Tax) via Tangle router', generated: new Date().toISOString(), rows }, null, 2));
console.log(`aggregated ${rows.length} profiles from ${files.length} matrix files -> ${outPath}`);
rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.model}${r.promptVersion ? ' · ' + r.promptVersion : ''}  ${(r.score * 100).toFixed(1)}%  n=${r.n}  $${r.costUsd ?? '—'}`));
