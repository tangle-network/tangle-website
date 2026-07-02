#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const blogDir = path.join(root, 'src/content/blog')
const pagesDir = path.join(root, 'src/pages')
const args = process.argv.slice(2)
const json = args.includes('--json')
const reportIndex = args.indexOf('--report')
const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null

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

const templateHeadings = [
  'The Bottom Line',
  'What This Gets You',
  'What This Means',
  'What This Means for Builders',
  'Conclusion',
]

const tangleMechanisms = [
  'sandbox',
  'browser agent',
  'router',
  'blueprint',
  'x402',
  'tee',
  'operator',
  'proof',
  'manifest',
  'trace',
  'runtime',
  'hub',
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

function cleanValue(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => cleanValue(item))
      .filter(Boolean)
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null || value === '') return []
  return [value]
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
    } else {
      data[key] = cleanValue(rawValue)
    }
  }

  return { frontmatter, body: text.slice(match[0].length), data }
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

function addReason(reasons, category, severity, reason, fix) {
  reasons.push({ category, severity, reason, fix })
}

function wordCount(markdown) {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#[\]()*_>`|:-]/g, ' ')

  return (prose.match(/\b[\w'-]+\b/g) || []).length
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length
}

function firstWords(markdown, count) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#+\s+.+$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, count)
    .join(' ')
}

function extractHeadings(markdown) {
  return [...markdown.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1].trim())
}

function auditPost(file) {
  const text = fs.readFileSync(file, 'utf8')
  const { body, data } = parseFrontmatter(text)
  const reasons = []
  const title = data.title || path.basename(file, '.mdx')
  const first150 = firstWords(body, 150)
  const firstHalf = body.slice(0, Math.floor(body.length / 2)).toLowerCase()
  const headings = extractHeadings(body)
  const bodyWordCount = wordCount(body)
  const codeBlockCount = countMatches(body, /```/g) / 2
  const internalLinks = countMatches(body, /\]\(\/(blog|research|status|security|blueprints|agent|sandbox|router|images)\//g)
  const externalLinks = countMatches(body, /\]\(https?:\/\//g)
  const hasFaq = /^## FAQ\b/m.test(body)
  const hasBodyImage = /!\[[^\]]*]\(\/images\//.test(body) || /<img\b|<figure\b|<picture\b/.test(body)
  const hasTable = /^\|.+\|$/m.test(body)
  const hasCover = Boolean(data.coverImage || data.heroImage)
  const hasArtifact = hasBodyImage || hasTable || codeBlockCount > 0 || hasCover
  const hasBodyArtifact = hasBodyImage || hasTable
  const hasLimitations = /\b(limit|does not prove|doesn't prove|tradeoff|failure mode|risk|constraint|where .* breaks)\b/i.test(body)
  const hasDecisionClose = /\b(choose|deploy|test|verify|ship|start|use|avoid|measure|run|install|open|compare)\b/i.test(
    firstWords(body.split('\n').slice(-18).join('\n'), 220),
  )
  const hasTangleEarly = tangleMechanisms.some((mechanism) => firstHalf.includes(mechanism))
  const firstSectionDefinesObviousTerm = /\b(is|are)\s+(a|an|the)?\s*(protocol|platform|tool|system|method|way)\b/i.test(first150)
  const questionTargeted =
    /\b(vs|how|what|why|guide|checklist|deploy|deployment|production|pricing|scanner|testing|audit|sandbox|agent|x402)\b/i.test(
      `${title} ${data.summary || ''} ${asArray(data.tags).join(' ')}`,
    )

  if (bodyWordCount < 650) {
    addReason(
      reasons,
      'editorial',
      'warning',
      'Thin post: the reader may not get enough context, proof, or tradeoffs to trust the conclusion.',
      'Add the smallest missing concrete example, source trail, or decision criteria instead of padding.',
    )
  }

  if (questionTargeted && !hasFaq) {
    addReason(
      reasons,
      'seo-aeo',
      'warning',
      'Search/agent-targeted post has no FAQ section, so answer extraction and JSON-LD coverage are weaker.',
      'Add a short FAQ with question headings that match the reader query.',
    )
  }

  if (externalLinks === 0) {
    addReason(
      reasons,
      'evidence',
      'warning',
      'No external source links: claims are harder to verify outside Tangle-owned pages.',
      'Link primary docs, standards, repos, papers, or product references where the post depends on them.',
    )
  }

  if (internalLinks < 2 && bodyWordCount > 800) {
    addReason(
      reasons,
      'conversion',
      'warning',
      'Long post has fewer than two internal paths, so readers have weak next-step navigation.',
      'Link the most relevant Tangle product page, related post, status page, or blueprint.',
    )
  }

  if (!hasArtifact) {
    addReason(
      reasons,
      'presentation',
      'warning',
      'Markdown-only post with no cover, table, code, screenshot, or diagram-like artifact.',
      'Add a real artifact that helps the reader inspect the claim.',
    )
  }

  if (codeBlockCount >= 5 && !hasBodyArtifact) {
    addReason(
      reasons,
      'presentation',
      'warning',
      'Code-block heavy post has no body table, diagram, screenshot, or visual summary to orient the code.',
      'Add a compact table or diagram before the code-heavy section.',
    )
  }

  for (const heading of repeatedScaffoldHeadings) {
    if (body.includes(`## ${heading}`)) {
      addReason(
        reasons,
        'structure',
        'warning',
        `Repeated scaffold heading "${heading}" makes the post read like a template.`,
        'Rename the section around the reader decision or the specific failure mode.',
      )
    }
  }

  for (const heading of templateHeadings) {
    if (body.includes(`## ${heading}`)) {
      addReason(
        reasons,
        'structure',
        'warning',
        `Template heading "${heading}" weakens the ending or section shape.`,
        'Replace it with the concrete builder decision or operational claim.',
      )
    }
  }

  for (const phrase of bannedPhrases) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (body.match(pattern)) {
      addReason(
        reasons,
        'voice',
        'warning',
        `Weak or AI-cadence phrase "${phrase}" appears in the body.`,
        'Rewrite the sentence with the specific mechanism, risk, or proof path.',
      )
    }
  }

  if (/^(in this post|this post|this article)\b/i.test(first150)) {
    addReason(
      reasons,
      'reader-pressure',
      'warning',
      'Opening announces the post instead of starting from the reader pressure.',
      'Open with the decision, failure, trace, deployment risk, or product question.',
    )
  }

  if (firstSectionDefinesObviousTerm) {
    addReason(
      reasons,
      'reader-pressure',
      'notice',
      'Opening may define an obvious term before naming the live problem.',
      'Move the definition below the specific Tangle or operator pressure.',
    )
  }

  if (!hasTangleEarly && bodyWordCount > 900) {
    addReason(
      reasons,
      'tangle-proof',
      'warning',
      'Tangle-specific mechanism does not appear early enough for a long post.',
      'Move the product surface, endpoint, proof, manifest, or operator role into the first half.',
    )
  }

  if (!hasLimitations && bodyWordCount > 1000) {
    addReason(
      reasons,
      'evidence',
      'notice',
      'Long post does not clearly name a limitation, risk, or failure mode.',
      'Add one boundary: what the post does not prove, when the advice breaks, or what still needs verification.',
    )
  }

  if (!hasDecisionClose && bodyWordCount > 700) {
    addReason(
      reasons,
      'conversion',
      'notice',
      'Ending may summarize instead of giving a concrete decision or next action.',
      'Close with what the builder should test, deploy, choose, avoid, or verify.',
    )
  }

  const score = Math.max(
    0,
    100 -
      reasons.reduce((total, reason) => {
        if (reason.severity === 'warning') return total + 8
        if (reason.severity === 'notice') return total + 3
        return total
      }, 0),
  )

  return {
    file: relativeFile(file),
    title,
    slug: data.slug || path.basename(file, '.mdx'),
    series: data.series || 'Standalone',
    tags: asArray(data.tags),
    wordCount: bodyWordCount,
    codeBlocks: codeBlockCount,
    internalLinks,
    externalLinks,
    hasFaq,
    hasCover,
    hasBodyImage,
    hasTable,
    headings,
    score,
    reasons,
  }
}

function renderReport(summary) {
  const lines = [
    '# Blog Editorial Audit',
    '',
    `Audited ${summary.posts.length} posts against reader pressure, Tangle proof, SEO/AEO retrieval, evidence, voice, conversion, and presentation gates.`,
    '',
    '## Archive Findings',
    '',
    `- Errors: ${summary.errors}`,
    `- Warnings: ${summary.warnings}`,
    `- Notices: ${summary.notices}`,
    `- Series: ${Object.keys(summary.series).length}`,
    '',
    '## Highest Priority Posts',
    '',
  ]

  for (const post of [...summary.posts].sort((a, b) => a.score - b.score).slice(0, 20)) {
    lines.push(`- ${post.file} (${post.score}/100): ${post.reasons[0]?.reason || 'No major heuristic issue detected.'}`)
  }

  lines.push('', '## Per-Post Review', '')

  for (const post of summary.posts) {
    lines.push(`### ${post.title}`)
    lines.push('')
    lines.push(`- File: ${post.file}`)
    lines.push(`- Score: ${post.score}/100`)
    lines.push(`- Series: ${post.series}`)
    lines.push(
      `- Shape: ${post.wordCount} words, ${post.codeBlocks} code blocks, ${post.internalLinks} internal links, ${post.externalLinks} external links`,
    )

    if (post.reasons.length === 0) {
      lines.push('- Review: No blocking issue detected by the archive heuristics; manual review should still check novelty and factual freshness.')
    } else {
      for (const reason of post.reasons) {
        lines.push(`- ${reason.category}: ${reason.reason} Fix: ${reason.fix}`)
      }
    }

    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

const postFiles = listFiles(blogDir, (file) => file.endsWith('.mdx')).sort()
const findings = []
const series = new Map()
const tagCounts = new Map()
const posts = postFiles.map(auditPost)

for (const post of posts) {
  series.set(post.series, (series.get(post.series) || 0) + 1)
  for (const tag of post.tags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
}

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

  const post = posts.find((item) => item.file === relativeFile(file))
  for (const reason of post.reasons.filter((item) => item.severity === 'warning')) {
    if (reason.category === 'presentation' || reason.category === 'structure' || reason.category === 'voice' || reason.category === 'seo-aeo') {
      addFinding(findings, 'warning', file, reason.reason)
    }
  }

  const hasQuestionHeadings = /^###\s+.+\?/m.test(body)
  if (/^## FAQ\b/m.test(body) && !hasQuestionHeadings) {
    addFinding(findings, 'warning', file, 'FAQ section should use ### question headings for JSON-LD extraction')
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
  posts,
  series: Object.fromEntries([...series.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  tags: Object.fromEntries([...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  errors: findings.filter((finding) => finding.severity === 'error').length,
  warnings: findings.filter((finding) => finding.severity === 'warning').length,
  notices: posts.reduce((total, post) => total + post.reasons.filter((reason) => reason.severity === 'notice').length, 0),
  findings,
}

if (reportPath) {
  const absoluteReportPath = path.resolve(root, reportPath)
  fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true })
  fs.writeFileSync(absoluteReportPath, renderReport(summary))
}

if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`Blog audit: ${posts.length} posts, ${Object.keys(summary.series).length} series, ${summary.errors} errors, ${summary.warnings} warnings`)

  if (reportPath) console.log(`Report: ${reportPath}`)
  if (findings.length) console.log('')

  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.file}:${finding.line} - ${finding.message}`)
  }

  if (findings.length) console.log('')
  console.log(summary.errors ? 'NEEDS WORK' : 'PASS')
}

process.exit(summary.errors > 0 ? 1 : 0)
