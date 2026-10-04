import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from '/home/drew/code/agent-dev-container/node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/lib/typescript.js';
import { quickstartExamples, quickstartLanguages } from './site/src/data/sandboxQuickstart.ts';
const dir = fileURLToPath(new URL('.', import.meta.url));
const sourcePath = fileURLToPath(new URL('./site/src/data/sandboxQuickstart.ts', import.meta.url));
const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
fs.writeFileSync(`${dir}/exported-examples.json`, JSON.stringify({ sourceSha256, quickstartExamples, quickstartLanguages }, null, 2)+'\n');
const meta = await fetch('https://registry.npmjs.org/@tangle-network%2fsandbox/0.60.13').then(r => r.json());
const zipped = Buffer.from(await fetch(meta.dist.tarball).then(r => r.arrayBuffer()));
const integrity = 'sha512-'+crypto.createHash('sha512').update(zipped).digest('base64');
if (integrity !== meta.dist.integrity) throw Error('Package integrity mismatch');
const tar = zlib.gunzipSync(zipped), files = new Map();
for (let offset = 0; offset+512 < tar.length;) {
  const name = tar.subarray(offset, offset+100).toString().replace(/\0.*$/s, '');
  const size = parseInt(tar.subarray(offset+124, offset+136).toString().replace(/\0.*$/s, '').trim() || '0', 8);
  if (name.endsWith('.d.ts')) files.set('/virtual/'+name, tar.subarray(offset+512, offset+512+size).toString());
  offset += 512 + Math.ceil(size/512)*512;
}
for (const example of quickstartExamples) files.set('/virtual/'+example.id+'.ts', example.typescript.fullCode);
assert.equal(quickstartExamples[0].id, 'create');
for (const example of quickstartExamples) {
  for (const language of quickstartLanguages) {
    const view = example[language.id];
    assert.equal(typeof view.snippet, 'string');
    assert.equal(typeof view.fullCode, 'string');
    assert(view.snippet.trim().length > 0);
    assert(view.fullCode.includes('TANGLE_API_KEY'));
    assert(view.fullCode.includes('https://sandbox.tangle.tools'));
    assert(view.fullCode.includes('900'));
    if (example.id !== 'create') assert(view.snippet.length < view.fullCode.length);
    if (!['create','network'].includes(example.id)) {
      assert(!view.snippet.includes('TANGLE_API_KEY'));
      assert(!view.snippet.includes('new Sandbox'));
      assert(!view.snippet.includes('httpx.Client'));
      assert(!view.snippet.includes('tangle.create('));
      assert(!view.snippet.includes('tangle.post("/v1/sandboxes"'));
    }
  }
  // Short excerpts intentionally depend on the create example; use real SDK
  // types for their existing client/sandbox context, without method stubs.
  const context = example.id === 'create' ? '' :
    `import { Sandbox } from '@tangle-network/sandbox';\ndeclare const tangle: Sandbox;\n${example.id === 'network' ? '' : "declare const box: Awaited<ReturnType<Sandbox['create']>>;\n"}`;
  files.set('/virtual/snippet-'+example.id+'.ts', context + example.typescript.snippet);
}
const component = fs.readFileSync(dir+'/site/src/components/QuickstartCode.tsx','utf8');
assert(component.includes('text={code.fullCode}'));
assert(component.includes('code={code.snippet}'));
assert(!component.includes('>Copy full<'));
assert(component.includes('aria-label="Copy full example"'));
for (const id of ['agent','parallel']) assert(quickstartExamples.find(e=>e.id===id).typescript.fullCode.includes('result.success ? result.response : result.error'));
const options = {
  strict: true, noEmit: true, skipLibCheck: true,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022, types: ['node'],
  typeRoots: ['/home/drew/code/agent-dev-container/node_modules/.pnpm/@types+node@25.6.0/node_modules/@types'],
  baseUrl: '/virtual', paths: { '@tangle-network/sandbox': ['package/dist/index.d.ts'] },
  ignoreDeprecations: '6.0',
};
const host = ts.createCompilerHost(options), exists = host.fileExists, read = host.readFile;
host.fileExists = name => files.has(name) || exists(name);
host.readFile = name => files.get(name) ?? read(name);
host.directoryExists = name => name.startsWith('/virtual') || ts.sys.directoryExists(name);
host.getSourceFile = (name, language) => {
  const contents = host.readFile(name);
  return contents === undefined ? undefined : ts.createSourceFile(name, contents, language);
};
const roots = quickstartExamples.flatMap(e => ['/virtual/'+e.id+'.ts', '/virtual/snippet-'+e.id+'.ts']);
const program = ts.createProgram(roots, options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const checker = program.getTypeChecker(), inferred = {};
for (const example of quickstartExamples) {
  inferred[example.id] = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['tangle', 'box', 'result', 'results', 'link', 'ready', 'terminal'].includes(node.name.getText())) {
      inferred[example.id][node.name.getText()] = checker.typeToString(checker.getTypeAtLocation(node));
    }
    ts.forEachChild(node, visit);
  }
  visit(program.getSourceFile('/virtual/'+example.id+'.ts'));
}
const receipt = {
  checkedAt: new Date().toISOString(), sourceSha256,
  package: '@tangle-network/sandbox', version: meta.version, integrity,
  typescript: ts.version, nodeTypes: '25.6.0', strict: true, skipLibCheck: true,
  checkedExamples: quickstartExamples.length, checkedModules: roots.length,
  diagnostics: diagnostics.map(d => ({ file: d.file?.fileName, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') })),
  inferred, liveSandboxCalls: false,
};
fs.writeFileSync(`${dir}/typescript.json`, JSON.stringify(receipt, null, 2)+'\n');
console.log(JSON.stringify(receipt, null, 2));
if (diagnostics.length) process.exitCode = 1;
const componentOptions = { ...options, jsx: ts.JsxEmit.ReactJSX, baseUrl: dir+'/site', paths: undefined };
const componentProgram = ts.createProgram([dir+'/site/src/components/QuickstartCode.tsx', dir+'/site/src/data/sandboxQuickstart.ts'], componentOptions);
const componentDiagnostics = ts.getPreEmitDiagnostics(componentProgram).map(d => ({file:d.file?.fileName,code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
const componentReceipt = { checkedAt:new Date().toISOString(), sourceSha256, typescript:ts.version, strict:true, skipLibCheck:true, diagnostics:componentDiagnostics };
fs.writeFileSync(dir+'/component-typescript.json',JSON.stringify(componentReceipt,null,2)+'\n');
console.log(JSON.stringify({component:componentReceipt},null,2));
if(componentDiagnostics.length) process.exitCode=1;
const python = spawnSync('python3', [dir+'/check.py'], { encoding: 'utf8' });
process.stdout.write(python.stdout); process.stderr.write(python.stderr);
if (python.status) process.exitCode = python.status;
