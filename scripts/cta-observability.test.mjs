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
    this.listeners = new Set()
  }

  addEventListener(type, listener) {
    if (type === 'click') this.listeners.add(listener)
  }

  removeEventListener(type, listener) {
    if (type === 'click') this.listeners.delete(listener)
  }

  dispatch(event) {
    for (const listener of this.listeners) listener(event)
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
  assert.equal(classifyDestination('https://github.com/other-org/tangle'), undefined)
  assert.equal(classifyDestination('https://github.com/tangle-network.evil/tangle'), undefined)
  assert.equal(classifyDestination('https://user@github.com/tangle-network/tangle'), undefined)
  assert.equal(classifyDestination('https://github.com:444/tangle-network/tangle'), undefined)
  assert.equal(classifyDestination('javascript:alert(1)'), undefined)
})

test('homepage CTA emits one privacy-safe event with product dimensions', () => {
  const section = node('section', { class: 'hero-section' })
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
      page_path: '/',
      content_type: 'page',
      destination_product: 'sandbox',
      destination_origin: 'https://sandbox.tangle.tools',
      placement: 'hero-section',
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
    page_path: '/blog/agent-runtime',
    content_type: 'blog',
    destination_product: 'docs',
    destination_origin: 'https://docs.tangle.tools',
    placement: 'article',
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
