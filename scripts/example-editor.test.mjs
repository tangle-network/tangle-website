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
    const editor = page.locator('#quickstart .qs-editor'), main = editor.locator('.qs-main'), output = editor.locator('.qs-result');
    // Keep the replay visible after a click retries with scrollIntoView and smooth page scrolling.
    const settle = () => editor.evaluate(root => root.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await editor.waitFor();
    await editor.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('.qs-editor')?.closest('astro-island')?.hasAttribute('ssr'));
    check(await editor.locator('select,[role=combobox]').count() === 0, 'No dropdowns in editor', item);
    item.initial = await editor.evaluate(root => ({ overflow: document.documentElement.scrollWidth - innerWidth, codeSize: getComputedStyle(root.querySelector('.qs-code code')).fontSize }));
    check(item.initial.overflow <= 1, 'The editor must not widen the page', item);
    if (width <= 680) check(item.initial.codeSize === '12px', 'Phone code size', item);
    // Finished output is the default; replay is an explicit reader action.
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    const controls = page.locator('.company-examples');
    const group = controls.getByRole('navigation', { name: 'Example topics' });
    const selectedFile = id => editor.getByRole('region', { name: `${id}.mts source`, exact: true });
    const position = () => editor.getByRole('slider', { name: 'Run position' }).getAttribute('aria-valuenow');
    const planes = await controls.evaluate(root => ['.ce-files', '.qs-source', '.qs-machine'].map(selector => getComputedStyle(root.querySelector(selector)).backgroundColor));
    check(new Set(planes).size === 3 && planes.every(color => color !== 'rgba(0, 0, 0, 0)'), 'File list, source and output have different opaque surfaces', item);
    check(await editor.locator('.qs-actions .qs-run-id, .qs-actions .qs-stamp, .qs-actions .qs-clock').evaluateAll(nodes => nodes.every(node => !node.getClientRects().length)), 'Run metadata does not create a toolbar', item);
    if (name === 'desktop') {
      await group.getByRole('button', { name: 'Any cloud', exact: true }).click();
      await selectedFile('any-cloud').waitFor();
      await group.getByRole('button', { name: 'Sandboxes', exact: true }).click();
      const files = controls.getByRole('navigation', { name: 'Sandboxes examples' });
      check(await files.locator('[data-file]').count() === 5, 'Only five examples from the active topic open initially', item);
      await files.getByRole('button', { name: /^Show \d+ more$/ }).click();
      await files.getByRole('button', { name: 'Run a command', exact: true }).press('ArrowDown');
      await selectedFile('python-csv').waitFor();
      await files.getByRole('button', { name: 'Fix a failing test', exact: true }).click();
    } else {
      await controls.getByRole('combobox', { name: 'Topic' }).click();
      await page.getByRole('option', { name: 'Router', exact: true }).click();
      await controls.getByRole('combobox', { name: 'Example' }).click();
      await page.getByRole('option', { name: 'Review an API route', exact: true }).click();
      await selectedFile('review-a-route').waitFor();
    }
    await page.goto(`${base}/?example=sandboxes/fix-a-test#quickstart-title`);
    await editor.scrollIntoViewIfNeeded();
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    await editor.getByRole('button', { name: 'Replay the recorded run', exact: true }).click();
    await editor.locator('.qs-main[data-state="running"]').waitFor();
    await editor.getByRole('button', { name: 'Pause the recorded run', exact: true }).click();
    const paused = await position();
    await page.waitForTimeout(600);
    check(await position() === paused && await main.getAttribute('data-state') === 'idle', 'Pause must stop the clock', item);
    await settle();
    await page.screenshot({ path: `${out}/${name}-paused.png` });
    await editor.getByRole('button', { name: 'Replay the recorded run', exact: true }).press('Space');
    await editor.locator('.qs-main[data-state="running"]').waitFor({ timeout: 5000 });
    const recordMs = Math.max(...record.events.map(event => event.atMs + (event.durationMs ?? 0)));
    await editor.locator('.qs-receipt').getByText('9 tests passed', { exact: true }).waitFor({ timeout: recordMs + 15000 });
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    check(await editor.locator('.qs-ret').count() === 6 && (await editor.locator('.qs-receipt').innerText()).includes('in model calls'), 'A finished run shows what each call returned and what the run cost', item);
    check(!/inputTokens|outputTokens|npm notice/.test(await output.innerText()), 'No accounting dumps or stderr notices in output', item);
    await page.screenshot({ path: `${out}/${name}-result.png` });
    const download = await Promise.all([page.waitForEvent('download'), editor.getByRole('link', { name: 'Download patch', exact: false }).click()]).then(([value]) => value);
    const downloaded = await fs.readFile(await download.path(), 'utf8');
    check(downloaded === patch, 'Full exact three-file patch preserved', item);
    item.patchSha256 = createHash('sha256').update(downloaded).digest('hex');
    check((await output.locator('.qs-files > div').count()) === 3, 'The result shows every changed file', item);
    if (engine === chromium) {
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copy file', exact: true }).click();
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copied', exact: true }).waitFor();
      check(await page.evaluate(() => navigator.clipboard.readText()) === source, 'Copy must preserve full runnable source', item);
    }
    check((await editor.locator('.qs-feed').innerText()).includes('Find the cause and fix it.') && await editor.locator('.qs-feed .qs-tool').count() >= 5, 'The transcript shows the prompt and each step the agent took', item);
    await editor.getByRole('slider', { name: 'Run position' }).press('Home');
    check(await main.getAttribute('data-state') !== 'ended', 'Moving the run position moves the run', item);
    await editor.getByRole('slider', { name: 'Run position' }).press('End');
    const scroll = await editor.locator('.qs-code').evaluate(async pane => {
      pane.scrollIntoView({ block: 'center', behavior: 'instant' });
      pane.scrollTop = pane.scrollHeight;
      await new Promise(requestAnimationFrame);
      const lines = [...pane.querySelectorAll('pre > code > span')];
      const last = lines.at(-1).getBoundingClientRect();
      const box = pane.getBoundingClientRect();
      const painted = document.elementFromPoint(box.left + 20, last.top + 3)?.closest('pre');
      const anchors = lines.filter(line => parseFloat(getComputedStyle(line).paddingBottom) > 0)
        .map(line => line.getBoundingClientRect().bottom - parseFloat(getComputedStyle(line).paddingBottom));
      const labels = [...pane.querySelectorAll('.qs-ret')].map(label => label.getBoundingClientRect().top);
      const aligned = anchors.length === labels.length && anchors.every((anchor, i) => Math.abs(anchor - labels[i]) <= 2);
      const visible = last.bottom <= box.bottom + 1 && painted === pane.querySelector('pre');
      pane.scrollTop = 0;
      return { visible, aligned };
    });
    check(scroll.visible && scroll.aligned, 'The final code line paints and inline return labels stay anchored after scrolling to the end', item);
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    await editor.getByRole('button', { name: 'Replay the recorded run', exact: true }).click();
    await settle();
    await editor.locator('.qs-main[data-state="running"]').waitFor();
    check(Number(await position()) < 0.25, 'Run again must restart', item);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await editor.locator('.qs-receipt').getByText('9 tests passed', { exact: true }).waitFor();
    check(await editor.getByRole('button', { name: 'Pause the recorded run', exact: true }).count() === 0, 'Reduced motion must finish without autoplay', item);
    const load = async key => { await page.goto(`${base}/?example=${key}#quickstart-title`); await selectedFile(key.split('/').at(-1)).waitFor(); await editor.scrollIntoViewIfNeeded(); };
    if (name === 'desktop') {
      await load('sandboxes/browser-task');
      await editor.locator('.qs-main[data-state="ended"]').waitFor();
      const browserRecord = await read('sandboxes/browser-task');
      const headlines = JSON.parse(browserRecord.events.find(event => event.name === 'read').result);
      const noHeadlines = text => headlines.every(title => !text.includes(title));
      let awaitText = await editor.locator('.qs-feed').innerText();
      check(noHeadlines(awaitText), 'Browser output must omit the recorded third-party headlines', item);
      const setup = editor.locator('.qs-feed button[aria-expanded]').first();
      await setup.click();
      awaitText = await editor.locator('.qs-feed').innerText();
      check(noHeadlines(awaitText), 'Expanded browser setup must omit the recorded headlines', item);
      const fallback = browserRecord.events.find(event => event.data?.part?.type === 'text' && event.data.part.text.includes('executable_path')).data.part.text.replace(/`/g, '');
      check(normalized(awaitText).includes(normalized(fallback)), 'The recorded browser fallback remains visible', item);
      check(awaitText.includes('EGRESS_DOMAIN_NOT_ALLOWED'), 'The recorded browser download refusal remains visible', item);
      await load('evals/compare-harnesses');
      await editor.locator('.qs-score-cell').last().waitFor();
      const comparison = await read('evals/compare-harnesses');
      const duration = ms => ms < 1000 ? `${Math.round(ms)} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
      const shownTimes = await editor.locator('.qs-score-cell i').allTextContents();
      check(comparison.events.filter(event => event.name === 'prompt').every(event => shownTimes.includes(duration(event.durationMs))), 'Every coding-agent timing comes from its recorded prompt', item);
      await load('sandboxes/stop-and-resume');
      await editor.locator('.qs-main[data-state="ended"]').waitFor();
      const states = await editor.locator('.qs-ret b').allTextContents();
      check(states.includes('stopped') && states.includes('running'), 'Void lifecycle calls retain their recorded outcomes', item);
      await load('sandboxes/host-a-page');
      await editor.locator('.qs-main[data-state="ended"]').waitFor();
      check((await editor.locator('.qs-ret b').allTextContents()).includes('killed'), 'A void process kill retains its recorded outcome', item);
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
      await page.goto(`${base}/?example=router/review-a-route#quickstart-title`); await selectedFile('review-a-route').waitFor();
      check(await editor.locator('.qs-run').count() === 0 && await editor.locator('.qs-result, .qs-feed').count() === 0, 'Unrecorded source must not fabricate output or execution', item);
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
