#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const blogDir = path.join(root, 'src/content/blog')
const args = process.argv.slice(2)
const json = args.includes('--json')
const reportIndex = args.indexOf('--report')
const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null

const nativeTerms = [
  'AgentProfile',
  'CodeTraceBench',
  'MCP',
  'RLM',
  'TEE',
  'F1',
  'agent runtime',
  'bridge',
  'blueprint',
  'harness',
  'operator',
  'trace',
  'worker',
  'x402',
]

const debrisPatterns = [
  /```[\s\S]*\b(?:git|npm|pnpm|curl|sed|awk|rg|grep|cat)\b/i,
  /\b(?:git show|git log|git diff|npm view|pnpm (?:run|check|build)|curl -|sed -n|awk |rg |grep )/i,
  /(?:^|[\s`])(?:src|apps|packages)\/[A-Za-z0-9_.\-/]+/m,
  /\b[0-9a-f]{40}\b/i,
]

const problemWords = /\b(?:problem|failure|failed|wrong|why|when|need|risk|cost|challenge|question|decision|tradeoff|break|missing|cannot|can't)\b/i
const definitionWords = /\b(?:is a|is an|means|refers to|defined as|we call|in plain language|in other words|stands for)\b/i
const decisionWords = /\b(?:choose|use|avoid|test|measure|compare|decide|should|do not|don't|next)\b/i
const evidenceWords = /\b(?:measured|benchmark|result|source|report|table|sample|n\s*=|completed|cost|percent|%)\b/i

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(full)
    return entry.name.endsWith('.mdx') ? [full] : []
  })
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { data: {}, body: text }
  const data = {}
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!pair) continue
    data[pair[1]] = pair[2].replace(/^['"]|['"]$/g, '').trim()
  }
  return { data, body: text.slice(match[0].length) }
}

function plain(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(text) {
  return plain(text).split(/\s+/).filter(Boolean)
}

function firstParagraph(body) {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('---')) || ''
}

function firstWindow(body) {
  return words(body).slice(0, 250).join(' ')
}

function nativeTermsInOpening(opening) {
  return nativeTerms.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
    const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(opening)
    if (!match) return false
    const sentenceStart = Math.max(
      opening.lastIndexOf('.', match.index),
      opening.lastIndexOf('!', match.index),
      opening.lastIndexOf('?', match.index),
    ) + 1
    const sentenceEndMatch = opening.slice(match.index).search(/[.!?]/)
    const sentenceEnd = sentenceEndMatch < 0 ? opening.length : match.index + sentenceEndMatch
    const sentence = opening.slice(sentenceStart, sentenceEnd)
    const termOffset = match.index - sentenceStart
    const afterTerm = sentence.slice(termOffset + match[0].length)
    const beforeTerm = sentence.slice(0, termOffset)
    const definedAfter = /\b(?:is|means|refers to|stands for|describes)\b/i.test(afterTerm)
      || /^\s*,?\s*(?:a|an|the)\b/i.test(afterTerm)
    const definedBefore = /\b(?:called|call|known as)\s+(?:a|an|the)?\s*$/i.test(beforeTerm)
    return !(definedAfter || definedBefore)
  })
}

function scorePost(file) {
  const text = fs.readFileSync(file, 'utf8')
  const { data, body } = parseFrontmatter(text)
  const opening = firstWindow(body)
  const first = plain(firstParagraph(body))
  const bodyWithoutLinks = body.replace(/https?:\/\/[^\s)]+/g, ' ')
  const headingCount = (body.match(/^#{2,3}\s+/gm) || []).length
  const externalLinks = (body.match(/https?:\/\//g) || []).length
  const internalLinks = (body.match(/\]\(\/(?!\/)/g) || []).length
  const codeBlocks = (body.match(/```/g) || []).length / 2
  const debris = debrisPatterns.filter((pattern) => pattern.test(bodyWithoutLinks)).map((pattern) => pattern.source)
  const nativeOpening = nativeTermsInOpening(opening)
  const hasProblem = problemWords.test(opening)
  const hasDefinition = definitionWords.test(opening) || /\b(?:is|means|refers to|stands for|describes)\b/i.test(opening)
  const hasEvidence = evidenceWords.test(body) || externalLinks > 0 || /^\|.+\|$/m.test(body)
  const ending = plain(body).slice(-1800)
  const hasDecision = decisionWords.test(ending) || /\b(?:practical decision|what .* should|recommend|where .* does not apply|expose|preserve)\b/i.test(ending)
  const scores = {
    readerProblem: hasProblem ? 4 : 1,
    singleStory: headingCount >= 3 && first.length > 100 ? 3 : 1,
    definitions: hasDefinition ? 3 : 1,
    jargonControl: nativeOpening.length === 0 ? 4 : Math.max(0, 4 - nativeOpening.length),
    evidence: hasEvidence ? 4 : 1,
    measurementHonesty: /(?:n\s*=|\/\d+|completed|denominator|limitation|limit|does not prove|not reported)/i.test(body) ? 4 : 2,
    productBoundaries: /(?:source|package|published|hosted|protocol|not yet|does not)/i.test(body) ? 3 : 1,
    readerDecision: hasDecision ? 3 : 1,
    prose: /\b(?:delve|leverage|utilize|robust|seamless|at its core|in today's world|let's dive)\b/i.test(body) ? 1 : 3,
    structure: headingCount >= 4 && (body.match(/^\|.+\|$/gm) || []).length <= 40 ? 3 : 1,
  }
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const hardRejects = []
  if (debris.length) hardRejects.push('repository-debris')
  if (!hasProblem) hardRejects.push('no-reader-problem-in-opening')
  if (nativeOpening.length >= 2 && !hasDefinition) hardRejects.push('native-jargon-before-definition')
  if (!hasEvidence) hardRejects.push('no-visible-evidence')
  if (!hasDecision) hardRejects.push('no-reader-decision')

  return {
    file: path.relative(root, file),
    title: data.title || path.basename(file, '.mdx'),
    series: data.series || 'Standalone',
    score: total,
    hardRejects,
    firstParagraph: first,
    nativeOpening,
    debris,
    wordCount: words(body).length,
    headings: headingCount,
    codeBlocks,
    externalLinks,
    internalLinks,
    scores,
  }
}

function renderReport(posts) {
  const hard = posts.filter((post) => post.hardRejects.length)
  const lines = [
    '# Zero-Context Blog Triage',
    '',
    `This is a deterministic triage of ${posts.length} posts using the [blog quality rubric](https://github.com/tangle-network/dotfiles/blob/main/docs/rubrics/blog-quality.md).`,
    'It is not a semantic approval; every hard reject requires a human rewrite review.',
    '',
    `- Hard rejects: ${hard.length}`,
    `- Repository-debris findings: ${posts.filter((post) => post.hardRejects.includes('repository-debris')).length}`,
    `- Missing reader problem: ${posts.filter((post) => post.hardRejects.includes('no-reader-problem-in-opening')).length}`,
    `- Missing reader decision: ${posts.filter((post) => post.hardRejects.includes('no-reader-decision')).length}`,
    '',
    '## Priority order',
    '',
  ]
  for (const post of [...posts].sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))) {
    lines.push(`- ${post.score}/40 — ${post.series} — [${post.title}](/blog/${post.file.replace(/^src\/content\/blog\//, '').replace(/\.mdx$/, '')}) — ${post.hardRejects.join(', ') || 'manual review'}`)
  }
  lines.push('', '## Per-post evidence', '')
  for (const post of posts) {
    lines.push(`### ${post.title}`)
    lines.push('')
    lines.push(`- File: ${post.file}`)
    lines.push(`- Series: ${post.series}`)
    lines.push(`- Triage score: ${post.score}/40`)
    lines.push(`- Hard rejects: ${post.hardRejects.join(', ') || 'none detected'}`)
    lines.push(`- Native terms in opening: ${post.nativeOpening.join(', ') || 'none detected'}`)
    lines.push(`- Repository debris: ${post.debris.length ? 'detected' : 'none detected'}`)
    lines.push(`- Shape: ${post.wordCount} words, ${post.headings} headings, ${post.codeBlocks} code blocks, ${post.externalLinks} external links, ${post.internalLinks} internal links`)
    lines.push(`- Opening: ${post.firstParagraph}`)
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

const posts = listFiles(blogDir).sort().map(scorePost)
const output = { posts, summary: {
  posts: posts.length,
  hardRejects: posts.filter((post) => post.hardRejects.length).length,
  repositoryDebris: posts.filter((post) => post.hardRejects.includes('repository-debris')).length,
  missingReaderProblem: posts.filter((post) => post.hardRejects.includes('no-reader-problem-in-opening')).length,
  missingReaderDecision: posts.filter((post) => post.hardRejects.includes('no-reader-decision')).length,
}}

if (reportPath) fs.writeFileSync(path.resolve(root, reportPath), renderReport(posts))
if (json) console.log(JSON.stringify(output, null, 2))
else console.log(`Reader triage: ${posts.length} posts, ${output.summary.hardRejects} hard rejects`)

process.exit(0)
