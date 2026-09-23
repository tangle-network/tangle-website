import http from 'node:http'
import handler from 'serve-handler'
import { chromium } from 'playwright'
const [,, root, out, ...paths] = process.argv
const server = http.createServer((req, res) => handler(req, res, { public: root, cleanUrls: true }))
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' })
for (const [i, p] of paths.entries()) {
  const url = p.startsWith('http') ? p : base + p
  for (const [w, tag] of [[1440, 'desktop'], [390, 'mobile']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } })
    const res = await page.goto(url, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${out}-${i}-${tag}.png`, fullPage: true })
    const h1 = await page.locator('h1').first().innerText().catch(() => '')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    console.log(JSON.stringify({ url: url.replace(base, ''), viewport: tag, status: res?.status(), h1, horizontalOverflow: overflow }))
    await page.close()
  }
}
await browser.close(); server.close()
