# /benchmarks on @tangle-network/charts, 2026-09-27

Screenshots taken on drew-gtr-pro with Playwright and Chrome, full page, at 1440 and 390 px wide.
Light sets `data-theme="light"` in the browser to check the chart tokens.
The site ships dark only, and its header and footer are dark-only components.

| Files | What they show |
|---|---|
| `before-index-*` | https://tangle.tools/benchmarks/ as served before this change |
| `after-index-*` | The rebuilt index from this branch: the empty state, the four checks and how to check a board |
| `preview-unpublished-*` | The local preview route rendering real campaign `board-meilisearch-20260927T110341Z`, which the publisher refused. It is not a board and never renders on tangle.tools |
| `label-wrap-before.png`, `label-wrap-after.png` | The ranked-rates label column before and after tangle-network/brand's label-wrap fix |

The preview input was built from that campaign's `publication-plan.json`, `cell-results.json` and decision log.
Task ids are replaced by their registered labels T01 to T13, as a board does.
App Grade did not grade the campaign, so a pass in the preview is the runner's own verification.
