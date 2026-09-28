# Benchmark page browser proof

Source: `tangle-website` branch `fix/benchmarks-interval-level`, based on `3fdea67`.
The local Astro build ran on `drew-GTR-Pro` and was served at `127.0.0.1:4180`.

The browser journey uses the **synthetic Admission fixture** from `scripts/fixtures/benchmark-board.json`.
For this local check, its first interval level was set to 90% and its digest was recomputed.
The fixture board file was removed after the build and is not published.

At 390 px, the journey starts on `/benchmarks/`, shows the pass rate and interval, opens the board link with Enter, opens a data disclosure with Enter, reads Method, and returns to the index.
The uncut recording is [mobile-flow-1x.webm](mobile-flow-1x.webm) (6.92 seconds).
The [mobile-flow-2x.mp4](mobile-flow-2x.mp4) copy runs the same journey at 2× speed (3.56 seconds).

[Mobile before](mobile-before-synthetic.png) shows the rate beyond the right edge of the table.
[Mobile after](mobile-after-synthetic.png) shows the rate and interval in the visible board list.
[Desktop after](desktop-after-synthetic.png) shows the table retained at 1440 px.

[Production empty state](production-empty-mobile.png) came from `https://tangle.tools/benchmarks/` at served revision `3fdea67`.
It returned HTTP 200 with no table or chart because no board is published.

Browser checks covered 1440 and 390 px, dark and forced light chart tokens, keyboard focus, Back and Forward, and an unknown suite returning 404.
All four viewport and theme runs had zero page errors and no page-level horizontal overflow.
The website has no public light theme switch, so forced-light captures only test benchmark content tokens.

The separate unpublished Meilisearch preview was checked against all 52 source attempts in local scratch.
Its 26 task cells and both profile totals matched; no run data from that campaign is included here.
