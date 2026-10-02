import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let sharpPath
try {
  sharpPath = require.resolve('sharp')
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error
  const astroRequire = createRequire(require.resolve('astro/package.json'))
  sharpPath = astroRequire.resolve('sharp')
}
const sharp = require(sharpPath)
const root = new URL('../../', import.meta.url)

const poster = await sharp(await readFile(new URL('public/images/brand/knot-poster.webp', root)))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png()
  .toBuffer()
const logo = await readFile(new URL('public/brand/tangle-logo-light.svg', root))
const template = await readFile(new URL('scripts/og/og-tangle.svg', root), 'utf8')
const svg = template
  .replace('{{poster}}', `data:image/png;base64,${poster.toString('base64')}`)
  .replace('{{logo}}', `data:image/svg+xml;base64,${logo.toString('base64')}`)
const output = new URL('public/images/og-tangle.png', root)

await writeFile(output, await sharp(Buffer.from(svg)).png().toBuffer())
console.log(`Rendered ${output.pathname}`)
