// Imports the applied-benchmark records that /benchmarks/applied prints, from the repository that
// owns each one, at a pinned commit. Each output file carries the source (repo, path, commit, sha256)
// and a reduced record; every number on the page is computed from these files at build time.
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

interface TaxRun { runId: string; model: string; commitSha: string; wallMs: number; tokenUsage: { input: number; output: number; cached: number };
  scenarioId: string; outcome: { raw: { by_line: number; lenient_by_line: number; strict: boolean; lenient: boolean; turns: number; tool_calls: number } } }

const SOURCES: Record<string, { repo: string; path: string; ref: string; reduce: (bytes: Buffer) => unknown }> = {
  // Column Tax's TaxCalcBench, run by the production tax agent and scored by the benchmark's own evaluator.
  "tax-calc-bench": {
    repo: "tangle-network/tax-agent", path: "docs/research/taxcalcbench/data/ty24-full51-results.jsonl", ref: "c20ceb4d1168f864951ea37048aefcf06c7ce640",
    reduce: (bytes) => ({
      benchmark: { name: "TaxCalcBench TY2024", url: "https://github.com/column-tax/tax-calc-bench", cases: 51, protocol: "single turn, no tools; scored line by line on the lines that move tax owed or refund" },
      // Column Tax's published single-shot results, best thinking budget per model, as cited in the tax agent's write-up
      // (docs/research/taxcalcbench/PAPER.md). Percentages are from their README on the date of that write-up.
      published: [
        { model: "Gemini 2.5 Pro", strict: 0.3235, lenient: 0.5196, byLine: 0.8122, lenientByLine: 0.8612 },
        { model: "Claude Opus 4", strict: 0.2745, lenient: 0.4265, byLine: 0.783, lenientByLine: 0.8235 },
        { model: "Gemini 2.5 Flash", strict: 0.2598, lenient: 0.4118, byLine: 0.7794, lenientByLine: 0.8166 },
        { model: "Claude Sonnet 4", strict: 0.2304, lenient: 0.3824, byLine: 0.774, lenientByLine: 0.8142 },
      ],
      writeup: "https://github.com/tangle-network/tax-agent/blob/c20ceb4d1168f864951ea37048aefcf06c7ce640/docs/research/taxcalcbench/PAPER.md",
      runs: bytes.toString("utf8").trim().split("\n").map((line) => JSON.parse(line) as TaxRun).map((r) => ({
        runId: r.runId, scenarioId: r.scenarioId, model: r.model, commitSha: r.commitSha, wallMs: r.wallMs, tokens: r.tokenUsage,
        strict: r.outcome.raw.strict, lenient: r.outcome.raw.lenient, byLine: r.outcome.raw.by_line, lenientByLine: r.outcome.raw.lenient_by_line,
        turns: r.outcome.raw.turns, toolCalls: r.outcome.raw.tool_calls,
      })),
    }),
  },
  // The legal agent's persona matrix: 21 synthetic client personas, two models, a deterministic six-dimension verifier, on the production Router.
  "legal-personas": {
    repo: "tangle-network/legal-agent", path: "tests/eval/.matrix-proof/legal-haiku-vs-sonnet.json", ref: "61f4676566f35d6b31540eae0c3f852778211ccc",
    reduce: (bytes) => JSON.parse(bytes.toString("utf8")),
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
