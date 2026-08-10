import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import { buildCtaPayload, classifyDestination } from '../src/scripts/cta-observability.mjs'

const ROOT = resolve(process.cwd(), 'dist/client')

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await htmlFiles(path))
    } else if (entry.isFile() && entry.name === 'index.html') {
      files.push(path)
    }
  }
  return files
}

function pagePath(file) {
  const relativePath = relative(ROOT, file).replaceAll('\\', '/')
  const directory = relativePath === 'index.html' ? '' : relativePath.slice(0, -'/index.html'.length)
  return directory ? `/${directory}` : '/'
}

function contentType(html) {
  return html.match(/\bdata-content-type="([^"]+)"/)?.[1]
}

try {
  const files = await htmlFiles(ROOT)
  if (!files.length) throw new Error(`no built pages found at ${ROOT}`)
  let productLinks = 0
  const rejected = []
  const pagesWithProductLinks = new Set()

  for (const file of files) {
    const html = await readFile(file, 'utf8')
    const path = pagePath(file)
    const body = { getAttribute: (name) => name === 'data-content-type' ? contentType(html) : null }
    for (const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
      const href = match[1]
      if (!classifyDestination(href, `https://tangle.tools${path}`)) continue
      productLinks += 1
      pagesWithProductLinks.add(path)
      const payload = buildCtaPayload({
        anchor: {
          baseURI: `https://tangle.tools${path}`,
          getAttribute: (name) => name === 'href' ? href : null,
        },
        location: { pathname: path },
        body,
      })
      if (!payload) rejected.push(`${path} -> ${href}`)
    }
  }

  if (!productLinks) throw new Error(`no product links found in ${files.length} built pages`)
  console.log(`pages=${files.length} pages_with_product_links=${pagesWithProductLinks.size} product_links=${productLinks} rejected=${rejected.length}`)
  if (rejected.length) {
    console.error(rejected.join('\n'))
    process.exitCode = 1
  }
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error(`✗ built site not found at ${ROOT}; run \`pnpm build\` first.`)
  } else {
    console.error(error)
  }
  process.exitCode = 1
}
