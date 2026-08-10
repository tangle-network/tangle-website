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

const INTERNAL_PRODUCT_PATHS = [
  ['/services/sandbox', 'sandbox'],
  ['/services/browser-agent', 'browser-agent'],
  ['/services/blueprint-agent', 'blueprint-agent'],
]

const installedDocuments = new WeakSet()

function safeDimension(value) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[a-z][a-z0-9_-]{0,39}$/.test(normalized) ? normalized : undefined
}

function safePagePath(location) {
  const pathname = typeof location?.pathname === 'string' ? location.pathname : '/'
  const path = pathname.split(/[?#]/, 1)[0]
  return path.startsWith('/') ? path.slice(0, 200) || '/' : '/'
}

function elementTagName(element) {
  return typeof element?.tagName === 'string' ? element.tagName.toLowerCase() : ''
}

function elementClassName(element) {
  if (typeof element?.className === 'string') return element.className
  return typeof element?.getAttribute === 'function' ? element.getAttribute('class') || '' : ''
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
  if (tagName === 'article') return 'article'

  if (tagName === 'section' || tagName === 'main') {
    const classNames = elementClassName(element).split(/\s+/).filter(Boolean)
    for (const className of classNames) {
      const placement = safeDimension(className)
      if (placement) return placement
    }
    if (typeof element.getAttribute === 'function') {
      const id = safeDimension(element.getAttribute('id'))
      if (id) return id
    }
  }

  return undefined
}

function findPlacement(anchor) {
  let element = anchor
  while (element) {
    const placement = placementFromElement(element)
    if (placement) return placement
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

function internalProduct(pathname) {
  const path = pathname.replace(/\/$/, '') || '/'
  for (const [prefix, product] of INTERNAL_PRODUCT_PATHS) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return product
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

  if (url.protocol !== 'https:') return undefined

  const host = url.hostname.toLowerCase()
  if (host === 'tangle.tools' || host === 'www.tangle.tools') {
    const product = internalProduct(url.pathname)
    if (!product) return undefined
    return { product, origin: url.origin }
  }

  const product = PRODUCT_ORIGINS.get(host)
  if (product) return { product, origin: url.origin }

  if (host === 'github.com' && !url.username && !url.password) {
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'tangle-network' && pathParts[1]) {
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
  const payload = {
    page_path: safePagePath(location),
    content_type: contentType,
    destination_product: destination.product,
    destination_origin: destination.origin,
  }
  const placement = findPlacement(anchor)
  if (placement) payload.placement = placement
  return payload
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

  installedDocuments.add(runtime.document)
  runtime.document.addEventListener('click', onClick, true)
  return () => {
    runtime.document.removeEventListener('click', onClick, true)
    installedDocuments.delete(runtime.document)
  }
}

export { CTA_EVENT_NAME }

installCtaCollector()
