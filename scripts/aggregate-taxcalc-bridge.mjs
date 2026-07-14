// Aggregate cli-bridge taxcalc runs (bridge-*.jsonl) into a harness leaderboard.
// Each row = a real harness×model combo (claude-code/opus, codex/gpt-5.5, ...)
// run through the local CLI subscription. Free, reasoning-native. Real data only.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runsDir = process.argv[2] || '/Users/drew/webb/tax-agent/tests/eval/benchmarks/taxcalc/.runs';
const outPath = join(ROOT, 'src/data/benchmarks/results/tax-harness.json');
const files = readdirSync(runsDir).filter((f) => f.startsWith('bridge-') && f.endsWith('.jsonl') && !f.includes('smoke'));
const cells = new Map();
for (const f of files) {
  for (const line of readFileSync(join(runsDir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue; let r; try { r = JSON.parse(line); } catch { continue; }
    const byLine = r.outcome?.raw?.by_line ?? r.outcome?.searchScore;
    if (typeof byLine !== 'number') continue;
    const full = (r.model || '').replace(/@.*$/, '');   // e.g. claude-code/sonnet
    const [harness, ...rest] = full.split('/');
    const model = rest.join('/') || full;
    const key = full;
    if (!cells.has(key)) cells.set(key, { harness, model, scores: [], cost: 0 });
    const c = cells.get(key); c.scores.push(byLine); c.cost += r.costUsd || 0;
  }
}
const rows = [...cells.values()].map((c) => {
  const n = c.scores.length, mean = c.scores.reduce((a, b) => a + b, 0) / n;
  return { model: c.model, harness: c.harness, score: +mean.toFixed(4), n, costUsd: n ? +(c.cost / n).toFixed(4) : undefined, date: new Date().toISOString().slice(0, 10) };
}).sort((a, b) => b.score - a.score);
if (rows.length) rows[0].highlight = true;
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ benchmark: 'taxcalc-ty24-harness', source: 'TaxCalcBench via cli-bridge (local CLI subscriptions)', generated: new Date().toISOString(), rows }, null, 2));
console.log(`harness board: ${rows.length} combos -> ${outPath}`);
rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.harness}/${r.model}  ${(r.score * 100).toFixed(1)}%  n=${r.n}`));
