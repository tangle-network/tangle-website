// Pull the newest production sandbox benchmarks into src/data/benchmarks/sandbox.json.
//
// Source of every Tangle number: the sandbox facts feed, https://facts.tangle.tools/sandbox.json, which the
// production benchmark workflow publishes after each run (agent-container tools/sandbox-facts). Source of
// the public comparison: ComputeSDK's burst time-to-interactive board, which measures providers with the
// same 100-at-once method the Tangle `create.burst_matched` lane runs.
//
// The feed is 15 MB; the page needs a few hundred rows. Keep only what /benchmarks prints, with its run id,
// served SHA, date, n and failed-row count, so the page can say what each number is and when it was measured.
import { writeFileSync } from 'node:fs';

const FACTS_URL = 'https://facts.tangle.tools/sandbox.json';
const COMPUTESDK_URL = 'https://raw.githubusercontent.com/computesdk/benchmarks/master/results/burst_tti/latest.json';
const OUT = new URL('../src/data/benchmarks/sandbox.json', import.meta.url);

// The lanes /benchmarks reads. A lane missing from the feed is an error: the page must not go quiet.
const LANES = ['create-matrix', 'first-text', 'lifecycle-waterfall', 'branch-fanout', 'snapshot-fork', 'first-call', 'create-burst', 'create-burst-100', 'quality'];

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

const facts = await fetchJson(FACTS_URL);
const round = (n) => (typeof n === 'number' ? Math.round(n) : null);
const lanes = {};
for (const name of LANES) {
  const lane = facts.lanes[name];
  if (!lane) throw new Error(`facts feed has no lane ${name}`);
  lanes[name] = {
    run_id: lane.run.id,
    started_at: lane.run.started_at,
    published_at: lane.run.published_at,
    served_sha: lane.run.served_sha,
    records: lane.records,
    failed_checks: lane.failed_checks.map((c) => ({ name: c.name, rows: c.rows })),
    verbs: lane.verbs.map((v) => ({
      journey: v.journey, profile: v.profile ?? null, field: v.field, description: v.description,
      n: v.n, p50_ms: round(v.p50_ms), p95_ms: round(v.p95_ms), failed_rows: v.failed_rows ?? 0,
    })),
    first_text: lane.first_text.map((f) => ({ harness: f.harness, n: f.n, p50_ms: round(f.p50_ms), p95_ms: round(f.p95_ms) })),
    burst: lane.burst.map((b) => ({ size: b.size, asked: b.asked, ok: b.ok, p50_ms: round(b.p50_ms), p90_ms: round(b.p90_ms) })),
  };
}

const board = await fetchJson(COMPUTESDK_URL);
const computesdk = {
  source: 'https://www.computesdk.com/benchmarks',
  data: COMPUTESDK_URL,
  timestamp: board.timestamp,
  iterations: board.config.iterations,
  rows: board.results
    .filter((r) => r.summary?.ttiMs?.median > 0)
    .map((r) => ({ provider: r.provider, median_ms: round(r.summary.ttiMs.median), p95_ms: round(r.summary.ttiMs.p95), success_rate: r.successRate }))
    .sort((a, b) => a.median_ms - b.median_ms),
};

const rateCard = facts.rate_card.find((r) => r.route === "/v1/pricing/sandboxes");
if (rateCard?.status !== 200) throw new Error("facts feed carries no sandbox rate card");

const out = {
  rate_card: { ...rateCard.body.pools.general, source: rateCard.url, fetched_at: rateCard.fetched_at },
  source: FACTS_URL,
  pulled_at: new Date().toISOString(),
  published_at: facts.published_at,
  cohort: facts.source,
  percentiles: facts.percentiles,
  lanes,
  computesdk,
};
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${OUT.pathname}: ${Object.keys(lanes).length} lanes, ${computesdk.rows.length} ComputeSDK providers, feed published ${facts.published_at}`);
