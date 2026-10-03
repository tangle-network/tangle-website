import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from '/Users/drew/webb/agent-dev-container/node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/lib/typescript.js';
import { quickstartExamples, quickstartLanguages } from '../../../src/data/sandboxQuickstart.ts';
const dir = fileURLToPath(new URL('.', import.meta.url));
const sourcePath = fileURLToPath(new URL('../../../src/data/sandboxQuickstart.ts', import.meta.url));
const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
fs.writeFileSync(`${dir}/exported-examples.json`, JSON.stringify({ sourceSha256, quickstartExamples, quickstartLanguages }, null, 2)+'\n');
const meta = await fetch('https://registry.npmjs.org/@tangle-network%2fsandbox/0.60.9').then(r => r.json());
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
for (const example of quickstartExamples) files.set('/virtual/'+example.id+'.ts', example.typescript);
const options = {
  strict: true, noEmit: true, skipLibCheck: true,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022, types: ['node'],
  typeRoots: ['/Users/drew/webb/agent-dev-container/node_modules/.pnpm/@types+node@25.6.0/node_modules/@types'],
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
const program = ts.createProgram(quickstartExamples.map(e => '/virtual/'+e.id+'.ts'), options, host);
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
  diagnostics: diagnostics.map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') })),
  inferred, liveSandboxCalls: false,
};
fs.writeFileSync(`${dir}/typescript.json`, JSON.stringify(receipt, null, 2)+'\n');
console.log(JSON.stringify(receipt, null, 2));
if (diagnostics.length) process.exitCode = 1;
const python = spawnSync('python3', [dir+'/check.py'], { encoding: 'utf8' });
process.stdout.write(python.stdout); process.stderr.write(python.stderr);
if (python.status) process.exitCode = python.status;
