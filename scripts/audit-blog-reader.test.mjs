import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(import.meta.dirname, '..')
const checker = path.join(repoRoot, 'scripts/audit-blog-reader.mjs')
const frontmatterParser = path.join(repoRoot, 'scripts/lib/blog-frontmatter.mjs')

const frontmatter = `---
title: Reader checker fixture
description: A fixture for the reader checker.
date: 2026-01-01
tags: [testing]
---
`

const fixtures = {
  'commit-phrase.mdx': `${frontmatter}
The public change landed in commit b44898e.
`,
  'commit-label.mdx': `${frontmatter}
[commit b44898e](https://example.com/release-notes) explains the change.
`,
  'hash-link-label.mdx': `${frontmatter}
[b44898e](https://github.com/tangle-network/agent-eval/commit/b44898e419af67315c5083e68710ec72e9ee0089) explains the change.
`,
  'human-link.mdx': `${frontmatter}
[The public change](https://github.com/tangle-network/agent-eval/commit/b44898e419af67315c5083e68710ec72e9ee0089) explains the change.
`,
  'ordinary-hex.mdx': `${frontmatter}
The example uses record id deadbeef and run 012762f.
`,
  'color-and-code.mdx': `${frontmatter}
The interface uses #bada55.

\`\`\`ts
const color = '#bada55'
const recordId = 'deadbeef'
const revision = '012762f'
\`\`\`
`,
  'opaque-url.mdx': `${frontmatter}
See https://github.com/tangle-network/agent-eval/commit/b44898e419af67315c5083e68710ec72e9ee0089 for the source.
`,
}

test('detects visible commit references without flagging ordinary hex or source URLs', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tangle-blog-reader-'))
  try {
    await fs.mkdir(path.join(tempRoot, 'src/content/blog'), { recursive: true })
    await fs.mkdir(path.join(tempRoot, 'scripts/lib'), { recursive: true })
    await fs.copyFile(checker, path.join(tempRoot, 'scripts/audit-blog-reader.mjs'))
    await fs.copyFile(frontmatterParser, path.join(tempRoot, 'scripts/lib/blog-frontmatter.mjs'))
    await fs.writeFile(path.join(tempRoot, 'scripts/blog-search-targets.json'), '{}')
    await Promise.all(Object.entries(fixtures).map(([filename, content]) => (
      fs.writeFile(path.join(tempRoot, 'src/content/blog', filename), content)
    )))

    const { stdout } = await execFileAsync(process.execPath, ['scripts/audit-blog-reader.mjs', '--json'], { cwd: tempRoot })
    const report = JSON.parse(stdout)
    const debrisByFile = new Map(report.posts.map((post) => [path.basename(post.file), post.debris]))

    for (const filename of ['commit-phrase.mdx', 'commit-label.mdx', 'hash-link-label.mdx']) {
      assert.ok(debrisByFile.get(filename)?.length, `${filename} should be flagged`)
    }
    for (const filename of ['human-link.mdx', 'ordinary-hex.mdx', 'color-and-code.mdx', 'opaque-url.mdx']) {
      assert.deepEqual(debrisByFile.get(filename), [], `${filename} should not be flagged`)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})
