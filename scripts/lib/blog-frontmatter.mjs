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
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

export function asArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null || value === '') return []
  return [value]
}

function isFrontmatterKey(line) {
  return /^([A-Za-z0-9_]+):(?:\s*(.*))?$/.exec(line)
}

function isBlockScalar(value) {
  return /^[|>][+-]?\d*$/.test(value.trim())
}

function readBlockScalar(lines, start) {
  const content = []
  let index = start

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() && !/^\s+/.test(line)) break
    content.push(line.replace(/^\s{2}/, '').trimEnd())
    index += 1
  }

  return { content, next: index }
}

export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { frontmatter: '', body: text, data: {} }

  const frontmatter = match[1]
  const lines = frontmatter.split(/\r?\n/)
  const data = {}
  let currentArray = null

  for (let index = 0; index < lines.length; index += 1) {
    const arrayItem = lines[index].match(/^\s*-\s+(.+)$/)
    if (arrayItem && currentArray) {
      data[currentArray].push(cleanValue(arrayItem[1]))
      continue
    }

    const pair = isFrontmatterKey(lines[index])
    if (!pair) continue

    const [, key, rawValue = ''] = pair
    currentArray = null

    if (isBlockScalar(rawValue)) {
      const block = readBlockScalar(lines, index + 1)
      const folded = rawValue.trim().startsWith('>')
      data[key] = folded ? block.content.join(' ').trim() : block.content.join('\n').trim()
      index = block.next - 1
      continue
    }

    if (!rawValue.trim()) {
      data[key] = []
      currentArray = key
      continue
    }

    data[key] = cleanValue(rawValue)
  }

  return { frontmatter, body: text.slice(match[0].length), data }
}
