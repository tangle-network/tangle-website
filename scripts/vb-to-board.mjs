/**
 * Export a VerticalBench competition.json (blueprint-agent matrix run) into a
 * domain-board results file this site renders (src/data/benchmarks/results).
 * Replaces hand-pasting run output into the results JSON.
 *
 * Usage:
 *   node scripts/vb-to-board.mjs <competition.json> <board-config.json> [--out <path>]
 *
 * Board config (JSON):
 *   {
 *     "id": "stripe",                       // board slug -> results/<id>.json
 *     "title": "Stripe API Integration",    // display title, stored for provenance
 *     "source": "VerticalBench (private task suite)",   // optional, this is the default
 *     "excludeProfiles": ["@generic$"],     // optional regexes; matching profileIds are dropped
 *     "taskLabels": {                       // optional taskId -> opaque label (+ difficulty)
 *       "stripe-decimal-quantity": { "label": "01", "difficulty": "medium" },
 *       "stripe-pause-subscription": "02"
 *     }
 *   }
 *
 * Mapping into the site schema (src/data/benchmarks/schema.ts):
 *   rows     <- competition.ranked (score = passRate, CI from passRateCi95,
 *               n = graded runs summed from perTaskProfiles)
 *   profiles <- competition.ranked order (the per-task heatmap column order)
 *   perTask  <- competition.perTaskProfiles, task identity replaced by the
 *               opaque label (the task suite stays private; taskIds never ship)
 */
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
let outFlag = null;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') {
    outFlag = args[++i];
  } else if (args[i].startsWith('--')) {
    console.error(`unknown flag ${args[i]}`);
    process.exit(1);
  } else {
    positional.push(args[i]);
  }
}

if (positional.length !== 2) {
  console.error('usage: node scripts/vb-to-board.mjs <competition.json> <board-config.json> [--out <path>]');
  process.exit(1);
}

const [competitionPath, configPath] = positional.map((p) => resolve(p));
const competition = JSON.parse(readFileSync(competitionPath, 'utf8'));
const config = JSON.parse(readFileSync(configPath, 'utf8'));

for (const key of ['id', 'title']) {
  if (!config[key]) {
    console.error(`board config is missing "${key}"`);
    process.exit(1);
  }
}
if (!Array.isArray(competition.ranked) || competition.ranked.length === 0) {
  console.error('competition.json has no "ranked" profiles; nothing to export');
  process.exit(1);
}

const exclude = (config.excludeProfiles ?? []).map((re) => new RegExp(re));
const keep = (profileId) => !exclude.some((re) => re.test(profileId));

// Run date: the competition file's own mtime, the closest thing the artifact
// carries to "when this sweep finished". Never invented.
const runDate = statSync(competitionPath).mtime.toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

const ranked = competition.ranked.filter((r) => keep(r.profileId));
const perTaskProfiles = (competition.perTaskProfiles ?? []).map((t) => ({
  ...t,
  profiles: (t.profiles ?? []).filter((p) => keep(p.profileId)),
}));

// n per profile = graded runs across the whole suite, summed from the per-task
// breakdown. Falls back to behavior.nRuns when the breakdown is absent.
const runsByProfile = new Map();
for (const t of perTaskProfiles) {
  for (const p of t.profiles) {
    runsByProfile.set(p.profileId, (runsByProfile.get(p.profileId) ?? 0) + (p.n ?? 0));
  }
}

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

const rows = ranked.map((r) => {
  const raw = r.harness === 'router';
  const row = {
    model: r.model,
    harness: r.harness,
    loop: raw ? 'single-shot' : 'harness-native',
    method: raw ? 'raw' : 'harness',
    score: r.passRate,
    n: runsByProfile.get(r.profileId) ?? r.behavior?.nRuns ?? 0,
    date: runDate,
  };
  const ci = r.passRateCi95;
  if (Array.isArray(ci) && finite(ci[0]) && finite(ci[1])) {
    row.ciLow = ci[0];
    row.ciHigh = ci[1];
  }
  return row;
});

const profiles = ranked.map((r) => ({
  profileId: r.profileId,
  harness: r.harness,
  model: r.model,
}));

// Opaque labels: config.taskLabels wins; any unlisted task gets the next
// unclaimed zero-padded number in file order, so config labels and generated
// labels never collide. Task identity (taskId) never reaches the output.
const claimed = new Set(
  Object.values(config.taskLabels ?? {}).map((e) => (typeof e === 'string' ? e : e.label)),
);
let nextAuto = 1;
const labelFor = (taskId) => {
  const entry = config.taskLabels?.[taskId];
  if (typeof entry === 'string') return { label: entry };
  if (entry && typeof entry === 'object') return { label: entry.label, difficulty: entry.difficulty };
  let label;
  do {
    label = String(nextAuto++).padStart(2, '0');
  } while (claimed.has(label));
  return { label };
};

const perTask = perTaskProfiles
  .map((t) => {
    const { label, difficulty } = labelFor(t.taskId);
    const byProfile = {};
    for (const p of t.profiles) {
      byProfile[p.profileId] = {
        passRate: p.passRate,
        n: p.n,
        ...(finite(p.meanCostUsd) ? { meanCostUsd: p.meanCostUsd } : {}),
        ...(finite(p.meanTokensIn) ? { meanTokensIn: p.meanTokensIn } : {}),
        ...(finite(p.meanTokensOut) ? { meanTokensOut: p.meanTokensOut } : {}),
        ...(finite(p.meanWallMs) ? { meanWallMs: p.meanWallMs } : {}),
      };
    }
    return { label, ...(difficulty ? { difficulty } : {}), byProfile };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const out = {
  id: config.id,
  title: config.title,
  source: config.source ?? 'VerticalBench (private task suite)',
  generated: today,
  rows,
  profiles,
  ...(perTask.length > 0 ? { perTask } : {}),
};

const outPath = outFlag
  ? resolve(outFlag)
  : join(dirname(fileURLToPath(import.meta.url)), '..', 'src/data/benchmarks/results', `${config.id}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

console.log(`wrote ${outPath}`);
console.log(`  profiles: ${profiles.length} (${profiles.map((p) => p.profileId).join(', ')})`);
console.log(`  tasks: ${perTask.length}, graded runs: ${[...runsByProfile.values()].reduce((a, b) => a + b, 0)}`);
console.log('next: add or confirm the board entry in src/data/benchmarks/index.ts importing this file');
