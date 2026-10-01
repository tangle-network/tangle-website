import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCopy } from './extract-copy.mjs';

test('keeps accessible chart values and suppresses duplicate responsive copies', () => {
  const svg = '<svg aria-label="Pass rates"><g aria-label="Luna: 1/26 passed, 3.8%"><text>geometry label</text></g></svg>';
  const copy = extractCopy(`<main><figure aria-label="No ranking is claimed.">${svg}${svg}</figure></main>`, '/benchmarks');
  assert.match(copy, /Chart: No ranking is claimed/);
  assert.match(copy, /Chart: Pass rates/);
  assert.equal(copy.match(/Luna: 1\/26 passed, 3\.8%/g).length, 1);
  assert.doesNotMatch(copy, /geometry label/);
});

test('omits hidden search state while preserving adjacent visible text', () => {
  const copy = extractCopy('<main><p hidden role="status">No results</p><p>Two configurations</p></main>', '/benchmarks');
  assert.equal(copy, 'Two configurations');
});

test('omits nested hidden contents and void elements without swallowing siblings', () => {
  const copy = extractCopy('<main><div hidden><div><p>Secret</p><img src="x"><br><input></div></div><p>Visible</p></main>', '/x');
  assert.equal(copy, 'Visible');
});

test('does not confuse attribute values or data-hidden with hidden', () => {
  const copy = extractCopy('<main><p title="contains hidden text" data-hidden="true">Visible</p><img hidden src="x"><p>After</p></main>', '/x');
  assert.equal(copy, 'Visible\nAfter');
});

test('identifies collapsed content and still audits every method sentence', () => {
  const copy = extractCopy('<main><details><summary>Data and method</summary><p>Cost includes failed attempts.</p></details><details open><summary>Tasks</summary><p>Run the app.</p></details></main>', '/x');
  assert.match(copy, /Expandable section: Data and method/);
  assert.match(copy, /Cost includes failed attempts/);
  assert.match(copy, /Tasks\nRun the app/);
  assert.doesNotMatch(copy, /Expandable section: Tasks/);
});

test('preserves code lines and keeps shared navigation outside non-home audits', () => {
  const html = '<header>Shared nav</header><main><h1>Page</h1><p><span class="line">import x</span><span class="line">run(x)</span></p><a href="/docs">Docs</a></main><footer>Footer</footer>';
  assert.equal(extractCopy(html, '/x'), 'Page\nimport x\nrun(x)\nDocs [/docs]');
  assert.match(extractCopy(html, '/'), /Shared nav/);
  assert.match(extractCopy(html, '/'), /Footer/);
});

test('audits plot labels without treating the clipped accessible table as visible copy', () => {
  const html = '<main><figure aria-label="Luna: 1/26 passed, 3.8%"><svg aria-label="Pass rate by setup"></svg><div class="other tgc-accessible-data"><table><caption>Table labels</caption><tbody><tr><td>1B 1C 24F</td></tr></tbody></table></div><p>Visible context</p></figure><p class="tgc-accessible-data-example">Visible sibling</p></main>';
  const copy = extractCopy(html, '/benchmarks');
  assert.match(copy, /Luna: 1\/26 passed, 3\.8%/);
  assert.match(copy, /Pass rate by setup/);
  assert.match(copy, /Visible context/);
  assert.match(copy, /Visible sibling/);
  assert.doesNotMatch(copy, /Table labels|1B 1C 24F/);
});


test('does not treat data-class as a clipped chart class', () => {
  const copy = extractCopy('<main><p data-class="tgc-accessible-data">Visible data-class</p></main>', '/x');
  assert.equal(copy, 'Visible data-class');
});

test('does not parse class-like text inside a quoted attribute value', () => {
  const copy = extractCopy(`<main><p aria-label="Text with class='tgc-accessible-data' inside">Visible quoted attribute</p></main>`, '/x');
  assert.equal(copy, 'Visible quoted attribute');
});
