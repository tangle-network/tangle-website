# Live homepage speed baseline

The [compressed raw baseline](./live-baseline-2026-09-24.json.gz) measures the served homepage at `https://www.tangle.tools/`.
The run started at 2026-09-24 04:18 UTC and finished at 04:23 UTC.
The live [`version.json`](https://www.tangle.tools/version.json) returned revision `3d4abedee85de090ea96d4a050647635d3b97f78` after the run.
Every measured visit requested the same hashed homepage script, `index.astro_astro_type_script_index_0_lang.B-yxQwbU.js`.

## Fixture and gate

Chromium 151.0.7922.34 ran through Playwright 1.62.1 on Linux 7.0.0-34-generic with an AMD Ryzen AI MAX+ 395 host.
Desktop used 1440×900 at DPR 1, 10 Mbps download, 40 ms network latency, and CPU rate 1×.
Mobile used 390×844 at DPR 3, 1.6 Mbps download, 150 ms network latency, and CPU rate 4×.
The browser blocked service workers and kept reduced motion off.
Each cold visit used a new context with an empty HTTP cache.
Each warm visit used a new context, primed that context with one homepage visit, visited `about:blank`, and measured the next homepage visit.
The host's DNS, TLS, and operating system caches were not cleared.

There were nine measured visits per fixture.
The p75 is the seventh sorted value, using nearest rank.
FCP is the browser's first contentful paint.
The hero usability proxy is the later of FCP and the first painted frame with a visible hero heading and a hit-testable primary action.
The script observes requests, transferred bytes, and layout shifts through `load` plus two seconds.
It tests that the page has content, no horizontal overflow, and a working mobile menu.
The separate [desktop and mobile screenshots and WebM videos](./recordings-2026-09-24/) were captured after measurement.

| Fixture | FCP p75 | Hero usable p75 | Round 1 FCP / usable maximum | Round 2 FCP / usable maximum |
|---|---:|---:|---:|---:|
| Desktop cold | 352 ms | 352 ms | 293.33 / 293.33 ms | 176 / 176 ms |
| Desktop warm | 460 ms | 460 ms | 383.33 / 383.33 ms | 230 / 230 ms |
| Mobile cold | 1,080 ms | 1,087.3 ms | 900 / 906.08 ms | 540 / 543.65 ms |
| Mobile warm | 248 ms | 268 ms | 206.67 / 223.33 ms | 124 / 134 ms |

Displayed thresholds are rounded.
The comparator uses exact `baseline / 1.2` in round one and `baseline / 2` in round two for **both** paint and usable time in **every** fixture.
Run a candidate against the same fixture with:

```bash
node scripts/benchmark-homepage.mjs --url http://127.0.0.1:4321/ --pairs 9 --output /tmp/home-candidate.json --compare .github/pr-assets/home-speed/live-baseline-2026-09-24.json.gz --round 1
```

Use `--round 2` for the second speed target.
The candidate URL can be a preview deployment instead of a local server.
The candidate must use the same browser, host, fixture, and sample count for a meaningful paired comparison.

## Resource and behavior evidence

Cold visits had 31 requests and about 1.22 MB of encoded network traffic at p75.
About 320 KB of that traffic was JavaScript.
The first desktop cold visit sent 24 requests to `www.tangle.tools` for 953 KB, one Google Tag Manager script request for 176 KB, two Google font requests for 80 KB, and one Cloudflare Insights request for 10 KB.
The largest own asset was the navigation logo PNG at about 540 KB.
The homepage script was about 133 KB, and the hero poster was about 65 KB.
Warm visits still issued about 30 requests, but the browser cache supplied JavaScript without a network transfer.

Mobile cold LCP was 4,156 ms at p75, well after first paint.
In a representative visit, the HTML response started at 266 ms, first paint occurred at 1,080 ms, the homepage script finished around 4,109 ms, and the large logo finished around 6,606 ms.
The `load` event ended at 6,608 ms.
A separate one-pair attribution identified the mobile LCP element as `img.hero-poster` at 4,112 ms.
This suggests main-thread or render delay after the poster transfer; the attribution is a hypothesis until a candidate isolates the cause.
Desktop warm FCP varied from 112 to 628 ms and had a higher p75 than desktop cold, despite cached assets.
Three warm desktop visits had FCP of at least 460 ms after DOMContentLoaded had ended by 202 ms.
Keep that variance visible when comparing candidates.

All 36 measured visits returned HTTP 200, rendered at least five section headings, had no horizontal overflow, and passed the mobile menu open/close check where applicable.
There were no HTTP 4xx/5xx resource responses or console errors.
There were 54 third-party request failures: 36 Google Tag Manager `ERR_BLOCKED_BY_ORB` and 18 aborted Google Analytics collection requests.
The raw JSON retains every sample, response, and failure.

## Limits

This is a synthetic browser p75 against production, not field p75 from actual visitors or a device mix.
The hero usability proxy proves a visible, clickable entry action; it does not measure the full page's interaction latency or INP.
Compare the proxy with device-split field first paint and interaction data before treating it as a field-speed claim.
The build receipt was checked after the run; the stable hashed script across samples supports one served build, but the exact build was not queried during each visit.
Video capture ran after the measured set, so recording overhead did not affect the p75 values.

## Candidate and regression gate

The speed branch keeps the deployed homepage unchanged when `PUBLIC_HOME_SPEED_PERCENT=0`.
Fast mode keeps the hero poster and skips the Three.js/WebGL request and render chain.
It also uses a small SVG navigation mark and loads product-card art only when the cards approach view.
The control and fast paths retain the same content, links, and scroll sections.

The five sequential CI cases cover desktop and mobile fast mode, mobile reduced motion, and desktop and mobile control mode.
They pin the original headings and primary action, check the menu and visible action, and confirm that desktop control still renders WebGL.
They also require the local FCP telemetry event to contain the mode, build, device group, and numeric paint value.
The gate counts own and mocked external requests, uncompressed built JS bytes, and browser layout shift.
It rejects budgets raised above the prior base revision.

| Local build path | Total / own requests | Built JS bytes | CLS |
|---|---:|---:|---:|
| Fast, desktop and mobile | 22 / 20 | 13,019 | 0 |
| Control, desktop and mobile | 23 / 21 | 546,233 | 0 |

The current fast budgets are at most 22 total requests, 20 own requests, 13,500 built JS bytes, and 0.01 CLS per device.
These local counters are deterministic proxies, not the encoded bytes or paint times measured on the production CDN.
The optimization also removed an exact duplicate 252-line CSS block; the surviving rules are unchanged except for lazy card images.

## Local comparison, not a release result

The [local control](./local-control-2026-09-24.json.gz) and [local fast](./local-fast-2026-09-24.json.gz) runs used the same uncompressed Python static server and nine visits per fixture.
All 36 control visits were valid.
The fast run had 34 valid visits; desktop cold visits 2 and 6 timed out waiting for `load` after the document returned 200 and the stylesheet transfer stalled.
The raw files retain both invalid visits and every request.
The [candidate recordings](./recordings-candidate-local-2026-09-24/) were captured after the measured visits.

| Local fixture | Control FCP / usable p75 | Fast FCP / usable p75 |
|---|---:|---:|
| Desktop cold | 336 / 381.4 ms | 496 / 496 ms, 7 valid |
| Desktop warm | 44 / 83.5 ms | 60 / 60 ms |
| Mobile cold | 1,852 / 1,981.5 ms | 1,840 / 2,024.9 ms |
| Mobile warm | 120 / 125.9 ms | 140 / 147.4 ms |

The fast path did not meet the round-one p75 target on this local server.
The two invalid visits also prevent a complete desktop cold comparison.
The production baseline used Cloudflare's served path with compression and had very different warm timings, so this local run cannot establish the deployed speed result.

The next speed proof is a nine-sample run per desktop/mobile cold/warm fixture on a preview deployment.
Use the same browser, host vantage, throttling, and correctness checks as this baseline.
Keep every fixture at or below the round-one paint and usable thresholds above before considering production promotion.
The cofounder owns the internal, 1%, and full rollout decision.
The deployment variable `HOME_SPEED_PERCENT` selects 0, 1, or 100 and can be set back to 0 before a redeploy.
The page emits FCP, LCP, CLS, and INP through the existing analytics path with build, mode, and viewport group.
Compare those field distributions with control by build and device, including sample counts, before claiming a user-visible win.
Field device split, first paint, and interaction data are not yet available.
After field proof, remove the flag and keep the ratchet and frozen content checks.
