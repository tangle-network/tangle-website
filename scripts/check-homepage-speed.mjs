#!/usr/bin/env node

// Fixed sequential browser cases guard the fast homepage's content and static cost.
// Wall-clock paint belongs to the live benchmark, not this CI gate.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import serveHandler from 'serve-handler'
import { chromium } from 'playwright'

const root = resolve('dist/client')
const out = resolve('audit-results/home-speed-ci')
const budget = JSON.parse(await readFile('scripts/fixtures/homepage-speed-budget.json', 'utf8'))
const content = JSON.parse(await readFile('scripts/fixtures/homepage-speed-content.json', 'utf8'))
const basePath = process.argv[2] === '--base-budget' ? process.argv[3] : null
if (process.argv.length > 2 && !basePath) throw new Error('Usage: check-homepage-speed.mjs [--base-budget path]')
const cases = [
  { name: 'desktop-fast', device: 'desktop', mode: 'fast', viewport: { width: 1440, height: 900 } },
  { name: 'mobile-fast', device: 'mobile', mode: 'fast', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: 'mobile-reduced', device: 'mobile', mode: 'fast', viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' },
  { name: 'desktop-control', device: 'desktop', mode: 'control', viewport: { width: 1440, height: 900 } },
  { name: 'mobile-control', device: 'mobile', mode: 'control', viewport: { width: 390, height: 844 }, isMobile: true },
]

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function checkRatchet(next, prior) {
  for (const device of ['desktop', 'mobile']) {
    for (const key of ['maxJsBytes', 'maxCssBytes', 'maxRequests', 'maxOwnRequests', 'maxCls']) {
      if (prior.fast[device][key] !== undefined) {
        assert.ok(next.fast[device][key] <= prior.fast[device][key], `${device} ${key} budget was raised`)
      }
    }
  }
}

if (basePath) {
  const prior = JSON.parse(await readFile(basePath, 'utf8'))
  checkRatchet(budget, prior)
}

const server = createServer((request, response) => serveHandler(request, response, { public: root }))
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const results = []

try {
  await mkdir(out, { recursive: true })
  for (const fixture of cases) {
    const context = await browser.newContext({
      viewport: fixture.viewport,
      isMobile: fixture.isMobile ?? false,
      hasTouch: fixture.isMobile ?? false,
      deviceScaleFactor: fixture.isMobile ? 3 : 1,
      reducedMotion: fixture.reducedMotion ?? 'no-preference',
      serviceWorkers: 'block',
    })
    const page = await context.newPage()
    const requests = []
    const externalRequests = []
    const errors = []
    await page.addInitScript(() => {
      window.__homeCls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__homeCls += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.route(/^https:\/\//, (route) => route.fulfill({ status: 204, body: '' }))
    page.on('request', (request) => {
      if (new URL(request.url()).origin === origin) requests.push(request.url())
      else externalRequests.push(request.url())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    try {
      const response = await page.goto(`${origin}/?home_speed=${fixture.mode}`, { waitUntil: 'load' })
      assert.equal(response?.status(), 200, `${fixture.name} document`)
      await page.waitForFunction(() => window.__homeRumEvents?.some((event) => event.name === 'FCP'), null, { timeout: 15000 })
      await page.waitForTimeout(300)
      assert.deepEqual((await page.locator('main h1').allInnerTexts()).map(normalize), [content.h1], `${fixture.name} h1`)
      assert.deepEqual((await page.locator('main h2').allInnerTexts()).map(normalize), content.h2, `${fixture.name} h2`)
      assert.equal(await page.locator('.hero .hero-actions .btn-primary').innerText(), content.primaryAction.text, `${fixture.name} CTA text`)
      assert.equal(await page.locator('.hero .hero-actions .btn-primary').getAttribute('href'), content.primaryAction.href, `${fixture.name} CTA target`)
      const bodyText = normalize(await page.locator('body').innerText())
      for (const line of content.requiredText) {
        assert.ok(bodyText.includes(line), `${fixture.name} missing published copy: ${line}`)
      }
      assert.equal(await page.locator('html').getAttribute('data-home-speed'), fixture.mode, `${fixture.name} flag`)
      assert.equal(errors.length, 0, `${fixture.name} page errors: ${errors.join('; ')}`)

      const rum = await page.evaluate(() => window.__homeRumEvents?.find((event) => event.name === 'FCP'))
      assert.equal(rum.homepage_mode, fixture.mode, `${fixture.name} field mode`)
      assert.equal(rum.viewport_group, fixture.isMobile ? 'small' : 'large', `${fixture.name} field device`)
      assert.ok(rum.build_revision, `${fixture.name} field build`)
      assert.ok(Number.isFinite(rum.metric_value), `${fixture.name} first paint measurement`)

      const layout = await page.evaluate(() => {
        const logo = document.querySelector('.wf-nav-brand-logo')
        const card = document.querySelector('.p-card-art')
        const action = document.querySelector('.hero .hero-actions .btn-primary')
        const rect = action?.getBoundingClientRect()
        const x = rect ? Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2)) : -1
        const y = rect ? Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2)) : -1
        return {
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          logoLoaded: Boolean(logo?.complete && logo.naturalWidth > 0),
          logoSource: logo?.currentSrc ?? '',
          cardBackground: card ? getComputedStyle(card).backgroundImage : '',
          cardImageDisplay: card?.querySelector('img') ? getComputedStyle(card.querySelector('img')).display : '',
          actionHit: Boolean(action?.contains(document.elementFromPoint(x, y))),
          posterVisible: getComputedStyle(document.querySelector('.hero-poster')).display !== 'none',
          cls: window.__homeCls,
        }
      })
      assert.equal(layout.overflow, 0, `${fixture.name} horizontal overflow`)
      assert.ok(layout.logoLoaded, `${fixture.name} nav logo`)
      if (fixture.mode === 'fast') {
        assert.ok(layout.logoSource.endsWith('/brand/tangle-nav-icon.svg'), `${fixture.name} fast logo`)
        assert.equal(layout.cardBackground, 'none', `${fixture.name} fast card background`)
        assert.equal(layout.cardImageDisplay, 'block', `${fixture.name} lazy card image`)
        assert.ok(!requests.some((url) => url.includes('Tnt%20Logo.png')), `${fixture.name} fetched control logo`)
      } else {
        assert.ok(layout.logoSource.includes('/images/webflow/Tnt%20Logo.png'), `${fixture.name} control logo`)
        assert.ok(layout.cardBackground.includes('card-sandbox.webp'), `${fixture.name} control card background`)
        assert.equal(layout.cardImageDisplay, 'none', `${fixture.name} control card image`)
      }
      assert.ok(layout.actionHit, `${fixture.name} CTA hit target`)
      if (fixture.mode === 'fast' || fixture.isMobile) assert.ok(layout.posterVisible, `${fixture.name} poster`)
      if (fixture.name === 'desktop-control') {
        await page.locator('#hero-knot.ready').waitFor({ timeout: 15000 })
      }
      if (fixture.isMobile) {
        await page.locator('#mobile-menu-toggle').click()
        assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'true', `${fixture.name} menu open`)
        await page.locator('.wf-mobile-menu-close').click()
        assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false', `${fixture.name} menu close`)
      }
      await page.screenshot({ path: resolve(out, `${fixture.name}.png`) })

      const scripts = [...new Set(requests.filter((url) => new URL(url).pathname.endsWith('.js')))]
      const stylesheets = [...new Set(requests.filter((url) => new URL(url).pathname.endsWith('.css')))]
      let jsBytes = 0
      for (const url of scripts) {
        const file = resolve(root, `.${new URL(url).pathname}`)
        assert.ok(file.startsWith(root + sep), `${fixture.name} asset escaped build root`)
        jsBytes += (await stat(file)).size
      }
      let cssBytes = 0
      for (const url of stylesheets) {
        const file = resolve(root, `.${new URL(url).pathname}`)
        assert.ok(file.startsWith(root + sep), `${fixture.name} stylesheet escaped build root`)
        cssBytes += (await stat(file)).size
      }
      const totalRequests = requests.length + externalRequests.length
      const result = { case: fixture.name, mode: fixture.mode, device: fixture.device, requests: totalRequests, ownRequests: requests.length, externalRequests: externalRequests.length, jsBytes, cssBytes, cls: layout.cls, scriptUrls: scripts, stylesheetUrls: stylesheets }
      if (fixture.mode === 'fast' && !fixture.reducedMotion) {
        const ceiling = budget.fast[fixture.device]
        assert.ok(jsBytes <= ceiling.maxJsBytes, `${fixture.name} JS ${jsBytes} > ${ceiling.maxJsBytes}`)
        assert.ok(cssBytes <= ceiling.maxCssBytes, `${fixture.name} CSS ${cssBytes} > ${ceiling.maxCssBytes}`)
        assert.ok(totalRequests <= ceiling.maxRequests, `${fixture.name} requests ${totalRequests} > ${ceiling.maxRequests}`)
        assert.ok(requests.length <= ceiling.maxOwnRequests, `${fixture.name} own requests ${requests.length} > ${ceiling.maxOwnRequests}`)
        assert.ok(layout.cls <= ceiling.maxCls, `${fixture.name} CLS ${layout.cls} > ${ceiling.maxCls}`)
      }
      results.push(result)
      console.log(`${fixture.name}: ${totalRequests} requests (${requests.length} own), ${jsBytes} JS bytes, ${cssBytes} CSS bytes, CLS ${layout.cls.toFixed(5)}; content and interaction pass`)
      if (fixture.mode === 'fast' && !fixture.reducedMotion) {
        await page.locator('.product-cards').scrollIntoViewIfNeeded()
        await page.waitForFunction(() => [...document.querySelectorAll('.p-card-art img')].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10000 })
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.product-cards')).opacity) > 0.95)
        await page.screenshot({ path: resolve(out, `${fixture.name}-cards.png`) })
      }
    } finally {
      await context.close()
    }
  }
  await writeFile(resolve(out, 'results.json'), JSON.stringify({ budget, results }, null, 2) + '\n')
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
