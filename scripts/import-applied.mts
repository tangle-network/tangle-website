// Imports the applied boards whose evaluator lives in another repository, each at a pinned commit.
// Each output file carries its source (repo, path, commit, sha256) and one board in the shape applied.ts reads.
//   GH=gh-drew node scripts/import-applied.mts            # all sources
//   node scripts/import-applied.mts tax-calc-bench         # one source
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GH = process.env.GH ?? "gh";
const OUT = new URL("../src/data/benchmarks/applied/", import.meta.url).pathname;

const raw = (repo: string, path: string, ref: string) =>
  execFileSync(GH, ["api", "-H", "Accept: application/vnd.github.raw", `repos/${repo}/contents/${path}?ref=${ref}`], { maxBuffer: 64e6 });

const tCritical20 = 2.086; // Student's t, 95%, 20 degrees of freedom: 21 clients.
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const TAX_MODELS: Record<string, string> = { "gpt-5.5": "GPT-5.5", "gpt-5.1": "GPT-5.1", opus: "Claude Opus", sonnet: "Claude Sonnet", haiku: "Claude Haiku" };

const SOURCES: Record<string, { repo: string; path: string; ref: string; reduce: (bytes: Buffer) => unknown }> = {
  // Column Tax's TaxCalcBench, every configuration that finished all 51 held-out returns, graded line by line by its own evaluator.
  "tax-calc-bench": {
    repo: "tangle-network/tangle-website", path: "src/data/benchmarks/results/tax.json", ref: "2c1c1b868b8f8e0707bf076663fe198bb18e8ea7",
    reduce: (bytes) => {
      const run = JSON.parse(bytes.toString("utf8")) as { generated: string; rows: { model: string; harness: string; score: number; ciLow: number; ciHigh: number; n: number; costUsd: number }[] };
      return {
        id: "tax", title: "Tax returns", measure: "Line accuracy", max: 1, percent: true, interval: "student-t", date: run.generated, by: "Column Tax's TaxCalcBench", url: "https://github.com/column-tax/tax-calc-bench", costTitle: "Cost per return",
        rows: run.rows.map((r) => ({ id: `${r.harness}-${r.model}`, model: TAX_MODELS[r.model], harness: r.harness, score: r.score, lower: r.ciLow, upper: r.ciHigh, samples: `${r.n} returns`, cost: r.costUsd })),
      };
    },
  },
  // The legal agent's persona matrix: 21 synthetic clients, two models, a deterministic six-dimension verifier, on the production Router.
  "legal-personas": {
    repo: "tangle-network/legal-agent", path: "tests/eval/.matrix-proof/legal-haiku-vs-sonnet.json", ref: "61f4676566f35d6b31540eae0c3f852778211ccc",
    reduce: (bytes) => {
      const run = JSON.parse(bytes.toString("utf8")) as { profiles: Record<string, { model: string; min: number; n: number }>; byPersona: Record<string, Record<string, number>> };
      return {
        id: "legal", title: "Legal work", measure: "Score out of 100", max: 100, percent: false, interval: "student-t", date: "2026-06-02", by: "the legal agent's eval", url: "https://github.com/tangle-network/legal-agent",
        rows: Object.entries(run.profiles).map(([id, p]) => {
          const scores = Object.values(run.byPersona).map((persona) => persona[id]!), m = mean(scores);
          const half = tCritical20 * Math.sqrt(scores.reduce((sum, x) => sum + (x - m) ** 2, 0) / (scores.length - 1) / scores.length);
          return { id, model: `Claude ${id[0]!.toUpperCase()}${id.slice(1)} 4.5`, harness: "legal-agent", score: Number(m.toFixed(2)), lower: Number((m - half).toFixed(2)), upper: Number(Math.min(100, m + half).toFixed(2)), samples: `${scores.length} clients`, detail: `lowest ${p.min}` };
        }),
      };
    },
  },
};

const wanted = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
for (const [id, s] of Object.entries(SOURCES)) {
  if (wanted.length && !wanted.includes(id)) continue;
  const bytes = raw(s.repo, s.path, s.ref);
  const out = { source: { repo: s.repo, path: s.path, commit: s.ref, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, importedAt: new Date().toISOString().slice(0, 10) }, record: s.reduce(bytes) };
  writeFileSync(join(OUT, `${id}.json`), JSON.stringify(out, null, 1) + "\n");
  console.log(`imported ${id}: ${bytes.length} bytes from ${s.repo}@${s.ref.slice(0, 12)} ${s.path}`);
}
