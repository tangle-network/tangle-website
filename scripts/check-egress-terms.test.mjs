import test from 'node:test';
import assert from 'node:assert/strict';

import { EGRESS_TERMS, EGRESS_TERMS_URL, egressLede, egressNotes, egressRows } from '../src/data/egressTerms.mjs';
import { compareEgressTerms, fetchServedTerms, renderedEgressProblems } from './check-egress-terms.mjs';

const served = () => structuredClone(EGRESS_TERMS);
const noWait = async () => {};

function response(status, body) {
  return { status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
}

function page(rows = egressRows(), notes = [egressLede(), ...egressNotes()]) {
  const cells = rows
    .map((row) => `<tr data-egress-plan="${row.id}" data-astro-cid-x><th scope="row">${row.name}</th><td>${row.included}</td><td>${row.beyond}</td></tr>`)
    .join('\n');
  const prose = notes.map((note) => `<p>${note.replaceAll("'", '&#39;')}</p>`).join('\n');
  return `<table><tbody>${cells}</tbody></table>${prose}<a href="${EGRESS_TERMS_URL}">terms</a>`;
}

test('the stated terms are the approved terms', () => {
  assert.deepEqual(EGRESS_TERMS.plans, {
    free: { scope: 'account', includedBytes: 100 * 1024 ** 3, overage: 'refused', usdPerGb: 0 },
    pro: { scope: 'sandbox', includedBytes: 2e12, overage: 'billed', usdPerGb: 0.05 },
    enterprise: { scope: 'sandbox', includedBytes: 2e12, overage: 'billed', usdPerGb: 0.04 },
  });
});

test('identical served terms pass', () => {
  assert.deepEqual(compareEgressTerms(served()), []);
});

test('a changed price, allowance or scope fails, naming the field', () => {
  const body = served();
  body.plans.pro.usdPerGb = 0.06;
  body.plans.enterprise.includedBytes = 5e12;
  body.plans.free.scope = 'sandbox';
  assert.deepEqual(compareEgressTerms(body), [
    'plans.free.scope: production serves "sandbox", the website states "account"',
    'plans.pro.usdPerGb: production serves 0.06, the website states 0.05',
    'plans.enterprise.includedBytes: production serves 5000000000000, the website states 2000000000000',
  ]);
});

test('a plan only one side carries fails', () => {
  const extra = served();
  extra.plans.startup = { scope: 'sandbox', includedBytes: 1e12, overage: 'billed', usdPerGb: 0.07 };
  assert.match(compareEgressTerms(extra).join('\n'), /plans\.startup: production publishes this plan and the website does not state it/);
  const missing = served();
  delete missing.plans.enterprise;
  assert.match(compareEgressTerms(missing).join('\n'), /plans\.enterprise: the website states this plan and production publishes no terms/);
});

test('a body of the wrong shape or units fails', () => {
  assert.deepEqual(compareEgressTerms({ error: 'unauthorized' }), ['the served body has no plans object']);
  assert.deepEqual(compareEgressTerms(null), ['the served body has no plans object']);
  const units = served();
  units.bytesPerGb = 1024 ** 3;
  assert.equal(compareEgressTerms(units).length, 1);
});

test('the endpoint before its release fails with the reason, without retrying', async () => {
  for (const status of [401, 404]) {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return response(status, { error: 'unauthorized' });
    };
    await assert.rejects(fetchServedTerms(EGRESS_TERMS_URL, { fetchImpl, wait: noWait }), (error) => {
      assert.match(error.message, new RegExp(`answered ${status}: the sandbox-api release that serves GET /v1/pricing/egress is not live yet`));
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('an unreachable or failing endpoint fails after retries', async () => {
  let calls = 0;
  const down = async () => {
    calls += 1;
    throw new TypeError('fetch failed');
  };
  await assert.rejects(fetchServedTerms(EGRESS_TERMS_URL, { fetchImpl: down, wait: noWait }), /is unreachable \(fetch failed\)/);
  assert.equal(calls, 3);

  const erroring = async () => response(503, 'unavailable');
  await assert.rejects(fetchServedTerms(EGRESS_TERMS_URL, { fetchImpl: erroring, wait: noWait }), /answered 503$/);

  const html = async () => response(200, '<html>');
  await assert.rejects(fetchServedTerms(EGRESS_TERMS_URL, { fetchImpl: html, wait: noWait }), /not JSON/);
});

test('a transient failure followed by the terms passes', async () => {
  let calls = 0;
  const flaky = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('fetch failed');
    return response(200, served());
  };
  assert.deepEqual(await fetchServedTerms(EGRESS_TERMS_URL, { fetchImpl: flaky, wait: noWait }), served());
});

test('the rendered page carries every row, sentence and the published link', () => {
  assert.deepEqual(renderedEgressProblems(page()), []);
});

test('a page missing a row, showing another price, or dropping a sentence fails', () => {
  const rows = egressRows();
  assert.deepEqual(renderedEgressProblems(page(rows.slice(0, 2))), ['the page has no egress row for enterprise']);

  const stale = rows.map((row) => (row.id === 'pro' ? { ...row, beyond: '$0.06 per GB' } : row));
  assert.deepEqual(renderedEgressProblems(page(stale)), [
    'the pro row reads "Pro 2 TB per sandbox $0.06 per GB", expected "Pro 2 TB per sandbox $0.05 per GB"',
  ]);

  const [, ...withoutLede] = [egressLede(), ...egressNotes()];
  assert.match(renderedEgressProblems(page(rows, withoutLede)).join('\n'), /the page does not say: Egress is outbound traffic/);

  assert.match(renderedEgressProblems(page().replace(EGRESS_TERMS_URL, 'https://example.test')).join('\n'), /does not link the published terms/);
});

test('the copy states every approved number in its approved unit', () => {
  assert.deepEqual(
    egressRows().map((row) => `${row.name}: ${row.included}; ${row.beyond}`),
    [
      'Free: 100 GiB per account; Refused, never charged',
      'Pro: 2 TB per sandbox; $0.05 per GB',
      'Team: 2 TB per sandbox; $0.04 per GB',
    ],
  );
  assert.deepEqual(egressNotes(), [
    'On Pro and Team, every sandbox has its own 2 TB; allowances are not pooled across the account.',
    "On Free, the account's sandboxes share one 100 GiB cap. Once it is reached, new sandboxes and prompts are refused until the next month, and nothing is charged.",
    'TB and GB are decimal: 1 TB is 1,000 GB, and 1 GB is 1,000,000,000 bytes. GiB is binary: 100 GiB is 107,374,182,400 bytes.',
  ]);
});
