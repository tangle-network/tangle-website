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
  const version = await (await fetch(`${base}/version.json?revision=${process.env.TANGLE_BUILD_REVISION}`)).json();
  assert.equal(version.revision, process.env.TANGLE_BUILD_REVISION);
}
const read = async key => JSON.parse(await fs.readFile(`${ROOT}src/data/runs/${key}.json`, 'utf8'));
const source = await fs.readFile(join(ROOT, 'src/examples/sandboxes/fix-a-test.mts'), 'utf8');
const record = await read('sandboxes/fix-a-test'), patch = record.events[33].result.stdout;
const report = { cases: [], failures: [], quality: 'UNREVIEWED: render inspection is separate from functional checks' };
const check = (ok, message, item) => { if (!ok) report.failures.push({ case: item.name, message }); };
const normalized = text => text.replace(/`+|\*\*/g, '').replace(/^\s*[-*]\s+/gm, '').replace(/\s+/g, ' ').trim();
for (const [name, engine, width, height] of [['desktop', chromium, 1440, 900], ['phone', chromium, 390, 844], ['narrow', chromium, 320, 740], ['webkit-phone', webkit, 390, 844]]) {
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true,
    ...(engine === chromium ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}),
    ...(name === 'phone' ? { recordVideo: { dir: `${out}/video`, size: { width, height } } } : {}) });
  await context.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [], requestFailures = [], item = { name, width, height, errors, requestFailures, errorDetails: [] };
  report.cases.push(item);
  page.on('pageerror', error => { errors.push(String(error)); item.errorDetails.push({ message: String(error), stack: error.stack, at: Date.now() }); });
  page.on('requestfailed', request => requestFailures.push({ url: request.url(), method: request.method(), type: request.resourceType(), error: request.failure()?.errorText, at: Date.now() }));
  try {
    await page.goto(`${base}/#quickstart-title`, { waitUntil: 'domcontentloaded' });
    const editor = page.locator('.qs-editor'), run = editor.getByRole('button', { name: 'Run', exact: true });
    await run.waitFor();
    await editor.scrollIntoViewIfNeeded();
    check(await editor.locator('.qs-result').count() === 0, 'Output must wait for Run', item);
    check(await editor.locator('select,[role=combobox]').count() === 0, 'No dropdowns in editor', item);
    item.initial = await editor.evaluate(root => ({ overflow: document.documentElement.scrollWidth - innerWidth,
      codeSize: getComputedStyle(root.querySelector('.qs-code code')).fontSize,
      codeHeight: root.querySelector('.qs-code').getBoundingClientRect().height,
      taskVisible: (() => { const pane = root.querySelector('.qs-code').getBoundingClientRect(), row = [...root.querySelectorAll('.qs-code pre > code > span')].find(e => e.textContent.includes('await box.prompt('))?.getBoundingClientRect(); return !!row && row.top >= pane.top && row.bottom <= pane.bottom; })() }));
    check(item.initial.overflow <= 1 && item.initial.codeHeight <= 321, 'Initial editor must fit compact code height without page overflow', item);
    check(item.initial.taskVisible, 'Actual agent task should be visible before Run', item);
    if (width <= 680) check(item.initial.codeSize === '13px', 'Phone code size', item);
    await page.screenshot({ path: `${out}/${name}-before-run.png` });
    await run.click();
    const output = editor.locator('.qs-result');
    await output.getByRole('button', { name: 'Pause', exact: true }).waitFor();
    await output.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await output.getAttribute('data-at');
    await page.waitForTimeout(350);
    check(await output.getAttribute('data-at') === paused, 'Pause must stop the clock', item);
    await page.screenshot({ path: `${out}/${name}-paused.png` });
    await output.getByRole('button', { name: 'Continue', exact: true }).click();
    await output.getByText('9 tests passed', { exact: true }).waitFor({ timeout: 45000 });
    await output.getByRole('link', { name: 'Download patch', exact: true }).waitFor();
    check(!/Recorded|Details|Reported usage|invoice|inputTokens/.test(await output.innerText()), 'No recording or accounting metadata in output', item);
    await page.screenshot({ path: `${out}/${name}-result.png` });
    const download = await Promise.all([page.waitForEvent('download'), output.getByRole('link', { name: 'Download patch', exact: true }).click()]).then(([value]) => value);
    const downloaded = await fs.readFile(await download.path(), 'utf8');
    check(downloaded === patch, 'Full exact three-file patch preserved', item);
    item.patchSha256 = createHash('sha256').update(downloaded).digest('hex');
    await output.locator('summary').click();
    check((await output.locator('code').innerText()) === patch, 'View changes must show complete patch', item);
    if (engine === chromium) {
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copy to clipboard', exact: true }).click();
      check(await page.evaluate(() => navigator.clipboard.readText()) === source, 'Copy must preserve full runnable source', item);
    }
    await editor.getByRole('button', { name: 'Run again', exact: true }).click();
    check(Number(await editor.locator('.qs-result').getAttribute('data-at')) < 5000, 'Run again must restart', item);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await editor.getByText('9 tests passed', { exact: true }).waitFor();
    check(await editor.getByRole('button', { name: 'Pause', exact: true }).count() === 0, 'Reduced motion must finish without autoplay', item);
    const load = async key => { await page.goto(`${base}/?example=${key}#quickstart-title`); await editor.locator('.qs-file').filter({ hasText: `${key.split('/').at(-1)}.mts` }).waitFor(); await editor.getByRole('button', { name: 'Run', exact: true }).click(); };
    if (name === 'desktop') {
      await load('sandboxes/run-code');
      const commandRecord = await read('sandboxes/run-code');
      const commandOutput = commandRecord.events.find(event => event.result?.stdout?.includes('Linux')).result.stdout.trim();
      await editor.locator('.qs-result').getByText(commandOutput, { exact: false }).waitFor();
      check((await editor.locator('.qs-result').innerText()).split(commandOutput).length - 1 === 1, 'Command output must appear once', item);
      await load('sandboxes/worker');
      const workerRecord = await read('sandboxes/worker');
      const workerAnswer = workerRecord.events.find(event => typeof event.result?.response === 'string').result.response;
      await editor.locator('.qs-result').getByText('Upgrade Complete', { exact: false }).waitFor();
      check(normalized(await editor.locator('.qs-result').innerText()).split(normalized(workerAnswer)).length - 1 === 1, 'Complete long-job answer must appear once', item);
      await load('evals/regression-gate'); await editor.getByText('{ shipped: 1, candidate: 1 }', { exact: false }).waitFor();
      await load('evals/score-a-trace'); await editor.getByText('Score 1', { exact: true }).waitFor();
      check(!/llmCall|promptTokens|costUsd|durationMs/.test(await editor.locator('.qs-result').innerText()), 'Judgment must omit diagnostics', item);
      await load('fleets/cancel-on-cap'); await editor.locator('.qs-result').getByText('agent-1 · cancelled', { exact: true }).waitFor();
      await page.screenshot({ path: `${out}/${name}-fleet.png` });
      await page.goto(`${base}/?example=router/review-a-route#quickstart-title`); await editor.locator('.qs-file').filter({ hasText: 'review-a-route.mts' }).waitFor();
      check(await editor.getByRole('button', { name: 'Run', exact: true }).count() === 0 && await editor.locator('.qs-result').count() === 0, 'Unrecorded source must not fabricate output or execution', item);
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
