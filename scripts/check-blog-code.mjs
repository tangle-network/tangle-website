// Typechecks every ```ts fence in the blog against the published SDK packages, with the same harness that checks the
// home page's examples (scripts/examples-typecheck). A post's code is product usage or it is not code: a fence that
// does not compile against the packages a reader installs fails the gate. Pass post paths to check a few; none checks all.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const harness = join(root, 'scripts/examples-typecheck');
const scratch = `blog-${process.pid}`, out = join(harness, scratch), project = join(harness, `${scratch}.tsconfig.json`); // per run: parallel gates never share files; both go at exit
const posts = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => (p.startsWith('/') ? p : p.endsWith('.mdx') ? join(process.cwd(), p) : join(root, 'src/content/blog', `${p}.mdx`)))
  : readdirSync(join(root, 'src/content/blog')).filter((f) => f.endsWith('.mdx')).map((f) => join(root, 'src/content/blog', f));

rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const fences = new Map(); // file name in the harness -> { post, line }
for (const post of posts) {
  const text = readFileSync(post, 'utf8');
  const slug = basename(post, '.mdx');
  let n = 0;
  mkdirSync(join(out, slug), { recursive: true });
  for (const match of text.matchAll(/^(```|~~~)(?:ts|typescript)\b([^\n]*)\n([\s\S]*?)^\1/gm)) {
    n += 1;
    // A fence titled with a file name is written under that name, so a later fence can import it as the post shows.
    const name = `${slug}/${/\btitle="([\w.-]+\.m?ts)"/.exec(match[2])?.[1] ?? `${n}.mts`}`;
    const line = text.slice(0, match.index).split('\n').length + 1;
    writeFileSync(join(out, name), match[3]);
    fences.set(name, { post: post.replace(`${root}`, ''), line });
  }
}
if (fences.size === 0) { console.log('check:blog-code: no ts fences to check'); process.exit(0); }

writeFileSync(project, JSON.stringify({ extends: './tsconfig.blog.json', include: [`${scratch}/**/*.mts`] }));
process.on('exit', () => { rmSync(out, { recursive: true, force: true }); rmSync(project, { force: true }); });
const tsc = spawnSync('npx', ['--no-install', 'tsc', '-p', project, '--pretty', 'false'], { cwd: harness, encoding: 'utf8' });
if (tsc.error) throw tsc.error;
const problems = new Map();
for (const line of `${tsc.stdout}\n${tsc.stderr}`.split('\n')) {
  const m = line.match(/^blog-\d+\/([^(]+)\((\d+),(\d+)\): (.*)$/);
  if (!m) continue;
  const fence = fences.get(m[1]);
  const key = fence ? `${fence.post}:${fence.line + Number(m[2]) - 1}` : m[1];
  if (!problems.has(key)) problems.set(key, []);
  problems.get(key).push(m[4]);
}
if (tsc.status !== 0 && !problems.size) { // tsc missing or crashed: nothing was checked, so this must not read as ok
  console.error(`${tsc.stdout}\n${tsc.stderr}`.trim(), '\ncheck:blog-code failed: tsc did not run cleanly');
  process.exit(1);
}
if (problems.size) {
  for (const [where, messages] of problems) console.error(`${where}\n  ${messages.join('\n  ')}`);
  console.error(`check:blog-code failed: ${problems.size} place(s) in ${new Set([...problems.keys()].map((k) => k.split(':')[0])).size} post(s), ${fences.size} fences checked`);
  process.exit(1);
}
console.log(`check:blog-code ok: ${fences.size} ts fences in ${posts.length} posts typecheck against the published packages`);
