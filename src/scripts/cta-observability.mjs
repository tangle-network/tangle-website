const CTA_EVENT_NAME = 'tangle_cta_click'

// These are the product origins that the public site intentionally links to.
// Matching the complete host prevents a user-controlled subdomain from being
// recorded as a Tangle product.
const PRODUCT_ORIGINS = new Map([
  ['sandbox.tangle.tools', 'sandbox'],
  ['router.tangle.tools', 'router'],
  ['intelligence.tangle.tools', 'intelligence'],
  ['ai.tangle.tools', 'blueprint-agent'],
  ['id.tangle.tools', 'account'],
  ['docs.tangle.tools', 'docs'],
])

const installedDocuments = new WeakSet()
const ROOT_PATHS = new Set([
  '/',
  '/benchmarks',
  '/blog',
  '/brand-kit',
  '/privacy-policy',
  '/releases',
  '/research',
  '/security',
  '/status',
  '/sub-processors',
  '/terms-of-service',
])
const CONTENT_PATH = /^\/(?:benchmarks\/[a-z0-9][a-z0-9-]{0,79}|blog\/(?:series\/[a-z0-9][a-z0-9-]{0,79}|[a-z0-9][a-z0-9-]{0,79}))$/
// "token" is a normal term in static product slugs; unknown dynamic paths still fail closed below.
const SENSITIVE_PATH = /(?:@|\b(?:api[-_]?key|email|password|secret|user[-_]?id)\b)/i

function safeDimension(value) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[a-z][a-z0-9_-]{0,39}$/.test(normalized) ? normalized : undefined
}

function safePagePath(location) {
  const pathname = typeof location?.pathname === 'string' ? location.pathname : '/'
  let path = pathname.split(/[?#]/, 1)[0]
  try {
    path = decodeURIComponent(path)
    if (path.includes('%')) path = decodeURIComponent(path)
  } catch {
    return undefined
  }
  if (!path.startsWith('/') || path.includes('\\') || SENSITIVE_PATH.test(path)) return undefined
  const canonical = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (canonical.length > 200) return undefined
  return ROOT_PATHS.has(canonical) || CONTENT_PATH.test(canonical) ? canonical : undefined
}

function elementTagName(element) {
  return typeof element?.tagName === 'string' ? element.tagName.toLowerCase() : ''
}

function placementFromElement(element) {
  if (!element) return undefined

  if (typeof element.getAttribute === 'function') {
    const explicit = safeDimension(element.getAttribute('data-cta-placement'))
    if (explicit) return explicit
  }

  const tagName = elementTagName(element)
  if (tagName === 'header') return 'header'
  if (tagName === 'nav') return 'nav'
  if (tagName === 'footer') return 'footer'

  return undefined
}

function articlePlacement(anchor, article) {
  const articleChildren = Array.from(article?.children || [])
  const content = articleChildren.length === 1 ? articleChildren[0] : article
  const blocks = Array.from(content?.children || [])
  if (blocks.length < 2) return 'article'

  let block = anchor
  while (block?.parentElement && block.parentElement !== content) block = block.parentElement
  const index = blocks.indexOf(block)
  if (index < 0) return 'article'
  const progress = (index + 1) / blocks.length
  if (progress <= 0.25) return 'article-intro'
  if (progress > 0.75) return 'article-close'
  return 'article-body'
}

function findPlacement(anchor) {
  let element = anchor
  while (element) {
    const placement = placementFromElement(element)
    if (placement) return placement
    if (elementTagName(element) === 'article') return articlePlacement(anchor, element)
    element = element.parentElement
  }
  return undefined
}

function anchorFromTarget(target) {
  if (!target) return undefined
  if (typeof target.closest === 'function') return target.closest('a[href]') || undefined

  let element = target
  while (element) {
    if (elementTagName(element) === 'a' && typeof element.getAttribute === 'function' && element.getAttribute('href')) {
      return element
    }
    element = element.parentElement
  }
  return undefined
}

export function classifyDestination(href, baseHref = 'https://tangle.tools/') {
  if (typeof href !== 'string' || !href.trim()) return undefined

  let url
  try {
    url = new URL(href, baseHref)
  } catch {
    return undefined
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined

  const host = url.hostname.toLowerCase()
  const product = PRODUCT_ORIGINS.get(host)
  if (product) return { product, origin: url.origin }

  if (host === 'github.com' && !url.username && !url.password) {
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'tangle-network') {
      return { product: 'github', origin: url.origin }
    }
  }

  return undefined
}

export function buildCtaPayload({ anchor, location, body }) {
  if (!anchor || typeof anchor.getAttribute !== 'function') return undefined
  const href = anchor.getAttribute('href')
  const destination = classifyDestination(href, anchor.baseURI || 'https://tangle.tools/')
  if (!destination) return undefined

  const contentType = safeDimension(body?.getAttribute?.('data-content-type')) || 'page'
  if (!safePagePath(location)) return undefined
  return {
    content_type: contentType,
    link_url: destination.origin,
    link_id: findPlacement(anchor) || 'unknown',
  }
}

function runtimeFromGlobals() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined
  return { window, document }
}

function emitCtaEvent(runtime, payload) {
  const gtag = runtime.window?.gtag
  if (typeof gtag === 'function') {
    gtag('event', CTA_EVENT_NAME, payload)
    return
  }

  const dataLayer = Array.isArray(runtime.window?.dataLayer) ? runtime.window.dataLayer : []
  dataLayer.push(['event', CTA_EVENT_NAME, payload])
  runtime.window.dataLayer = dataLayer
}

export function installCtaCollector(runtime = runtimeFromGlobals()) {
  if (!runtime?.document || !runtime.window || installedDocuments.has(runtime.document)) return () => {}

  const seenEvents = new WeakSet()
  const onClick = (event) => {
    if (!event || seenEvents.has(event)) return
    seenEvents.add(event)
    const anchor = anchorFromTarget(event.target)
    const payload = buildCtaPayload({
      anchor,
      location: runtime.window.location,
      body: runtime.document.body,
    })
    if (payload) emitCtaEvent(runtime, payload)
  }
  const onAuxClick = (event) => {
    if (event?.button === 1) onClick(event)
  }

  installedDocuments.add(runtime.document)
  runtime.document.addEventListener('click', onClick, true)
  runtime.document.addEventListener('auxclick', onAuxClick, true)
  return () => {
    runtime.document.removeEventListener('click', onClick, true)
    runtime.document.removeEventListener('auxclick', onAuxClick, true)
    installedDocuments.delete(runtime.document)
  }
}

export { CTA_EVENT_NAME }

installCtaCollector()
