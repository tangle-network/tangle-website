// Exercises the built page or the served website; Playwright is owned by examples-typecheck.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const { chromium, webkit } = createRequire(new URL('./examples-typecheck/package.json', import.meta.url))('playwright');
import fs from 'node:fs/promises';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const out = process.env.EDITOR_EVIDENCE_DIR ?? await fs.mkdtemp(join(tmpdir(), 'tangle-editor-'));
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4321').origin;
await fs.mkdir(out, { recursive: true });
const home = `${base}/#quickstart-title`;
const directExample = `${base}/?example=sandboxes/fix-a-test#quickstart-title`;
const expectedRevision = process.env.TANGLE_BUILD_REVISION;
// Pages can switch version.json before the unmodified public document URLs reach the new release.
async function waitForDocument(url) {
  let observed = 'unavailable';
  const deadline = Date.now() + (expectedRevision ? 150_000 : 10_000);
  do {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const html = await response.text();
      observed = response.ok ? html.match(/<html\b[^>]*\bdata-build-revision="([^"]+)"/)?.[1] ?? 'unversioned' : `HTTP ${response.status}`;
      if (response.ok && (!expectedRevision || observed === expectedRevision)) return;
    } catch (error) { observed = String(error); }
    await wait(expectedRevision ? 5000 : 100);
  } while (Date.now() < deadline);
  throw new Error(`Expected ${expectedRevision ?? 'a ready document'} at ${url}, received ${observed}`);
}
await Promise.all([home, directExample].map(waitForDocument));
async function visit(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (expectedRevision) assert.equal(await page.locator('html').getAttribute('data-build-revision'), expectedRevision, url);
}
const read = async key => JSON.parse(await fs.readFile(`${ROOT}src/data/runs/${key}.json`, 'utf8'));
const source = await fs.readFile(join(ROOT, 'src/examples/sandboxes/fix-a-test.mts'), 'utf8');
const record = await read('sandboxes/fix-a-test');
const report = { cases: [], failures: [], quality: 'UNREVIEWED: render inspection is separate from functional checks' };
const check = (ok, message, item) => { if (!ok) report.failures.push({ case: item.name, message }); };
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
    await visit(page, home);
    const editor = page.locator('#quickstart .qs-editor'), main = editor.locator('.qs-main'), output = editor.locator('.qs-feed');
    // Keep the replay visible after a click retries with scrollIntoView and smooth page scrolling.
    const settle = () => editor.evaluate(root => root.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await editor.waitFor();
    await editor.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('.qs-editor')?.closest('astro-island')?.hasAttribute('ssr'));
    check(await editor.getByRole('button', { name: /^Example,/ }).count() === 1, 'One example picker in the shared workbench', item);
    item.initial = await editor.evaluate(root => ({ overflow: document.documentElement.scrollWidth - innerWidth, codeSize: getComputedStyle(root.querySelector('.qs-code code')).fontSize }));
    check(item.initial.overflow <= 1, 'The editor must not widen the page', item);
    if (width <= 680) check(item.initial.codeSize === '14px', 'Phone code size', item);
    await editor.locator('.qs-main[data-state="idle"]').waitFor();
    check(await editor.locator('[role=slider],input[type=range],.qs-progress').count() === 0, 'The editor has no seek control', item);
    await output.getByText(/client\.create/).first().waitFor();
    check(await main.getAttribute('data-state') === 'idle', 'Previewing the first recorded call does not start playback', item);
    const controls = page.locator('.company-examples');
    const heading = page.locator('#quickstart-title'), guide = page.locator('.quickstart-link');
    check(await heading.innerText() === 'Give each agent its own machine.', 'Default Sandbox heading', item);
    const group = controls.getByRole('navigation', { name: 'Example topics' });
    const selectedFile = id => editor.getByRole('region', { name: `${id}.mts source`, exact: true });
    const transcript = () => output.textContent();
    const picker = controls.getByRole('button', { name: /^Example,/ });
    const menu = page.getByRole('menu', { name: /^Example,/ });
    const chooseExample = async title => {
      await picker.click();
      await menu.getByRole('menuitemradio', { name: title, exact: true }).click();
    };
    const lastStepGap = await output.evaluate(pane => {
      const last = [...pane.querySelectorAll('[data-timeline-step]')].at(-1);
      return last ? pane.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom : Infinity;
    });
    check(lastStepGap >= 0 && lastStepGap < 24, 'Idle activity sits at the bottom of the stream', item);
    await picker.evaluate(button => button.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const pagePosition = () => page.evaluate(() => [Math.round(scrollY), document.documentElement.scrollHeight]);
    const beforeMenu = await pagePosition();
    if (width <= 680) await picker.tap();
    else await picker.click();
    await menu.waitFor();
    check((await pagePosition()).every((value, index) => Math.abs(value - beforeMenu[index]) <= 1), 'Opening the picker preserves the document position and height', item);
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    const planes = await controls.evaluate(root => ['.qs-source', '.qs-machine'].map(selector => getComputedStyle(root.querySelector(selector)).backgroundColor));
    check(new Set(planes).size === 2 && planes.every(color => color !== 'rgba(0, 0, 0, 0)'), 'Source and output have distinct surfaces', item);
    check(await editor.locator('.qs-actions .qs-run-id, .qs-actions .qs-stamp, .qs-actions .qs-clock').evaluateAll(nodes => nodes.every(node => !node.getClientRects().length)), 'Run metadata does not create a toolbar', item);
    if (name === 'desktop') {
      const sourceEdge = (await editor.locator('.qs-source').boundingBox());
      const resultEdge = (await editor.locator('.qs-machine').boundingBox());
      check(Math.abs(sourceEdge.y + sourceEdge.height - resultEdge.y - resultEdge.height) <= 1, 'Source and output end together in the desktop editor', item);
      check(sourceEdge.width >= 1.85 * resultEdge.width, 'Source has about twice the width of the trace', item);
      await group.getByRole('button', { name: 'Providers', exact: true }).click();
      await selectedFile('any-cloud').waitFor();
      await editor.locator('.qs-main[data-state="running"]').waitFor();
      await page.goBack();
      await selectedFile('fix-a-test').waitFor();
      check(await heading.innerText() === 'Give each agent its own machine.', 'Back restores the Sandbox heading', item);
      await page.goForward();
      await selectedFile('any-cloud').waitFor();
      await editor.locator('.qs-main[data-state="idle"]').waitFor();
      await picker.press('Enter');
      await menu.getByRole('menuitemradio', { name: 'Tangle', exact: true }).press('Enter');
      await editor.locator('.qs-main[data-state="running"]').waitFor();
      await group.getByRole('button', { name: 'Sandboxes', exact: true }).click();
      await picker.click();
      const options = menu.getByRole('menuitemradio');
      check(await options.count() === 13, 'All Sandbox examples are available from one picker', item);
      await menu.getByRole('menuitemradio', { name: 'Run a command', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.activeElement?.textContent === 'Crunch a CSV in Python');
      await page.keyboard.press('Enter');
      await selectedFile('python-csv').waitFor();
      await chooseExample('Fix a failing test');
    } else {
      await controls.getByRole('button', { name: /^Topic,/ }).tap();
      await page.getByRole('menuitemradio', { name: 'Providers', exact: true }).tap();
      await selectedFile('any-cloud').waitFor();
      check((await guide.getAttribute('href')).endsWith('/sandbox/other-providers') && /cloud/.test(await heading.innerText()), 'Touch topic selection updates the heading and guide', item);
      await editor.getByRole('button', { name: 'Pause the recorded run' }).tap();
      await controls.getByRole('button', { name: /^Example,/ }).tap();
      await page.getByRole('menuitemradio', { name: 'Tangle', exact: true }).tap();
      await editor.locator('.qs-main[data-state="running"]').waitFor();
    }
    // Hold the real island response so the early-click regression is reproducible on a fast connection too.
    let releaseIsland;
    if (name === 'narrow') {
      const held = new Promise(resolve => { releaseIsland = resolve; });
      await page.route('**/CompanyExamples.*.js', async route => { await held; await route.continue(); }, { times: 1 });
    }
    try {
      await visit(page, directExample);
      if (releaseIsland) {
        check(await editor.locator('.qs-source pre').isVisible(), 'Source remains readable before the island loads', item);
        check(await editor.getByRole('button', { name: 'Play the recorded run' }).isDisabled(), 'Replay must wait for its handler', item);
      }
    } finally { releaseIsland?.(); }
    await editor.scrollIntoViewIfNeeded();
    const play = editor.getByRole('button', { name: 'Play the recorded run', exact: true });
    await play.scrollIntoViewIfNeeded();
    check(await main.getAttribute('data-state') === 'idle', 'Direct links arrive at rest', item);
    await play.click();
    await editor.locator('.qs-main[data-state="running"]').waitFor();
    await editor.getByRole('button', { name: 'Pause the recorded run', exact: true }).click();
    const paused = await transcript();
    await page.waitForTimeout(600);
    check(await transcript() === paused && await main.getAttribute('data-state') === 'paused', 'Pause must stop the clock', item);
    await settle();
    await page.screenshot({ path: `${out}/${name}-paused.png` });
    await editor.getByRole('button', { name: 'Resume the recorded run', exact: true }).press('Space');
    await editor.locator('.qs-main[data-state="running"]').waitFor({ timeout: 5000 });
    const recordMs = Math.max(...record.events.map(event => event.atMs + (event.durationMs ?? 0)));
    await main.locator('.qs-band').waitFor();
    const activeLine = await main.locator('.qs-code').getAttribute('data-active-line');
    await output.locator('[data-timeline-step="tool"]').filter({ hasText: new RegExp('Line ' + activeLine + '\\b') }).first().waitFor();
    await editor.locator('.qs-main[data-state="ended"]').waitFor({ timeout: recordMs + 15000 });
    const tests = output.locator('details').filter({ has: page.getByText('9 tests passed', { exact: true }) });
    await tests.locator('summary').click();
    check(await editor.locator('.qs-ret').count() === 6 && /# pass 9\s+# fail 0/.test(await tests.innerText()), 'Source returns and the recorded test result stay inspectable', item);
    check(await editor.locator('.qs-receipt,.qs-patch').count() === 0, 'Company examples omit the full-width receipt and its download control', item);
    check(!/inputTokens|outputTokens|npm notice/.test(await output.innerText()), 'No accounting dumps or stderr notices in output', item);
    await page.screenshot({ path: `${out}/${name}-result.png` });
    const patch = output.locator('details').filter({ has: page.getByText('View recorded patch', { exact: true }) });
    await patch.locator('summary').click();
    check((await patch.innerText()).includes('diff --git'), 'The timeline retains the actual patch', item);
    if (engine === chromium) {
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copy file', exact: true }).click();
      await editor.locator('.qs-actions').getByRole('button', { name: 'Copied', exact: true }).waitFor();
      check(await page.evaluate(() => navigator.clipboard.readText()) === source, 'Copy must preserve full runnable source', item);
    }
    check((await editor.locator('.qs-feed').innerText()).includes('Find the cause and fix it.') && await editor.locator('.qs-feed [data-timeline-step]').count() >= 5, 'The transcript shows the prompt and each step the agent took', item);
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
    check(await output.locator('[data-timeline-step]').count() < 5, 'Replay restarts the transcript', item);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await editor.locator('.qs-main[data-state="ended"]').waitFor();
    check(await editor.getByRole('button', { name: 'Pause the recorded run', exact: true }).count() === 0, 'Reduced motion must finish without autoplay', item);
    if (name === 'desktop') {
      const catalog = await (await fetch(base + '/examples.json')).json();
      const topicGuides = new Map();
      for (const subject of catalog.subjects) {
        await group.getByRole('button', { name: subject.label, exact: true }).click();
        const topicHeading = await heading.innerText(), topicGuide = await guide.getAttribute('href');
        check(!topicGuides.has(topicHeading) && ![...topicGuides.values()].includes(topicGuide), 'Distinct heading and documentation for ' + subject.label, item);
        topicGuides.set(topicHeading, topicGuide);
        await picker.click();
        const titles = await menu.getByRole('menuitemradio').allTextContents();
        check(titles.length === subject.ideas.length && subject.ideas.every(idea => titles.some(title => title.trim() === idea.title)), 'Every ' + subject.label + ' example has a choice', item);
        await page.keyboard.press('Escape');
        for (const idea of subject.ideas) {
          await chooseExample(idea.title);
          await selectedFile(idea.id).waitFor();
          const key = subject.id + '/' + idea.id;
          check(new URL(page.url()).searchParams.get('example') === key, 'Shareable selection: ' + key, item);
          if (!idea.run) {
            await editor.locator('.qs-main[data-state="source"]').waitFor();
            check(!await output.isVisible(), 'Source-only examples use the full editor without an empty output pane: ' + key, item);
            check(await editor.locator('.qs-run').count() === 0, 'SDK example has no simulated run: ' + key, item);
            continue;
          }
          await editor.locator('.qs-main[data-state="ended"]').waitFor();
          check(await output.locator('.qs-execution-timeline').count() === 1 &&
            await output.locator('[data-timeline-step]').count() > 0, 'One recorded timeline: ' + key, item);
          if (key === 'sandboxes/python-csv') {
            const csv = await read(key);
            const totals = JSON.parse(csv.events.find(event => event.label === 'box.runCode').result.stdout);
            const rows = await output.getByRole('row').allTextContents();
            check(totals.every(([customer, total]) => rows.includes(customer + total)), 'Recorded CSV totals', item);
          }
          if (key === 'router/list-serving-models') {
            const printed = (await read(key)).events.find(event => event.kind === 'stdout').text.trim();
            const consoleOutput = output.locator('details').filter({ has: page.getByText('Console output', { exact: true }) });
            await consoleOutput.locator('summary').click();
            check((await consoleOutput.locator('pre').innerText()).trim() === printed, 'Router shows the recorded model IDs', item);
          }
          if (key === 'sandboxes/browser-task') {
            const browserRecord = await read(key);
            const headlines = JSON.parse(browserRecord.events.find(event => event.name === 'read').result);
            const transcript = await output.textContent();
            check(headlines.every(title => !transcript.includes(title)), 'Browser transcript excludes external headlines', item);
          }
        }
      }
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
