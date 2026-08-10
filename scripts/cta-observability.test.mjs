import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCtaPayload,
  classifyDestination,
  installCtaCollector,
} from '../src/scripts/cta-observability.mjs'

class FakeDocument {
  constructor(body) {
    this.body = body
    this.listeners = new Map()
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(listener)
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(event, type = 'click') {
    for (const listener of this.listeners.get(type) || []) listener(event)
  }
}

function node(tagName, attributes = {}, parentElement = undefined) {
  return {
    tagName,
    parentElement,
    baseURI: 'https://www.tangle.tools/',
    className: attributes.class || '',
    getAttribute(name) {
      return attributes[name] ?? null
    },
    closest(selector) {
      if (selector === 'a[href]' && tagName.toLowerCase() === 'a' && attributes.href) return this
      return undefined
    },
  }
}

test('classifies only fixed Tangle product origins and drops query data', () => {
  assert.deepEqual(
    classifyDestination('https://sandbox.tangle.tools/start?email=secret@example.test'),
    { product: 'sandbox', origin: 'https://sandbox.tangle.tools' },
  )
  assert.equal(classifyDestination('https://evil.tangle.tools/start'), undefined)
  assert.equal(classifyDestination('https://user@sandbox.tangle.tools/start'), undefined)
  assert.equal(classifyDestination('https://sandbox.tangle.tools:444/start'), undefined)
  assert.equal(classifyDestination('/services/sandbox'), undefined)
  assert.deepEqual(
    classifyDestination('https://github.com/tangle-network/tangle?email=secret@example.test'),
    { product: 'github', origin: 'https://github.com' },
  )
  assert.deepEqual(
    classifyDestination('https://github.com/tangle-network'),
    { product: 'github', origin: 'https://github.com' },
  )
  assert.equal(classifyDestination('https://github.com/other-org/tangle'), undefined)
  assert.equal(classifyDestination('https://github.com/tangle-network.evil/tangle'), undefined)
  assert.equal(classifyDestination('https://user@github.com/tangle-network/tangle'), undefined)
  assert.equal(classifyDestination('https://github.com:444/tangle-network/tangle'), undefined)
  assert.equal(classifyDestination('javascript:alert(1)'), undefined)
})

test('homepage CTA emits one privacy-safe event with standard GA dimensions', () => {
  const section = node('section', { class: 'flex hero-section', 'data-cta-placement': 'hero' })
  const anchor = node('a', { href: 'https://sandbox.tangle.tools/?user_id=42' }, section)
  const body = node('body', { 'data-content-type': 'page' })
  const calls = []
  const runtime = {
    window: {
      location: { pathname: '/' },
      gtag: (...args) => calls.push(args),
    },
    document: new FakeDocument(body),
  }
  const uninstall = installCtaCollector(runtime)
  const event = { target: anchor }
  runtime.document.dispatch(event)
  runtime.document.dispatch(event)
  uninstall()

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], [
    'event',
    'tangle_cta_click',
    {
      content_type: 'page',
      link_url: 'https://sandbox.tangle.tools',
      link_id: 'hero',
    },
  ])
  assert.equal(JSON.stringify(calls).includes('user_id'), false)
})

test('blog CTA emits one event and excludes query, text, and PII', () => {
  const article = node('article')
  const anchor = node('a', { href: 'https://docs.tangle.tools/guide?utm_email=secret@example.test' }, article)
  const body = node('body', { 'data-content-type': 'blog' })
  const calls = []
  const runtime = {
    window: {
      location: { pathname: '/blog/agent-runtime?email=secret@example.test' },
      gtag: (...args) => calls.push(args),
    },
    document: new FakeDocument(body),
  }
  const uninstall = installCtaCollector(runtime)
  runtime.document.dispatch({ target: anchor })
  uninstall()

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0][2], {
    content_type: 'blog',
    link_url: 'https://docs.tangle.tools',
    link_id: 'article',
  })
  assert.equal(JSON.stringify(calls).includes('secret@example.test'), false)
})

test('installing twice on one document does not duplicate listeners', () => {
  const anchor = node('a', { href: 'https://router.tangle.tools' })
  const calls = []
  const runtime = {
    window: {
      location: { pathname: '/blog' },
      gtag: (...args) => calls.push(args),
    },
    document: new FakeDocument(node('body', { 'data-content-type': 'blog' })),
  }
  const first = installCtaCollector(runtime)
  const second = installCtaCollector(runtime)
  runtime.document.dispatch({ target: anchor })
  first()
  second()
  assert.equal(calls.length, 1)
})

test('drops dynamic and encoded identifier paths before emission', () => {
  const anchor = node('a', { href: 'https://docs.tangle.tools' })
  const body = node('body', { 'data-content-type': 'page' })
  for (const pathname of [
    '/account/alice@example.com',
    '/account/12345',
    '/users/opaque-token-abc123',
    '/blog/alice%2540example.com',
    '/blog/reset-token-secret',
  ]) {
    assert.equal(buildCtaPayload({ anchor, location: { pathname }, body }), undefined)
  }
})

test('allows a legitimate static slug containing token', () => {
  const anchor = node('a', { href: 'https://docs.tangle.tools' })
  const payload = buildCtaPayload({
    anchor,
    location: { pathname: '/blog/pricing-without-hand-waving-wei-token-conversion-markup-dynamic-price-tags' },
    body: node('body', { 'data-content-type': 'blog' }),
  })
  assert.deepEqual(payload, {
    content_type: 'blog',
    link_url: 'https://docs.tangle.tools',
    link_id: 'unknown',
  })
})

test('uses only explicit or semantic placement values', () => {
  const main = node('main', { class: 'flex-1 max-w-3xl' })
  const anchor = node('a', { href: 'https://docs.tangle.tools' }, main)
  const payload = buildCtaPayload({
    anchor,
    location: { pathname: '/' },
    body: node('body', { 'data-content-type': 'page' }),
  })
  assert.deepEqual(payload, {
    content_type: 'page',
    link_url: 'https://docs.tangle.tools',
    link_id: 'unknown',
  })
})

test('classifies article links by structural reading position', () => {
  const article = node('article')
  const content = node('div', {}, article)
  const blocks = Array.from({ length: 4 }, () => node('p', {}, content))
  const anchor = node('a', { href: 'https://docs.tangle.tools' }, blocks[3])
  article.children = [content]
  content.children = blocks
  const payload = buildCtaPayload({
    anchor,
    location: { pathname: '/blog/agent-runtime' },
    body: node('body', { 'data-content-type': 'blog' }),
  })
  assert.equal(payload.link_id, 'article-close')
})

test('captures nested targets and dataLayer-only middle clicks', () => {
  const footer = node('footer')
  const anchor = node('a', { href: 'https://github.com/tangle-network' }, footer)
  const child = { tagName: 'span', parentElement: anchor, getAttribute: () => null }
  const runtime = {
    window: { location: { pathname: '/releases' }, dataLayer: [] },
    document: new FakeDocument(node('body', { 'data-content-type': 'page' })),
  }
  const uninstall = installCtaCollector(runtime)
  runtime.document.dispatch({ target: child, button: 1 }, 'auxclick')
  runtime.document.dispatch({ target: child, button: 2 }, 'auxclick')
  uninstall()

  assert.deepEqual(runtime.window.dataLayer, [[
    'event',
    'tangle_cta_click',
    {
      content_type: 'page',
      link_url: 'https://github.com',
      link_id: 'footer',
    },
  ]])
})
