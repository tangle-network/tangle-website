// Domain benchmark runner (scaffold). Sweeps a matrix of AgentProfiles through
// a domain's held-out eval suite and exports a ranked leaderboard the site
// reads (src/data/benchmarks/results/<domain>.json).
//
// The ambition: point the model dimension at the Tangle router (one key, every
// model) and fan the sandbox dimension across fast staging sandboxes, so a full
// profile matrix runs in parallel. This file wires the shape; the actual
// campaign call is gated behind --run so we never fire a large paid sweep by
// accident or against unverified staging.
//
// Usage:
//   node scripts/run-domain-bench.mjs --domain tax --dry        # print the matrix, no runs
//   node scripts/run-domain-bench.mjs --domain tax --run        # execute (needs router + staging)
//
// Real integration TODO (next session, once staging capacity is confirmed):
//   - import runEvalCampaign from '@tangle-network/agent-eval'
//   - load the domain's scenarios (tax-agent tests/eval/canonical.ts, etc.)
//   - set OPENAI_BASE_URL=https://router.tangle.tools + TANGLE_API_KEY
//   - variants = the AgentProfile matrix below; seeds for stability
//   - export RunRecord[] -> aggregate per (model,harness) -> ranked rows

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/benchmarks/results');

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i + 1] ?? true) : d; };
const DOMAIN = arg('domain', 'tax');
const RUN = args.includes('--run');

// Domains -> their eval entrypoint (real, runnable commands).
const DOMAINS = {
  tax: { repo: 'tax-agent', evalCmd: 'pnpm eval', suite: 'tests/eval/canonical.ts', target: 0.8 },
  legal: { repo: 'legal-agent', evalCmd: 'pnpm eval', suite: 'tests/eval/canonical.ts', target: 0.8 },
  creative: { repo: 'blueprint-agent', evalCmd: 'pnpm eval:creative', suite: 'verticalbench', target: 0.8 },
  companybench: { repo: 'blueprint-agent', evalCmd: 'pnpm tsx scripts/experiments/run-n3.ts', suite: 'verticalbench', target: 0.8 },
};

// The AgentProfile matrix to sweep. Models route through the Tangle router so
// one key covers every provider; each is a real snapshot id. Extend freely —
// each row becomes a leaderboard entry once measured.
const MODEL_MATRIX = [
  'claude-sonnet-5', 'claude-fable-5', 'gpt-5.5', 'gemini-3-pro', 'kimi-k2',
];
const HARNESS_MATRIX = ['blueprint-agent'];

function buildMatrix(domain) {
  const cells = [];
  for (const model of MODEL_MATRIX)
    for (const harness of HARNESS_MATRIX)
      cells.push({ domain, model, harness });
  return cells;
}

const cfg = DOMAINS[DOMAIN];
if (!cfg) { console.error(`unknown domain "${DOMAIN}". known: ${Object.keys(DOMAINS).join(', ')}`); process.exit(1); }

const matrix = buildMatrix(DOMAIN);
console.log(`domain: ${DOMAIN}  (${cfg.repo} · ${cfg.evalCmd} · ${cfg.suite})`);
console.log(`matrix: ${matrix.length} profiles`);
matrix.forEach((c) => console.log(`  · ${c.model} / ${c.harness}`));
console.log(`router: OPENAI_BASE_URL=https://router.tangle.tools (one key, all models)`);
console.log(`sandboxes: fan across staging fast sandboxes (parallel)`);

if (!RUN) {
  console.log('\n[dry] no runs executed. Re-run with --run once router + staging capacity is confirmed.');
  console.log('This scaffold intentionally does not fire a large paid sweep without --run.');
  mkdirSync(OUT, { recursive: true });
  process.exit(0);
}

// --- --run path: intentionally not yet wired to a live campaign ---
// Wiring this requires confirming: (1) router accepts eval traffic on the key,
// (2) staging sandboxes handle parallel load, (3) each domain's scenarios load
// through runEvalCampaign. Do that as a deliberate step, not a blind execution.
console.error('\n--run is not wired to a live campaign yet by design.');
console.error('Next: confirm staging capacity, then wire runEvalCampaign from @tangle-network/agent-eval here.');
console.error('See the TODO block at the top of this file.');
process.exit(2);
