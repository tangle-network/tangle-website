# Benchmark boards

`/benchmarks/applied` draws one chart per board: agent profiles (model and harness) across, score up, a 95% interval on each.
A new file is a new chart. No page code changes.

Add a board one of two ways:

1. **A task suite we run.** Run it through VerticalBench in tangle-network/blueprint-agent: `vb-define` builds the suite, `run-vertical-matrix` runs the profiles, `app-grade/grade-campaign` grades them, then `vb-publish --run results/<campaign> --board <this directory>` writes `<suite>.json` here. It writes a record only when the publication decision allows the campaign, and the build rechecks the record's digest, cells and totals (`../board-record.ts`). Never edit one by hand.
2. **An evaluator another repository owns.** Add a source to `scripts/import-applied.mts` that reduces its results to the `AppliedBoard` shape in `../applied.ts`, then run `GH=gh-drew pnpm import:applied`. The file lands in `../applied/`, pinned to a commit.

A board goes up only when every cell it shows ran to completion with a valid grade and no harness failure. Nothing partial: Drew's standard, recorded on tangle-network/blueprint-agent#2428.
