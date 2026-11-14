// Exercises the built page or the served website; Playwright is owned by examples-typecheck.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const { chromium, webkit } = createRequire(new URL('./examples-typecheck/package.json', import.meta.url))('playwright');
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const out = process.env.EDITOR_EVIDENCE_DIR ?? await fs.mkdtemp(join(tmpdir(), 'tangle-editor-'));
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4321').origin;
await fs.mkdir(out, { recursive: true });
let ready = false;
for (let attempt = 0; attempt < 100; attempt++) {
  try { ready = (await fetch(`${base}/version.json`)).ok; } catch {}
  if (ready) break;
  await wait(100);
}
assert.ok(ready, `Preview unavailable at ${base}`);
if (process.env.TANGLE_BUILD_REVISION) {
  // Cloudflare serves the previous deploy for up to a minute after the upload returns.
  let version;
  for (let attempt = 0; attempt < 30; attempt++) {
    version = await (await fetch(`${base}/version.json?revision=${process.env.TANGLE_BUILD_REVISION}&attempt=${attempt}`)).json();
    if (version.revision === process.env.TANGLE_BUILD_REVISION) break;
    await wait(5000);
  }
  assert.equal(version.revision, process.env.TANGLE_BUILD_REVISION);
}
const read = async key => JSON.parse(await fs.readFile(`${ROOT}src/data/runs/${key}.json`, 'utf8'));
const source = await fs.readFile(join(ROOT, 'src/examples/sandboxes/fix-a-test.mts'), 'utf8');
const record = await read('sandboxes/fix-a-test'), patch = record.events.find(event => event.result?.stdout?.startsWith('diff --git ')).result.stdout;
const report = { cases: [], failures: [], quality: 'UNREVIEWED: render inspection is separate from functional checks' };
const check = (ok, message, item) => { if (!ok) report.failures.push({ case: item.name, message }); };
const normalized = text => text.replace(/`+|\*\*/g, '').replace(/^\s*[-*]\s+/gm, '').replace(/\s+/g, ' ').trim();
for (const [name, engine, width, height] of [['desktop', chromium, 1440, 900], ['phone', chromium, 390, 844], ['narrow', chromium, 320, 740], ['webkit-phone', webkit, 390, 844]]) {
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true,
    ...(width <= 680 ? { isMobile: true, hasTouch: true } : {}),
    ...(engine === chromium ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}),
    ...(name === 'phone' ? { recordVideo: { dir: `${out}/video`, size: { width, height } } } : {}) });
  await context.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [], requestFailures = [], item = { name, width, height, errors, requestFailures, errorDetails: [] };
  report.cases.push(item);
  page.on('pageerror', error => { errors.push(String(error)); item.errorDetails.push({ message: String(error), stack: error.stack, at: Date.now() }); });
  page.on('requestfailed', request => requestFailures.push({ url: request.url(), method: request.method(), type: request.resourceType(), error: request.failure()?.errorText, at: Date.now() }));
  try {
    await page.goto(`${base}/#quickstart-title`, { waitUntil: 'domcontentloaded' });
    const editor = page.locator('.qs-editor'), main = editor.locator('.qs-main'), output = editor.locator('.qs-result');
    const press = label => editor.getByRole('button', { name: label, exact: true });
    await editor.waitFor();
    await editor.scrollIntoViewIfNeeded();
    check(await editor.locator('select,[role=combobox]').count() === 0, 'No dropdowns in editor', item);
    item.initial = await editor.evaluate(root => ({ overflow: document.documentElement.scrollWidth - innerWidth, codeSize: getComputedStyle(root.querySelector('.qs-code code')).fontSize }));
    check(item.initial.overflow <= 1, 'The editor must not widen the page', item);
    if (width <= 680) check(item.initial.codeSize === '12px', 'Phone code size', item);
    // The run starts when the editor is on screen: the running line is marked and the machine pane fills.
    await editor.locator('.qs-main[data-state="running"] .qs-band[data-on]').waitFor();
    await editor.locator('.qs-feed [data-timeline-step]').first().waitFor();
    if (name === 'desktop') {
      await editor.getByRole('button', { name: 'Any cloud', exact: true }).click();
      await editor.locator('.qs-file').filter({ hasText: 'runtime/any-cloud.mts' }).waitFor();
      check(await editor.locator('.qs-rows:not([inert])').count() === 1, 'One subject is open at a time', item);
      await editor.getByRole('button', { name: 'Sandboxes', exact: true }).click();
      await editor.locator('.qs-file').filter({ hasText: 'run-code.mts' }).waitFor();
      await editor.getByRole('button', { name: 'Run a command', exact: true }).press('ArrowDown');
      await editor.locator('.qs-file').filter({ hasText: 'python-csv.mts' }).waitFor();
      await editor.getByRole('button', { name: 'Fix a failing test', exact: true }).click();
      await editor.locator('.qs-file').filter({ hasText: 'fix-a-test.mts' }).waitFor();
    }
    if (width <= 680) await press('Pause').tap(); else await press('Pause').click();
    const paused = await editor.locator('.qs-clock').innerText();
    await page.waitForTimeout(600);
    check(await editor.locator('.qs-clock').innerText() === paused && await main.getAttribute('data-state') === 'idle', 'Pause must stop the clock', item);
    await page.screenshot({ path: `${out}/${name}-paused.png` });
    await press('Run').press('Space');
    await output.getByText('9 tests passed', { exact: true }).waitFor({ timeout: 45000 });
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    check(await editor.locator('.qs-ret').count() === 5 && (await editor.locator('.qs-clock').innerText()).includes('$'), 'A finished run shows what each call returned and what the run cost', item);
    check(!/inputTokens|outputTokens|npm notice/.test(await output.innerText()), 'No accounting dumps or stderr notices in output', item);
    await page.screenshot({ path: `${out}/${name}-result.png` });
    const download = await Promise.all([page.waitForEvent('download'), output.getByRole('link', { name: 'Download patch', exact: true }).click()]).then(([value]) => value);
    const downloaded = await fs.readFile(await download.path(), 'utf8');
    check(downloaded === patch, 'Full exact three-file patch preserved', item);
    item.patchSha256 = createHash('sha256').update(downloaded).digest('hex');
    check((await output.locator('.qs-diff [data-line="file"]').count()) === 3, 'The result shows every changed file', item);
    if (engine === chromium) {
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copy to clipboard', exact: true }).click();
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copied', exact: true }).waitFor();
      check(await page.evaluate(() => navigator.clipboard.readText()) === source, 'Copy must preserve full runnable source', item);
    }
    check((await editor.locator('.qs-feed').innerText()).includes('Find the cause and fix it.') && await editor.locator('.qs-feed [data-timeline-step="tool"]').count() >= 10, 'The transcript shows the prompt and each step the agent took', item);
    await editor.getByRole('slider', { name: 'Run position' }).press('Home');
    check(await main.getAttribute('data-state') !== 'ended' && !(await editor.locator('.qs-clock').innerText()).includes('$'), 'Moving the run position moves the run', item);
    await editor.getByRole('slider', { name: 'Run position' }).press('End');
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    await press('Run again').click();
    await editor.locator('.qs-main[data-state="running"]').waitFor();
    check(/^0:0\d/.test(await editor.locator('.qs-clock').innerText()), 'Run again must restart', item);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await editor.getByText('9 tests passed', { exact: true }).waitFor();
    check(await press('Pause').count() === 0, 'Reduced motion must finish without autoplay', item);
    const load = async key => { await page.goto(`${base}/?example=${key}#quickstart-title`); await editor.locator('.qs-file').filter({ hasText: `${key.split('/').at(-1)}.mts` }).waitFor(); await editor.scrollIntoViewIfNeeded(); };
    if (name === 'desktop') {
      await load('sandboxes/run-code');
      const commandRecord = await read('sandboxes/run-code');
      const commandOutput = commandRecord.events.find(event => event.result?.stdout?.includes('Linux')).result.stdout.trim();
      await editor.locator('.qs-feed').getByText(commandOutput, { exact: false }).waitFor();
      check((await editor.locator('.qs-feed').innerText()).split(commandOutput).length - 1 === 1, 'Command output must appear once', item);
      await load('sandboxes/worker');
      const workerRecord = await read('sandboxes/worker');
      const workerAnswer = workerRecord.events.find(event => typeof event.result?.response === 'string').result.response;
      await editor.locator('.qs-feed').getByText(normalized(workerAnswer.split('\n')[0]), { exact: false }).waitFor();
      check(normalized(await editor.locator('.qs-feed').innerText()).split(normalized(workerAnswer)).length - 1 === 1, 'Complete long-job answer must appear once', item);
      await load('evals/regression-gate'); await editor.getByText('{ shipped: 1, candidate: 1 }', { exact: false }).waitFor();
      await load('evals/score-a-trace'); await editor.getByText('Score 1', { exact: true }).waitFor();
      check(!/llmCall|promptTokens|costUsd|durationMs/.test(await editor.locator('.qs-result').innerText()), 'Judgment must omit diagnostics', item);
      await load('fleets/cancel-on-cap'); await editor.locator('.qs-result').getByText('agent-1 · cancelled', { exact: true }).waitFor();
      await page.screenshot({ path: `${out}/${name}-fleet.png` });
      await page.goto(`${base}/?example=router/review-a-route#quickstart-title`); await editor.locator('.qs-file').filter({ hasText: 'review-a-route.mts' }).waitFor();
      check(await editor.locator('.qs-run').count() === 0 && await editor.locator('.qs-result, .qs-feed').count() === 0, 'Unrecorded source must not fabricate output or execution', item);
      await page.locator('.pr').scrollIntoViewIfNeeded();
      check(await page.locator('.pr iframe').count() === 0, 'App preview must remain still under reduced motion', item);
      await page.screenshot({ path: `${out}/${name}-app-preview.png` });
    }
    const optionalTelemetry = error => {
      const failedScripts = requestFailures.filter(request => request.method === 'GET' && request.type === 'script' && Math.abs(request.at - error.at) < 1000);
      const knownTelemetry = request => {
        const { origin, pathname } = new URL(request.url);
        return (origin === 'https://id.tangle.tools' && pathname === '/journey.js') ||
          (origin === 'https://www.googletagmanager.com' && pathname === '/gtag/js') ||
          (origin === 'https://static.cloudflareinsights.com' && /^\/beacon\.min\.js(?:\/|$)/.test(pathname));
      };
      return error.message === 'Cross-origin script load denied by Cross-Origin Resource Sharing policy.' && failedScripts.length > 0 && failedScripts.every(knownTelemetry);
    };
    item.optionalTelemetryErrors = item.errorDetails.filter(optionalTelemetry);
    item.appErrors = item.errorDetails.filter(error => !optionalTelemetry(error));
    check(item.appErrors.length === 0, 'Browser application errors', item);
  } catch (error) { report.failures.push({ case: name, message: String(error) }); }
  await page.close(); await context.close(); await browser.close();
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, revision: process.env.TANGLE_BUILD_REVISION ?? null, cases: report.cases.length, failures: report.failures, evidence: out, quality: report.quality }));
if (report.failures.length) process.exitCode = 1;
