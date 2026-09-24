#!/usr/bin/env node

// Synthetic browser fixture for the served homepage. The same URL and fixture
// settings must be used when comparing a candidate with a saved baseline.
import { chromium } from 'playwright'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cpus, platform, release } from 'node:os'
import { gunzipSync } from 'node:zlib'

const DEFAULT_URL = 'https://www.tangle.tools/'
const FIXTURES = [
  {
    name: 'desktop',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    cpuRate: 1,
    network: { latency: 40, downloadThroughput: 1_250_000, uploadThroughput: 1_250_000 },
  },
  {
    name: 'mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    cpuRate: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 94_000 },
  },
]

function options(args) {
  const result = { url: DEFAULT_URL, pairs: 9, output: null, recordDir: null, compare: null, round: 1 }
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    const value = args[++index]
    if (flag === '--url') result.url = value
    else if (flag === '--pairs') result.pairs = Number(value)
    else if (flag === '--output') result.output = resolve(value)
    else if (flag === '--record-dir') result.recordDir = resolve(value)
    else if (flag === '--compare') result.compare = resolve(value)
    else if (flag === '--round') result.round = Number(value)
    else throw new Error(`Unknown option ${flag}`)
  }
  if (!Number.isInteger(result.pairs) || result.pairs < 1) throw new Error('--pairs must be a positive integer')
  if (![1, 2].includes(result.round)) throw new Error('--round must be 1 or 2')
  const parsed = new URL(result.url)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('--url must be HTTP(S)')
  result.url = parsed.href
  return result
}

function pageProbe() {
  const state = { firstPaintMs: null, fcpMs: null, lcpMs: null, lcpElement: null, heroVisibleMs: null, cls: 0 }
  window.__homeSpeed = state
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') state.firstPaintMs = entry.startTime
        if (entry.name === 'first-contentful-paint') state.fcpMs = entry.startTime
      }
    }).observe({ type: 'paint', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.lcpMs = entry.startTime
        state.lcpElement = entry.element ? `${entry.element.tagName.toLowerCase()}${entry.element.id ? `#${entry.element.id}` : ''}${entry.element.className && typeof entry.element.className === 'string' ? `.${entry.element.className.trim().replace(/\s+/g, '.')}` : ''}` : null
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) state.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {}

  function heroReady() {
    const heading = document.querySelector('.hero h1')
    const action = document.querySelector('.hero-actions .btn-primary')
    if (!heading?.textContent?.trim() || !action?.getAttribute('href')) return false
    for (const element of [heading, action]) {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none') return false
    }
    const rect = action.getBoundingClientRect()
    const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2))
    const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2))
    return rect.top >= 0 && rect.bottom <= innerHeight && action.contains(document.elementFromPoint(x, y))
  }

  function checkHero() {
    if (!heroReady()) return requestAnimationFrame(checkHero)
    // The second frame allows layout and paint to catch up with DOM creation.
    requestAnimationFrame(() => {
      if (heroReady()) state.heroVisibleMs = performance.now()
      else requestAnimationFrame(checkHero)
    })
  }
  requestAnimationFrame(checkHero)
}

function percentile(values, fraction) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.ceil(sorted.length * fraction) - 1]
}

function summarize(samples) {
  const fields = ['firstPaintMs', 'fcpMs', 'heroUsableMs', 'lcpMs', 'cls', 'requests', 'encodedBytes', 'jsEncodedBytes']
  const summary = {}
  for (const field of fields) {
    const observed = samples.map((sample) => sample[field]).filter((value) => Number.isFinite(value))
    summary[field] = { count: observed.length, p75: percentile(observed, 0.75), min: observed.length ? Math.min(...observed) : null, max: observed.length ? Math.max(...observed) : null }
  }
  return summary
}

function pathOnly(url) {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return url
  }
}

async function servedBuild(url) {
  const receiptUrl = new URL('/version.json', url).href
  const checkedAt = new Date().toISOString()
  try {
    const response = await fetch(receiptUrl, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return { receiptUrl, checkedAt, httpStatus: response.status, revision: null }
    const body = await response.json()
    return { receiptUrl, checkedAt, httpStatus: response.status, revision: body.revision ?? null, source: body.source ?? null }
  } catch (error) {
    return { receiptUrl, checkedAt, httpStatus: null, revision: null, error: String(error) }
  }
}

async function makePage(browser, fixture, version, recordDir) {
  const userAgent = fixture.isMobile
    ? `Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version.split('.')[0]}.0.0.0 Mobile Safari/537.36`
    : undefined
  const context = await browser.newContext({
    viewport: fixture.viewport,
    deviceScaleFactor: fixture.deviceScaleFactor,
    isMobile: fixture.isMobile,
    hasTouch: fixture.hasTouch,
    userAgent,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    ...(recordDir ? { recordVideo: { dir: recordDir, size: fixture.viewport } } : {}),
  })
  await context.addInitScript(pageProbe)
  const page = await context.newPage()
  const client = await page.context().newCDPSession(page)
  await client.send('Network.enable')
  await client.send('Network.setCacheDisabled', { cacheDisabled: false })
  await client.send('Network.emulateNetworkConditions', { offline: false, ...fixture.network })
  await client.send('Emulation.setCPUThrottlingRate', { rate: fixture.cpuRate })
  return { context, page, client }
}

async function sample(browser, fixture, version, url, mode, pair, recordDir) {
  const session = await makePage(browser, fixture, version, recordDir)
  const { context, page, client } = session
  const events = { requests: [], responses: new Map(), failures: [], consoleErrors: [] }
  let capturing = false
  client.on('Network.requestWillBeSent', ({ requestId, request, type }) => {
    if (capturing) events.requests.push({ requestId, url: request.url, type })
  })
  client.on('Network.responseReceived', ({ requestId, response, type }) => {
    if (capturing) events.responses.set(requestId, { url: response.url, status: response.status, type, mimeType: response.mimeType, bytes: 0, fromDiskCache: response.fromDiskCache, fromServiceWorker: response.fromServiceWorker })
  })
  client.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
    if (capturing && events.responses.has(requestId)) events.responses.get(requestId).bytes = encodedDataLength
  })
  client.on('Network.loadingFailed', ({ requestId, errorText }) => {
    if (capturing) events.failures.push({ url: pathOnly(events.requests.findLast((request) => request.requestId === requestId)?.url ?? ''), error: errorText })
  })
  page.on('console', (message) => {
    if (capturing && message.type() === 'error') events.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => {
    if (capturing) events.consoleErrors.push(error.message)
  })

  async function navigate(coldOrWarm, captureMedia) {
    events.requests = []
    events.responses.clear()
    events.failures = []
    events.consoleErrors = []
    capturing = true
    let navigationError = null
    let response = null
    try {
      response = await page.goto(url, { waitUntil: 'load', timeout: 45_000 })
      await page.waitForFunction(() => typeof window.__homeSpeed?.heroVisibleMs === 'number', null, { timeout: 15_000 })
      await page.waitForTimeout(2_000)
    } catch (error) {
      navigationError = String(error)
    }
    capturing = false
    const pageState = await page.evaluate(() => {
      const state = window.__homeSpeed ?? {}
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        ...state,
        navigation: navigation ? { responseStart: navigation.responseStart, domContentLoadedEventEnd: navigation.domContentLoadedEventEnd, loadEventEnd: navigation.loadEventEnd, transferSize: navigation.transferSize } : null,
        heading: document.querySelector('.hero h1')?.textContent?.trim() ?? null,
        action: document.querySelector('.hero-actions .btn-primary')?.textContent?.trim() ?? null,
        actionHref: document.querySelector('.hero-actions .btn-primary')?.getAttribute('href') ?? null,
        bodyTextLength: document.body?.innerText?.length ?? 0,
        sectionHeadings: [...document.querySelectorAll('main h2, section h2')].map((node) => node.textContent.trim()).filter(Boolean),
        horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        readyState: document.readyState,
        resources: performance.getEntriesByType('resource').map((item) => ({ url: item.name, startMs: item.startTime, endMs: item.responseEnd, durationMs: item.duration, initiatorType: item.initiatorType })),
      }
    }).catch(() => ({}))
    const responses = [...events.responses.values()]
    const js = responses.filter((item) => item.type === 'Script' || /javascript/.test(item.mimeType))
    const broken = responses.filter((item) => item.status >= 400).map(({ url, status }) => ({ url, status }))
    const result = {
      fixture: fixture.name,
      cache: coldOrWarm,
      pair,
      httpStatus: response?.status() ?? null,
      navigationError,
      firstPaintMs: pageState.firstPaintMs ?? null,
      fcpMs: pageState.fcpMs ?? null,
      heroVisibleMs: pageState.heroVisibleMs ?? null,
      heroUsableMs: pageState.fcpMs == null || pageState.heroVisibleMs == null ? null : Math.max(pageState.fcpMs, pageState.heroVisibleMs),
      lcpMs: pageState.lcpMs ?? null,
      lcpElement: pageState.lcpElement ?? null,
      cls: pageState.cls ?? null,
      requests: events.requests.length,
      encodedBytes: responses.reduce((sum, item) => sum + item.bytes, 0),
      jsEncodedBytes: js.reduce((sum, item) => sum + item.bytes, 0),
      jsRequests: js.length,
      resources: responses.map((item) => ({ url: pathOnly(item.url), type: item.type, mimeType: item.mimeType, status: item.status, encodedBytes: item.bytes, fromDiskCache: item.fromDiskCache, fromServiceWorker: item.fromServiceWorker })),
      resourceTimings: (pageState.resources ?? []).map((item) => ({ ...item, url: pathOnly(item.url) })),
      failedRequests: events.failures,
      httpErrors: broken,
      consoleErrors: events.consoleErrors,
      navigation: pageState.navigation,
      content: { heading: pageState.heading ?? null, action: pageState.action ?? null, actionHref: pageState.actionHref ?? null, bodyTextLength: pageState.bodyTextLength ?? 0, sectionHeadings: pageState.sectionHeadings ?? [], horizontalOverflowPx: pageState.horizontalOverflowPx ?? null, readyState: pageState.readyState ?? null },
    }
    if (captureMedia) {
      const file = resolve(recordDir, `${fixture.name}-${coldOrWarm}.png`)
      await page.screenshot({ path: file, animations: 'disabled' })
      result.screenshot = file
    }
    if (fixture.isMobile && !navigationError) {
      const toggle = page.locator('#mobile-menu-toggle')
      try {
        await toggle.click({ timeout: 5_000 })
        result.mobileMenuOpened = await toggle.getAttribute('aria-expanded') === 'true'
        await page.keyboard.press('Escape')
        result.mobileMenuClosed = await toggle.getAttribute('aria-expanded') === 'false'
      } catch (error) {
        result.mobileMenuError = String(error)
      }
    }
    return result
  }

  let result
  try {
    if (mode === 'warm') {
      await navigate('prime', false)
      await page.goto('about:blank', { waitUntil: 'load' })
    }
    result = await navigate(mode, Boolean(recordDir))
    if (recordDir) result.video = await page.video().path()
  } finally {
    await context.close()
  }
  if (recordDir) {
    const file = resolve(recordDir, `${fixture.name}-${mode}.webm`)
    await rename(result.video, file)
    result.video = file
  }
  return result
}

function compare(current, baseline, round) {
  const speedFactor = round === 1 ? 1 / 1.2 : 0.5
  const findings = []
  for (const fixture of FIXTURES) {
    for (const cache of ['cold', 'warm']) {
      const key = `${fixture.name}-${cache}`
      for (const metric of ['fcpMs', 'heroUsableMs']) {
        const observed = current.summary[key][metric].p75
        const reference = baseline.summary[key][metric].p75
        if (observed == null || reference == null) findings.push(`${key} ${metric}: missing measurement`)
        else if (observed > reference * speedFactor) findings.push(`${key} ${metric}: ${observed.toFixed(1)}ms > ${(reference * speedFactor).toFixed(1)}ms`)
      }
    }
  }
  return { speedFactor, pass: findings.length === 0, findings }
}

async function main() {
  const opts = options(process.argv.slice(2))
  if (opts.recordDir) await mkdir(opts.recordDir, { recursive: true })
  const build = await servedBuild(opts.url)
  const browser = await chromium.launch({ headless: true, args: ['--disable-background-networking'] })
  const version = browser.version()
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: opts.url,
    servedBuild: build,
    browser: { name: 'Chromium', version, playwright: '1.62.1' },
    host: { platform: platform(), release: release(), cpuModel: cpus()[0]?.model ?? null, logicalCpus: cpus().length, node: process.version },
    method: { pairs: opts.pairs, order: 'per device, alternating cold and warm', serviceWorkers: 'blocked', sampleWindow: 'navigation through load plus 2s', heroUsable: 'max(FCP, first painted frame with visible hero heading and hit-testable primary action)', p75: 'nearest rank, ceil(0.75*n)' },
    fixtures: FIXTURES,
    samples: [],
    summary: {},
  }
  try {
    for (const fixture of FIXTURES) {
      for (let pair = 1; pair <= opts.pairs; pair++) {
        for (const cache of ['cold', 'warm']) {
          // Every cold and warm run has a fresh isolated context. Warm primes
          // the HTTP cache with one homepage visit before the measured visit.
          const item = await sample(browser, fixture, version, opts.url, cache, pair, null)
          result.samples.push(item)
          console.log(`${fixture.name} ${cache} ${pair}/${opts.pairs}: FCP=${item.fcpMs ?? 'null'}ms usable=${item.heroUsableMs ?? 'null'}ms JS=${item.jsEncodedBytes}B requests=${item.requests} CLS=${item.cls ?? 'null'}`)
        }
      }
    }
    for (const fixture of FIXTURES) {
      for (const cache of ['cold', 'warm']) {
        const key = `${fixture.name}-${cache}`
        result.summary[key] = summarize(result.samples.filter((item) => item.fixture === fixture.name && item.cache === cache))
      }
    }
    if (opts.recordDir) {
      result.recordings = []
      for (const fixture of FIXTURES) {
        for (const cache of ['cold', 'warm']) {
          const item = await sample(browser, fixture, version, opts.url, cache, 'recording', opts.recordDir)
          result.recordings.push(item)
          console.log(`recorded ${fixture.name} ${cache}: ${item.screenshot} ${item.video}`)
        }
      }
    }
    if (opts.compare) {
      const source = await readFile(opts.compare)
      const baseline = opts.compare.endsWith('.gz') ? gunzipSync(source) : source
      result.comparison = compare(result, JSON.parse(baseline.toString('utf8')), opts.round)
    }
    result.completedAt = new Date().toISOString()
    if (opts.output) {
      await mkdir(dirname(opts.output), { recursive: true })
      await writeFile(opts.output, JSON.stringify(result, null, 2) + '\n')
      console.log(`Wrote ${opts.output}`)
    }
    const failures = result.samples.filter((item) => item.httpStatus !== 200 || item.navigationError || item.fcpMs == null || item.heroUsableMs == null || item.content.bodyTextLength < 1000 || item.content.sectionHeadings.length < 5 || item.content.horizontalOverflowPx > 0 || item.mobileMenuError || item.mobileMenuOpened === false || item.mobileMenuClosed === false)
    if (failures.length) {
      console.error(`${failures.length} samples failed content or measurement checks`)
      process.exitCode = 1
    }
    if (result.comparison && !result.comparison.pass) {
      console.error(result.comparison.findings.join('\n'))
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
