#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const blogDir = path.join(root, 'src/content/blog')
const pagesDir = path.join(root, 'src/pages')
const json = process.argv.includes('--json')

const bannedPhrases = [
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
  'not just',
  'more than just',
  'at its core',
]

const repeatedScaffoldHeadings = [
  'The Object Being Optimized',
  'Evaluation Protocol',
  'Working Rule',
  'Source Trail',
]

function listFiles(dir, predicate) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...listFiles(full, predicate))
    else if (predicate(full)) files.push(full)
  }
  return files
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { frontmatter: '', body: text, data: {} }

  const frontmatter = match[1]
  const data = {}
  let currentArray = null

  for (const line of frontmatter.split('\n')) {
    const arrayItem = line.match(/^\s*-\s+(.+)$/)
    if (arrayItem && currentArray) {
      data[currentArray].push(cleanValue(arrayItem[1]))
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!pair) continue

    const [, key, rawValue] = pair
    currentArray = null

    if (!rawValue.trim()) {
      data[key] = []
      currentArray = key
    } else if (/^\d+$/.test(rawValue.trim())) {
      data[key] = Number(rawValue.trim())
    } else if (rawValue.trim() === 'true' || rawValue.trim() === 'false') {
      data[key] = rawValue.trim() === 'true'
    } else if (/^\[.*]$/.test(rawValue.trim())) {
      data[key] = rawValue
        .trim()
        .slice(1, -1)
        .split(',')
        .map((item) => cleanValue(item))
        .filter(Boolean)
    } else {
      data[key] = cleanValue(rawValue)
    }
  }

  return { frontmatter, body: text.slice(match[0].length), data }
}

function cleanValue(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function relativeFile(file) {
  return path.relative(root, file)
}

function lineOf(text, needle) {
  const index = text.indexOf(needle)
  if (index < 0) return 1
  return text.slice(0, index).split('\n').length
}

function imageExists(image) {
  if (!image?.startsWith('/images/')) return true
  return fs.existsSync(path.join(root, 'public', image.slice(1)))
}

function addFinding(findings, severity, file, message, needle, text) {
  findings.push({
    severity,
    file: relativeFile(file),
    line: needle && text ? lineOf(text, needle) : 1,
    message,
  })
}

const postFiles = listFiles(blogDir, (file) => file.endsWith('.mdx')).sort()
const findings = []
const series = new Map()
const tagCounts = new Map()

for (const file of postFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const { body, data } = parseFrontmatter(text)
  const required = ['title', 'slug', 'summary', 'date', 'author', 'tags']

  for (const field of required) {
    if (data[field] === undefined || data[field] === '') {
      addFinding(findings, 'error', file, `Missing frontmatter field: ${field}`)
    }
  }

  if (data.slug && `${data.slug}.mdx` !== path.basename(file)) {
    addFinding(findings, 'warning', file, `Slug does not match filename: ${data.slug}`)
  }

  for (const imageField of ['coverImage', 'heroImage']) {
    if (data[imageField] && !imageExists(data[imageField])) {
      addFinding(findings, 'error', file, `${imageField} does not exist: ${data[imageField]}`)
    }
  }

  const postSeries = data.series || 'Standalone'
  series.set(postSeries, (series.get(postSeries) || 0) + 1)
  for (const tag of data.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)

  const hasBodyImage = /!\[[^\]]*]\(\/images\//.test(body) || /<img\b|<figure\b|<picture\b/.test(body)
  const hasCode = /```/.test(body)
  const hasTable = /^\|.+\|$/m.test(body)
  const hasCover = Boolean(data.coverImage || data.heroImage)
  if (!hasBodyImage && !hasCode && !hasTable && !hasCover) {
    addFinding(findings, 'warning', file, 'No visible artifact: add a cover, diagram, table, code block, or screenshot')
  }

  const codeBlockCount = (body.match(/```/g) || []).length / 2
  if (codeBlockCount >= 5 && !hasBodyImage && !hasTable) {
    addFinding(findings, 'warning', file, 'Code-block heavy post without a visual or table artifact')
  }

  for (const heading of repeatedScaffoldHeadings) {
    if (body.includes(`## ${heading}`)) {
      addFinding(findings, 'warning', file, `Repeated scaffold heading: ${heading}`, heading, text)
    }
  }

  for (const phrase of bannedPhrases) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    const match = body.match(pattern)
    if (match) {
      addFinding(findings, 'warning', file, `Weak or AI-cadence phrase: "${phrase}"`, match[0], text)
    }
  }
}

for (const file of listFiles(pagesDir, (item) => item.endsWith('.astro'))) {
  const text = fs.readFileSync(file, 'utf8')
  const countPatterns = [
    /posts\.length\s*\}\s*published/,
    /\b\d+\s+blog posts\b/i,
    /\b\d+\s+posts\b/i,
    /\bpublished\s+posts\b/i,
  ]
  for (const pattern of countPatterns) {
    const match = text.match(pattern)
    if (match) {
      addFinding(findings, 'error', file, 'Do not market raw blog volume; organize by reader path instead', match[0], text)
    }
  }
}

const summary = {
  posts: postFiles.length,
  series: Object.fromEntries([...series.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  tags: Object.fromEntries([...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  errors: findings.filter((finding) => finding.severity === 'error').length,
  warnings: findings.filter((finding) => finding.severity === 'warning').length,
  findings,
}

if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`Blog audit: ${summary.posts} posts, ${Object.keys(summary.series).length} series, ${summary.errors} errors, ${summary.warnings} warnings`)
  console.log('')
  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.file}:${finding.line} - ${finding.message}`)
  }
  if (findings.length) console.log('')
  console.log(summary.errors ? 'NEEDS WORK' : 'PASS')
}

process.exit(summary.errors > 0 ? 1 : 0)
