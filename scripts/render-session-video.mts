// Films the home page's recorded session (src/components/PairSession.astro) into two videos: 1920x1080 and
// 1080x1920 H.264, silent. The claim sits over the replay from its first frame, a caption names what the screen shows as
// it appears, the recorded clock runs in a corner and says "fast-forward" while the replay squeezes a stretch in which
// nothing appeared, and an end card carries the one URL. Playwright owns the page clock, so frame n always shows the
// replay at n/30 s; Chromium's screenshots go straight into ffmpeg. Film the served site, or `astro dev` while authoring.
//
//   node scripts/render-session-video.mts <out-dir> [site, default https://tangle.tools]
//   needs ffmpeg on PATH and Chromium: cd scripts/examples-typecheck && npm ci && npx playwright install chromium
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { knotSvg } from "@tangle-network/brand/knot";
import { clock } from "../src/utils/date.ts";

const ROOT = resolve(import.meta.dirname, "..");
const [out = join(ROOT, "dist/videos"), site = "https://tangle.tools"] = process.argv.slice(2);
const { chromium } = createRequire(join(ROOT, "scripts/examples-typecheck/package.json"))("playwright"); // the examples harness owns the version

// The live page holds LIVE_S; from POINTER_S into it a pointer sweeps across the page, which scatters what it built.
const FPS = 30, CLAIM_S = 2.6, HOLD_S = 1.6, LIVE_S = 13.5, POINTER_S = 10.5, CARD_S = 3, FADE_S = 0.4;
const CLAIM = "Ask for an app. Get a live URL.";
const URL_SHOWN = "docs.tangle.tools<wbr>/sandbox/cloud-agents";
// The caption for what the replay shows, latest first; each one holds at least HOLD_S before the next replaces it.
type Shown = { commands: number; files: number; open: boolean; at: number };
const CAPTIONS: [(s: Shown) => boolean, string][] = [
  [(s) => s.open, "Live at its own URL"],
  [(s) => s.commands >= 3, "One command puts it online"],
  [(s) => s.files > 0, "Every file, as the agent writes it"],
  [(s) => s.commands >= 2, "Ask a coding agent for an app"],
  [() => true, "One command, one sandbox"],
];
const FORMATS = [
  { file: "pair-16x9", viewport: { width: 1280, height: 720 }, scale: 1.5, tall: false },
  { file: "pair-9x16", viewport: { width: 540, height: 960 }, scale: 2, tall: true },
];

// The session's window alone, and the film's own layer: caption, clock and end card, in Brand's tokens.
const css = (tall: boolean) => `
  body > :not(main):not(#film), main > :not(.pair) { display: none !important; }
  .pair { height: 100vh !important; min-height: 0 !important; padding: ${tall ? "214px 0 112px" : "28px 0 112px"} !important; }
  .pair-inner { width: auto !important; height: auto !important; max-height: none !important; margin: 0 ${tall ? 18 : 40}px !important; }
  .pair-heading, .pr .qs-install, .pr > .rr-bar, .pr-meta { display: none !important; }
  #film { position: fixed; inset: 0; z-index: 50; pointer-events: none; font-family: var(--font-sans); color: var(--text-primary); }
  #film-caption { position: absolute; display: flex; align-items: center; gap: 16px; ${tall
    ? "left: 24px; right: 24px; top: 104px; height: 96px; justify-content: center; text-align: center; font-size: 27px;"
    : "left: 40px; right: 260px; bottom: 26px; height: 60px; font-size: 30px;"} font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; text-wrap: balance; }
  #film-caption[data-claim] { font-family: var(--font-display); font-size: ${tall ? 32 : 38}px; letter-spacing: -0.03em; }
  #film-caption svg { flex: none; width: ${tall ? 40 : 46}px; height: auto; }
  #film-caption:not([data-claim]) svg { display: none; }
  #film-clock { position: absolute; display: flex; gap: 10px; align-items: center; ${tall ? "right: 22px; top: 186px;" : "right: 40px; bottom: 44px;"}
    font: 500 ${tall ? 13 : 15}px/1 var(--font-mono); color: var(--text-muted); font-variant-numeric: tabular-nums; }
  #film-clock b { font-weight: 500; color: var(--brand-glow); }
  #film-pointer { position: absolute; left: 0; top: 0; width: ${tall ? 22 : 26}px; display: none; filter: drop-shadow(0 2px 4px rgb(0 0 0 / 50%)); }
  #film-card { position: absolute; inset: 0; overflow: hidden; opacity: 0; background: var(--depth-1); display: flex; align-items: center;
    ${tall ? "justify-content: center; text-align: center;" : "padding-left: 120px;"} }
  #film-card svg { position: absolute; width: ${tall ? 760 : 820}px; height: auto; ${tall ? "left: -40px; bottom: -330px;" : "right: -300px; top: -120px;"} opacity: 0.9; }
  #film-card p { position: relative; max-width: ${tall ? 440 : 640}px; margin: 0; font: 600 ${tall ? 34 : 48}px/1.15 var(--font-display); letter-spacing: -0.03em; ${tall ? "margin-top: -260px;" : ""} }
`;

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const format of FORMATS) {
  const context = await browser.newContext({ viewport: format.viewport, deviceScaleFactor: format.scale, colorScheme: "dark", reducedMotion: "no-preference" });
  await context.route(/googletagmanager|google-analytics/, (route: { abort(): Promise<void> }) => route.abort());
  const start = Date.now(); // paused: time moves only when a frame advances it
  await context.clock.install({ time: start });
  await context.clock.pauseAt(start + 1000);
  const page = await context.newPage();
  await page.goto(site);
  await page.addStyleTag({ content: css(format.tall) }); // the session fills the screen, so it hydrates and starts
  await page.locator(".pr-cmd").first().waitFor();
  await page.waitForLoadState("networkidle"); // the record and the editor's grammars
  await page.evaluate(([mark, knot, claim, url]: string[]) => {
    const film = Object.assign(document.createElement("div"), { id: "film" });
    film.innerHTML = `<div id="film-caption" data-claim>${mark}<span>${claim}</span></div><div id="film-clock"></div><svg id="film-pointer" viewBox="0 0 16 22"><path d="M1 1v17l4.5-4.2 3 6.7 3-1.4-3-6.6H15z" fill="white" stroke="black" stroke-width="1.2" stroke-linejoin="round"/></svg><div id="film-card">${knot}<p>${url}</p></div>`;
    document.body.append(film);
  }, [knotSvg({ id: "film-mark" }), knotSvg({ id: "film-card" }), CLAIM, URL_SHOWN]);

  const target = join(out, `${format.file}.mp4`);
  const ffmpeg = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", target], { stdio: ["pipe", "inherit", "inherit"] });
  const flush = () => page.evaluate(() => new Promise<void>((done) => { const channel = new MessageChannel(); channel.port1.onmessage = () => done(); channel.port2.postMessage(0); }));
  let caption = CLAIM, since = 0, lastAt = 0, fastUntil = -1, opened: number | undefined, end = Infinity;
  for (let frame = 0; frame < end; frame++) {
    if (frame) await page.clock.runFor(Math.round((frame * 1000) / FPS) - Math.round(((frame - 1) * 1000) / FPS));
    await flush(); // React renders on a message, which the page clock does not hold back
    const shown: Shown = await page.evaluate(() => ({
      commands: document.querySelectorAll(".pr-cmd").length,
      files: document.querySelectorAll(".pr-tabs [role=tab]").length,
      open: !!document.querySelector(".pr-browser"),
      at: Number(document.querySelector(".pr")?.getAttribute("data-at") ?? 0),
    }));
    if (shown.open && opened === undefined) { opened = frame; end = frame + Math.round((LIVE_S + CARD_S) * FPS); }
    if (frame > 180 * FPS) throw new Error("the replay never opened the page it served");
    const next = frame < CLAIM_S * FPS ? CLAIM : CAPTIONS.find(([when]) => when(shown))![1];
    if (next !== caption && frame - since >= HOLD_S * FPS) { caption = next; since = frame; }
    if (shown.at - lastAt > 3000 / FPS) fastUntil = frame + FPS;
    lastAt = shown.at;
    const card = opened === undefined ? 0 : Math.min(1, Math.max(0, (frame - opened - LIVE_S * FPS) / (FADE_S * FPS)));
    // The pointer crosses the middle of the live page, left to right, the way a visitor would try it.
    const sweep = opened === undefined ? -1 : (frame - opened - POINTER_S * FPS) / ((LIVE_S - POINTER_S) * FPS);
    const box = sweep >= 0 && sweep <= 1 ? await page.locator(".pr-browser iframe").boundingBox() : null;
    const pointer = box && { x: box.x + box.width * (0.12 + 0.76 * sweep), y: box.y + box.height * (0.5 + 0.12 * Math.sin(sweep * Math.PI * 2)) };
    if (pointer) await page.mouse.move(pointer.x, pointer.y);
    await page.evaluate(([text, claim, clock, card, at]: [string, boolean, string, number, { x: number; y: number } | null]) => {
      const box = document.getElementById("film-caption")!, arrow = document.getElementById("film-pointer")!;
      box.toggleAttribute("data-claim", claim);
      box.querySelector("span")!.textContent = text;
      document.getElementById("film-clock")!.innerHTML = clock;
      document.getElementById("film-card")!.style.opacity = String(card);
      arrow.style.display = at ? "block" : "none";
      if (at) arrow.style.translate = `${at.x}px ${at.y}px`;
    }, [caption, caption === CLAIM, `${frame <= fastUntil ? "<b>fast-forward</b>" : ""}<span>${clock(shown.at)} recorded</span>`, card, pointer]);
    const png = await page.screenshot({ animations: "disabled" });
    if (opened !== undefined && frame === opened + Math.round((POINTER_S - 0.3) * FPS)) writeFileSync(join(out, `${format.file}.png`), png);
    if (!ffmpeg.stdin.write(png)) await once(ffmpeg.stdin, "drain");
  }
  ffmpeg.stdin.end();
  const [code] = await once(ffmpeg, "close");
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${target}`);
  console.log(`${target}: ${(end / FPS).toFixed(1)} s, ${format.viewport.width * format.scale}x${format.viewport.height * format.scale}, ${(statSync(target).size / 1e6).toFixed(1)} MB`);
  await context.close();
}
await browser.close();
