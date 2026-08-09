import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [revisionArgument, sourceArgument] = process.argv.slice(2);
const expected = revisionArgument
  ? {
      revision: revisionArgument.toLowerCase(),
      source: sourceArgument ?? 'explicit-build-environment',
    }
  : {
      revision: null,
      source: 'local-unversioned',
    };

const versionUrl = new URL('../dist/client/version.json', import.meta.url);
const body = await readFile(versionUrl, 'utf8');
const actual = JSON.parse(body);

assert.deepEqual(actual, expected);
assert.equal(body, `${JSON.stringify(expected)}\n`);

console.log(`Version sentinel matches ${JSON.stringify(expected)}`);
