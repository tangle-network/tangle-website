// Typechecks every ```ts fence in the blog against the published SDK packages, with the same harness that checks the
// home page's examples (scripts/examples-typecheck). A post's code is product usage or it is not code: a fence that
// does not compile against the packages a reader installs fails the gate. Pass post paths to check a few; none checks all.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const harness = join(root, 'scripts/examples-typecheck');
const out = join(harness, 'blog');
const posts = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => (p.startsWith('/') ? p : p.endsWith('.mdx') ? join(process.cwd(), p) : join(root, 'src/content/blog', `${p}.mdx`)))
  : readdirSync(join(root, 'src/content/blog')).filter((f) => f.endsWith('.mdx')).map((f) => join(root, 'src/content/blog', f));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const fences = new Map(); // file name in the harness -> { post, line }
for (const post of posts) {
  const text = readFileSync(post, 'utf8');
  const slug = basename(post, '.mdx');
  let n = 0;
  for (const match of text.matchAll(/^```(?:ts|typescript)\b[^\n]*\n([\s\S]*?)^```/gm)) {
    n += 1;
    const name = `${slug}.${n}.mts`;
    const line = text.slice(0, match.index).split('\n').length + 1;
    writeFileSync(join(out, name), match[1]);
    fences.set(name, { post: post.replace(`${root}`, ''), line });
  }
}
if (fences.size === 0) {
  console.log('check:blog-code: no ts fences to check');
  process.exit(0);
}

const tsc = spawnSync('npx', ['--no-install', 'tsc', '-p', 'tsconfig.blog.json', '--pretty', 'false'], { cwd: harness, encoding: 'utf8' });
if (tsc.error) throw tsc.error;
const problems = new Map();
for (const line of `${tsc.stdout}\n${tsc.stderr}`.split('\n')) {
  const m = line.match(/^blog\/([^(]+)\((\d+),(\d+)\): (.*)$/);
  if (!m) continue;
  const fence = fences.get(m[1]);
  const key = fence ? `${fence.post}:${fence.line + Number(m[2]) - 1}` : m[1];
  if (!problems.has(key)) problems.set(key, []);
  problems.get(key).push(m[4]);
}
if (problems.size) {
  for (const [where, messages] of problems) console.error(`${where}\n  ${messages.join('\n  ')}`);
  console.error(`check:blog-code failed: ${problems.size} place(s) in ${new Set([...problems.keys()].map((k) => k.split(':')[0])).size} post(s), ${fences.size} fences checked`);
  process.exit(1);
}
console.log(`check:blog-code ok: ${fences.size} ts fences in ${posts.length} posts typecheck against the published packages`);
