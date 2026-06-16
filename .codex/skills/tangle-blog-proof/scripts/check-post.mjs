#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]

if (!file) {
  console.error('Usage: node .codex/skills/tangle-blog-proof/scripts/check-post.mjs src/content/blog/<slug>.mdx')
  process.exit(2)
}

const text = fs.readFileSync(file, 'utf8')
const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

function warn(message) {
  warnings.push(message)
}

const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n/)
if (!frontmatterMatch) {
  fail('Missing YAML frontmatter')
}

const frontmatter = frontmatterMatch?.[1] ?? ''
const body = text.slice(frontmatterMatch?.[0].length ?? 0)
const requiredFields = ['title', 'slug', 'summary', 'date', 'author', 'tags']

for (const field of requiredFields) {
  if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) {
    fail(`Missing frontmatter field: ${field}`)
  }
}

const slug = frontmatter.match(/^slug:\s*['"]?([^'"\n]+)['"]?/m)?.[1]
const firstWords = body
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
  .replace(/\[[^\]]+]\([^)]+\)/g, '$1')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 150)
  .join(' ')

const internalLinks = [...body.matchAll(/\]\((\/(?:blog|services|overview|developers|operators|stake)[^)#\s]*)/g)].map((match) => match[1])
const externalLinks = [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1])
const codeBlocks = (body.match(/```/g) ?? []).length / 2
const proofPatterns = [
  /\bcurl\b/,
  /\bnpm install\b/,
  /\bpnpm\b/,
  /\bbad run\b/,
  /\.well-known\/tangle-agent\.json/,
  /\/v1\/models/,
  /\/health/,
  /TANGLE_API_KEY/,
  /```(?:bash|sh|typescript|json|http)?/i,
]

if (firstWords.length < 240) {
  warn('Opening answer capsule may be too thin for AEO')
}

if (!proofPatterns.some((pattern) => pattern.test(body)) && codeBlocks === 0) {
  fail('Missing proof block: add an exact curl/install/CLI/API/manifest/code block')
}

if (internalLinks.length < 2) {
  warn(`Only ${internalLinks.length} internal Tangle link(s); agent-intent posts should have at least 2`)
}

if (externalLinks.length < 3) {
  warn(`Only ${externalLinks.length} external link(s); standards/competitor posts usually need at least 3 primary sources`)
}

if (!/^## FAQ\s*$/m.test(body)) {
  warn('Missing ## FAQ section')
} else if (!/^### .+\?\s*$/m.test(body)) {
  warn('FAQ exists but no ### question headings were found')
}

if (!/(CTA|Get started|Start|Install|Read|Call|Run|Use|Try)\b/i.test(body)) {
  warn('No obvious direct CTA')
}

const banned = [
  'delve',
  'comprehensive',
  'facilitate',
  'utilizing',
  'moreover',
  'furthermore',
  'landscape',
  'crucial',
  'paradigm',
  "let's dive in",
  "here's the thing",
  'turns out',
]

for (const phrase of banned) {
  if (new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(body)) {
    warn(`Banned or weak phrase found: "${phrase}"`)
  }
}

for (const image of [...body.matchAll(/!\[[^\]]*]\((\/images\/[^)]+)\)/g)].map((match) => match[1])) {
  const imagePath = path.join(process.cwd(), 'public', image.replace(/^\/images\//, 'images/'))
  if (!fs.existsSync(imagePath)) {
    fail(`Referenced image does not exist: ${image}`)
  }
}

for (const field of ['coverImage', 'heroImage']) {
  const image = frontmatter.match(new RegExp(`^${field}:\\s*['"]?([^'"\n]+)['"]?`, 'm'))?.[1]
  if (image?.startsWith('/images/')) {
    const imagePath = path.join(process.cwd(), 'public', image.replace(/^\/images\//, 'images/'))
    if (!fs.existsSync(imagePath)) {
      fail(`${field} does not exist: ${image}`)
    }
  }
}

console.log(`Checked ${file}${slug ? ` (${slug})` : ''}`)

if (errors.length) {
  console.log('\nErrors:')
  for (const error of errors) console.log(`- ${error}`)
}

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}

if (!errors.length && !warnings.length) {
  console.log('\nPASS')
} else if (!errors.length) {
  console.log('\nPASS with warnings')
} else {
  console.log('\nNEEDS WORK')
}

process.exit(errors.length ? 1 : 0)
