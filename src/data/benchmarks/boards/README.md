# Benchmark boards

Each `<suite>.json` here is a board record for one suite.
The benchmark runner writes it with `vb-publish --run <campaign> --board <this directory>` (tangle-network/blueprint-agent).
It writes a record only when the publication decision allows the campaign.

Do not edit a record by hand.
The build recomputes each record's digest and checks its cells, totals and comparisons (`../board-record.ts`).
A record that fails a check stops the build.
