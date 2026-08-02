#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const blogDir = path.join(root, 'src/content/blog')
const searchTargets = JSON.parse(fs.readFileSync(path.join(root, 'scripts/blog-search-targets.json'), 'utf8'))
const queryOwnerCounts = Object.values(searchTargets).reduce((counts, query) => {
  counts[query] = (counts[query] || 0) + 1
  return counts
}, {})
const sharedPrimaryQueries = new Set(Object.entries(queryOwnerCounts).filter(([, count]) => count > 1).map(([query]) => query))
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

const stylePatterns = [
  ['throat-clearing', /\b(?:here'?s what|here'?s why|here'?s the|at its core|it'?s worth noting|let'?s dive|let'?s unpack|the bottom line|make no mistake)\b/i],
  ['inflated-adjective', /\b(?:seamless|robust|powerful|comprehensive|cutting-edge|state-of-the-art|groundbreaking|revolutionary|game-changing|world-class|best-in-class|next-generation)\b/i],
  ['jargon', /\b(?:landscape|paradigm|synergy|holistic|delve|unlock|showcase|leverage)\b/i],
  ['negative-parallelism', /\b(?:not just|more than just|not merely|isn'?t just|is not just|not only)\b/i],
  ['weak-softener', /\b(?:just|simply|actually|basically|really|very|extremely|generally|typically|easily)\b/i],
  ['em-dash', /—/],
]

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

const queryStopWords = new Set(['a', 'an', 'and', 'for', 'from', 'how', 'in', 'of', 'on', 'the', 'to', 'vs', 'with'])

function queryOverlap(query, text) {
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token && !queryStopWords.has(token))
  if (!tokens.length) return 0
  const lower = text.toLowerCase()
  return tokens.filter((token) => lower.includes(token)).length / tokens.length
}

function discoveryStatus(post) {
  if (!post.targetQuery) return 'S0 — no query owner'
  if (post.discoveryScore < 14) return 'S1 — rewrite search surface'
  if (post.discoveryScore < 18) return 'S2 — revise search surface'
  return 'S3 — check live search'
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
  const filename = path.basename(file)
  const targetQuery = searchTargets[filename] || ''
  const description = data.description || data.summary || data.excerpt || ''
  const opening = firstWindow(body)
  const first = plain(firstParagraph(body))
  const bodyWithoutLinks = body.replace(/https?:\/\/[^\s)]+/g, ' ')
  const prose = plain(body)
  const headingCount = (body.match(/^#{2,3}\s+/gm) || []).length
  const tableRows = (body.match(/^\|.+\|$/gm) || []).length
  const externalLinks = (body.match(/https?:\/\//g) || []).length
  const internalLinks = (body.match(/\]\(\/(?!\/)/g) || []).length
  const codeBlocks = (body.match(/```/g) || []).length / 2
  const debris = debrisPatterns.filter((pattern) => pattern.test(bodyWithoutLinks)).map((pattern) => pattern.source)
  const nativeOpening = nativeTermsInOpening(opening)
  const nativeCount = nativeTerms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
    return count + (prose.match(new RegExp(`\\b${escaped}\\b`, 'gi')) || []).length
  }, 0)
  const definitions = (prose.match(new RegExp(definitionWords.source, 'gi')) || []).length
  const styleFindings = stylePatterns.filter(([, pattern]) => pattern.test(prose)).map(([name]) => name)
  const hasProblem = problemWords.test(opening)
  const hasQuestion = /\?|\b(?:why|when|how|what if|should)\b/i.test(opening)
  const hasDefinition = definitions > 0
  const hasEvidence = evidenceWords.test(body) || externalLinks > 0 || internalLinks > 0 || tableRows > 0 || codeBlocks > 0
  const hasNumbers = /\b\d+(?:\.\d+)?\s*(?:%|percent|x|×|pp|ms|seconds?|minutes?|hours?|dollars?|USD|ETH|wei)?\b/i.test(prose)
  const hasMeasurementConditions = /(?:n\s*=|out of|per \d+|sample|attempts?|trials?|baseline|control|version|date|limit|limitation|not measured|not reported|does not prove|completed)/i.test(prose)
  const ending = plain(body).slice(-1800)
  const hasDecision = decisionWords.test(ending) || /\b(?:practical decision|what .* should|recommend|where .* does not apply|expose|preserve)\b/i.test(ending)
  const titleOverlap = targetQuery ? queryOverlap(targetQuery, data.title || '') : 0
  const openingOverlap = targetQuery ? queryOverlap(targetQuery, opening) : 0
  const discoveryChecks = {
    queryOwnership: targetQuery ? 4 : 0,
    titleSnippet: !description ? 0 : description.length <= 160 && titleOverlap >= 0.5 ? 4 : description.length <= 160 ? 3 : 1,
    answerClarity: openingOverlap >= 0.75 && hasProblem && hasDefinition ? 4 : openingOverlap >= 0.5 && hasProblem ? 3 : openingOverlap > 0 ? 2 : 1,
    evidenceEntities: hasEvidence && (externalLinks > 0 || internalLinks >= 2) ? 4 : hasEvidence ? 3 : 1,
    technicalDiscovery: data.title && data.date && data.tags && (internalLinks > 0 || externalLinks > 0) ? 4 : data.title && data.date && data.tags ? 3 : 1,
  }
  const discoveryScore = Object.values(discoveryChecks).reduce((sum, value) => sum + value, 0)
  const discoveryIssues = []
  if (!targetQuery) discoveryIssues.push('no-primary-query')
  if (!description) discoveryIssues.push('missing-search-description')
  if (targetQuery && sharedPrimaryQueries.has(targetQuery)) discoveryIssues.push('shared-primary-query')
  if (targetQuery && titleOverlap < 0.5) discoveryIssues.push('query-language-weak-in-title')
  if (targetQuery && openingOverlap < 0.5) discoveryIssues.push('query-language-weak-in-opening')
  if (!hasEvidence || (externalLinks === 0 && internalLinks < 2)) discoveryIssues.push('thin-discovery-evidence')
  const scores = {
    readerProblem: hasProblem && hasQuestion ? 4 : hasProblem ? 3 : 1,
    singleStory: headingCount >= 6 && first.length > 100 ? 4 : headingCount >= 3 && first.length > 100 ? 3 : 2,
    definitions: nativeOpening.length === 0 && definitions >= 2 ? 4 : hasDefinition ? 3 : 1,
    jargonControl: nativeCount <= 3 && nativeOpening.length === 0 ? 4 : nativeCount <= 8 ? 3 : nativeCount <= 14 ? 2 : 1,
    evidence: externalLinks >= 2 || tableRows > 0 || codeBlocks > 0 ? 4 : hasEvidence ? 3 : 1,
    measurementHonesty: !hasNumbers ? 3 : hasMeasurementConditions ? 4 : 1,
    productBoundaries: /(?:source|package|published|hosted|protocol|public|planned|not yet|does not|upcoming|released)/i.test(prose) ? 3 : 1,
    readerDecision: hasDecision && /(?:when|where|unless|does not apply|avoid|limit)/i.test(ending) ? 4 : hasDecision ? 3 : 1,
    prose: styleFindings.length === 0 ? 4 : styleFindings.length <= 2 ? 3 : styleFindings.length <= 4 ? 2 : 1,
    structure: headingCount >= 8 && tableRows <= 40 ? 4 : headingCount >= 4 ? 3 : 2,
  }
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const hardRejects = []
  if (debris.length) hardRejects.push('repository-debris')
  if (!hasProblem) hardRejects.push('no-reader-problem-in-opening')
  if (nativeOpening.length > 0) hardRejects.push('native-jargon-before-definition')
  if (!hasEvidence) hardRejects.push('no-visible-evidence')
  if (!hasDecision) hardRejects.push('no-reader-decision')
  if (hasNumbers && !hasMeasurementConditions) hardRejects.push('number-without-conditions')

  return {
    file: path.relative(root, file),
    title: data.title || path.basename(file, '.mdx'),
    series: data.series || 'Standalone',
    targetQuery,
    description,
    titleOverlap,
    openingOverlap,
    discoveryScore,
    discoveryStatus: discoveryStatus({ targetQuery, discoveryScore }),
    discoveryChecks,
    discoveryIssues,
    score: total,
    hardRejects,
    firstParagraph: first,
    nativeOpening,
    debris,
    nativeCount,
    styleFindings,
    hasNumbers,
    hasMeasurementConditions,
    wordCount: words(body).length,
    headings: headingCount,
    tableRows,
    codeBlocks,
    externalLinks,
    internalLinks,
    scores,
  }
}

function statusFor(post) {
  if (post.hardRejects.length || post.score <= 29) return 'P0 — rewrite'
  if (post.score <= 35) return 'P1 — revise'
  return 'P2 — factual/link check'
}

function requiredAction(post) {
  const actions = []
  if (post.hardRejects.includes('repository-debris')) actions.push('remove internal commands, paths, or commit mechanics')
  if (post.hardRejects.includes('native-jargon-before-definition')) actions.push('define native terms before using them')
  if (post.hardRejects.includes('number-without-conditions')) actions.push('add task, denominator, conditions, version/date, and limits for every number')
  if (post.hardRejects.includes('no-visible-evidence')) actions.push('add a public source, example, artifact, or measured result')
  if (post.hardRejects.includes('no-reader-decision')) actions.push('end with a concrete choice, change, test, or limit')
  if (post.hardRejects.includes('no-reader-problem-in-opening')) actions.push('rewrite the opening around a problem a newcomer recognizes')
  if (post.styleFindings.length) actions.push(`remove style flags: ${post.styleFindings.join(', ')}`)
  if (post.discoveryIssues.includes('missing-search-description')) actions.push('write a page-specific search description')
  if (post.discoveryIssues.includes('shared-primary-query')) actions.push('choose one primary query owner and give sibling pages distinct reader questions')
  if (post.discoveryIssues.includes('query-language-weak-in-title')) actions.push('make the title name the reader problem or primary query naturally')
  if (post.discoveryIssues.includes('query-language-weak-in-opening')) actions.push('answer the primary query in the opening')
  if (post.discoveryIssues.includes('thin-discovery-evidence')) actions.push('add descriptive internal links and a public source or artifact')
  if (!actions.length) actions.push('check facts and links, then line-edit the weakest dimension')
  return actions.join('; ')
}

function rankPosts(posts) {
  return [...posts]
    .sort((a, b) => {
      const aStatus = statusFor(a)
      const bStatus = statusFor(b)
      const statusOrder = { 'P0 — rewrite': 0, 'P1 — revise': 1, 'P2 — factual/link check': 2 }
      return statusOrder[aStatus] - statusOrder[bStatus]
        || a.score - b.score
        || b.styleFindings.length - a.styleFindings.length
        || a.title.localeCompare(b.title)
    })
    .map((post, index) => ({ ...post, rank: index + 1, status: statusFor(post), requiredAction: requiredAction(post) }))
}

function renderReport(posts) {
  const hard = posts.filter((post) => post.hardRejects.length)
  const styleFlagged = posts.filter((post) => post.styleFindings.length)
  const discoveryIssues = posts.filter((post) => post.discoveryIssues.length)
  const mdCell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
  const lines = [
    '# Blog Rubric Audit — All Posts',
    '',
    `This is a deterministic, machine-assisted first pass over all ${posts.length} posts using the [blog quality rubric](https://github.com/tangle-network/dotfiles/blob/main/docs/rubrics/blog-quality.md) and [public technical blog style guide](https://github.com/tangle-network/dotfiles/blob/main/docs/green-patterns/blog-style-guide.md).`,
    'Search checks use the [discovery quality rubric](https://github.com/tangle-network/dotfiles/blob/main/docs/rubrics/blog-discovery-quality.md), the checked-in [primary-query map](../../scripts/blog-search-targets.json), and the [search research notes](./blog-search-research.md).',
    'The query map carries 77 owners from the existing `company/tools/seo-engine` map and adds 8 directional owners for previously unmapped posts; it contains no search-volume or ranking claims.',
    'Query-language overlap is only a wording hint. Google can understand related language, so a low overlap is a revision prompt, not a keyword-stuffing target.',
    'The score is a ranking signal from the title, opening, full-text patterns, links, measurements, and structure; it is not a publish approval.',
    'A hard failure always outranks the number and requires a rewrite review.',
    '',
    `- P0 rewrite: ${posts.filter((post) => statusFor(post) === 'P0 — rewrite').length}`,
    `- P1 revise: ${posts.filter((post) => statusFor(post) === 'P1 — revise').length}`,
    `- P2 factual/link check: ${posts.filter((post) => statusFor(post) === 'P2 — factual/link check').length}`,
    `- Hard failures: ${hard.length}`,
    `- Repository-debris findings: ${posts.filter((post) => post.hardRejects.includes('repository-debris')).length}`,
    `- Missing reader problem: ${posts.filter((post) => post.hardRejects.includes('no-reader-problem-in-opening')).length}`,
    `- Missing reader decision: ${posts.filter((post) => post.hardRejects.includes('no-reader-decision')).length}`,
    `- Style-flagged posts: ${styleFlagged.length}; style flags: ${styleFlagged.reduce((sum, post) => sum + post.styleFindings.length, 0)}`,
    `- Search target coverage: ${posts.filter((post) => post.targetQuery).length}/${posts.length}`,
    `- Shared primary queries: ${new Set(posts.filter((post) => post.discoveryIssues.includes('shared-primary-query')).map((post) => post.targetQuery)).size}`,
    `- Search-surface issues: ${discoveryIssues.length}; missing descriptions: ${posts.filter((post) => post.discoveryIssues.includes('missing-search-description')).length}`,
    '',
    '## Ranked inventory',
    '',
    '| Rank | Status | Reader | Search | Series | Post | Primary query | Hard failures | Style flags |',
    '| ---: | --- | ---: | --- | --- | --- | --- | --- | --- |',
  ]
  for (const post of posts) {
    lines.push(`| ${post.rank} | ${post.status} | ${post.score}/40 | ${post.discoveryScore}/20 ${post.discoveryStatus} | ${mdCell(post.series)} | [${mdCell(post.title)}](/blog/${post.file.replace(/^src\/content\/blog\//, '').replace(/\.mdx$/, '')}) | ${mdCell(post.targetQuery || 'none')} | ${mdCell(post.hardRejects.join(', ') || 'none')} | ${mdCell(post.styleFindings.join(', ') || 'none')} |`)
  }
  lines.push('', '## Per-post rubric evidence', '')
  for (const post of posts) {
    lines.push(`### ${post.rank}. ${post.title}`)
    lines.push('')
    lines.push(`- File: ${post.file}`)
    lines.push(`- Series: ${post.series}`)
    lines.push(`- Rank/status: ${post.rank} — ${post.status}`)
    lines.push(`- Rubric score: ${post.score}/40`)
    lines.push(`- Search score: ${post.discoveryScore}/20 — ${post.discoveryStatus}`)
    lines.push(`- Primary query: ${post.targetQuery || 'none mapped'}`)
    lines.push(`- Query visibility: ${Math.round(post.titleOverlap * 100)}% of query terms in title; ${Math.round(post.openingOverlap * 100)}% in opening`)
    lines.push(`- Search-surface issues: ${post.discoveryIssues.join(', ') || 'none detected'}`)
    lines.push(`- Hard failures: ${post.hardRejects.join(', ') || 'none detected'}`)
    lines.push(`- Native terms in opening: ${post.nativeOpening.join(', ') || 'none detected'}`)
    lines.push(`- Repository debris: ${post.debris.length ? 'detected' : 'none detected'}`)
    lines.push(`- Style flags: ${post.styleFindings.join(', ') || 'none detected'}`)
    lines.push(`- Shape: ${post.wordCount} words, ${post.headings} headings, ${post.tableRows} table rows, ${post.codeBlocks} code blocks, ${post.externalLinks} external links, ${post.internalLinks} internal links`)
    lines.push(`- Reader dimensions: reader problem ${post.scores.readerProblem}/4; single story ${post.scores.singleStory}/4; definitions ${post.scores.definitions}/4; jargon control ${post.scores.jargonControl}/4; evidence ${post.scores.evidence}/4; measurement honesty ${post.scores.measurementHonesty}/4; product boundaries ${post.scores.productBoundaries}/4; reader decision ${post.scores.readerDecision}/4; prose ${post.scores.prose}/4; structure ${post.scores.structure}/4`)
    lines.push(`- Discovery dimensions: query ownership ${post.discoveryChecks.queryOwnership}/4; title/snippet ${post.discoveryChecks.titleSnippet}/4; answer clarity ${post.discoveryChecks.answerClarity}/4; evidence/entities ${post.discoveryChecks.evidenceEntities}/4; technical discovery ${post.discoveryChecks.technicalDiscovery}/4`)
    lines.push(`- Reader takeaway to validate: ${post.firstParagraph}`)
    lines.push(`- Required action: ${post.requiredAction}`)
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

const posts = listFiles(blogDir).sort().map(scorePost)
const ranked = rankPosts(posts)
const output = { posts: ranked, summary: {
  posts: posts.length,
  p0Rewrite: ranked.filter((post) => post.status === 'P0 — rewrite').length,
  p1Revise: ranked.filter((post) => post.status === 'P1 — revise').length,
  p2FactualLinkCheck: ranked.filter((post) => post.status === 'P2 — factual/link check').length,
  hardRejects: posts.filter((post) => post.hardRejects.length).length,
  repositoryDebris: posts.filter((post) => post.hardRejects.includes('repository-debris')).length,
  missingReaderProblem: posts.filter((post) => post.hardRejects.includes('no-reader-problem-in-opening')).length,
  missingReaderDecision: posts.filter((post) => post.hardRejects.includes('no-reader-decision')).length,
  styleFlagged: posts.filter((post) => post.styleFindings.length).length,
  styleFindings: posts.reduce((sum, post) => sum + post.styleFindings.length, 0),
  searchTargetCoverage: posts.filter((post) => post.targetQuery).length,
  searchSurfaceIssues: posts.filter((post) => post.discoveryIssues.length).length,
  missingSearchDescriptions: posts.filter((post) => post.discoveryIssues.includes('missing-search-description')).length,
  sharedPrimaryQueries: new Set(posts.filter((post) => post.discoveryIssues.includes('shared-primary-query')).map((post) => post.targetQuery)).size,
}}

if (reportPath) fs.writeFileSync(path.resolve(root, reportPath), renderReport(ranked))
if (json) console.log(JSON.stringify(output, null, 2))
else console.log(`Blog rubric audit: ${posts.length} posts, ${output.summary.p0Rewrite} P0 rewrites, ${output.summary.p1Revise} P1 revisions, ${output.summary.p2FactualLinkCheck} P2 factual/link checks`)

process.exit(0)
