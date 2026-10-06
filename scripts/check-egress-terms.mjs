#!/usr/bin/env node
/**
 * Fails unless the website states the sandbox egress terms production bills.
 *
 * 1. Fetches EGRESS_TERMS_URL, the production sandbox API's public terms, and
 *    compares it with EGRESS_TERMS in src/data/egressTerms.mjs: every field the
 *    website states, over the same set of plans.
 * 2. Reads the built homepage and requires every row and sentence that
 *    egressTerms.mjs produces.
 *
 * Missing evidence is a failure, never a pass: an unreachable endpoint, any
 * status but 200 (404 or 401 until the sandbox-api release that serves the
 * endpoint is live), a body of the wrong shape, or a missing build each fail
 * with the reason. The deploy workflow runs this after the build, so a
 * mismatch blocks the deploy.
 *
 * Run: pnpm build && pnpm check:egress
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  EGRESS_TERMS,
  EGRESS_TERMS_URL,
  egressLede,
  egressNotes,
  egressRows,
} from '../src/data/egressTerms.mjs';

const TERM_FIELDS = ['period', 'metered', 'bytesPerGb'];
const PLAN_FIELDS = ['scope', 'includedBytes', 'overage', 'usdPerGb'];
const ATTEMPTS = 3;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Every difference between the served terms and the stated ones; empty when equal. */
export function compareEgressTerms(served, stated = EGRESS_TERMS) {
  if (!isRecord(served) || !isRecord(served.plans)) {
    return ['the served body has no plans object'];
  }
  const problems = [];
  for (const field of TERM_FIELDS) {
    if (served[field] !== stated[field]) {
      problems.push(`${field}: production serves ${JSON.stringify(served[field])}, the website states ${JSON.stringify(stated[field])}`);
    }
  }
  const ids = new Set([...Object.keys(served.plans), ...Object.keys(stated.plans)]);
  for (const id of ids) {
    const live = served.plans[id];
    const ours = stated.plans[id];
    if (!ours) {
      problems.push(`plans.${id}: production publishes this plan and the website does not state it`);
      continue;
    }
    if (!isRecord(live)) {
      problems.push(`plans.${id}: the website states this plan and production publishes no terms for it`);
      continue;
    }
    for (const field of PLAN_FIELDS) {
      if (live[field] !== ours[field]) {
        problems.push(`plans.${id}.${field}: production serves ${JSON.stringify(live[field])}, the website states ${JSON.stringify(ours[field])}`);
      }
    }
  }
  return problems;
}

/** The production terms, or an error saying why there is no answer. */
export async function fetchServedTerms(url = EGRESS_TERMS_URL, { fetchImpl = fetch, wait = sleep } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      lastError = new Error(`${url} is unreachable (${error instanceof Error ? error.message : String(error)})`);
      if (attempt < ATTEMPTS) await wait(attempt * 2_000);
      continue;
    }
    if (response.status === 200) {
      try {
        return JSON.parse(await response.text());
      } catch {
        throw new Error(`${url} answered 200 with a body that is not JSON`);
      }
    }
    const reason = response.status === 404 || response.status === 401
      ? ': the sandbox-api release that serves GET /v1/pricing/egress is not live yet'
      : '';
    lastError = new Error(`${url} answered ${response.status}${reason}`);
    if (response.status < 500) break;
    if (attempt < ATTEMPTS) await wait(attempt * 2_000);
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function text(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every row and sentence of the stated terms the built page does not render. */
export function renderedEgressProblems(html, stated = EGRESS_TERMS) {
  const problems = [];
  for (const row of egressRows(stated)) {
    const match = html.match(new RegExp(`<tr[^>]*\\bdata-egress-plan="${row.id}"[^>]*>([\\s\\S]*?)</tr>`));
    const expected = `${row.name} ${row.included} ${row.beyond}`;
    if (!match) problems.push(`the page has no egress row for ${row.id}`);
    else if (text(match[1]) !== expected) {
      problems.push(`the ${row.id} row reads "${text(match[1])}", expected "${expected}"`);
    }
  }
  const page = text(html);
  for (const sentence of [egressLede(stated), ...egressNotes(stated)]) {
    if (!page.includes(sentence)) problems.push(`the page does not say: ${sentence}`);
  }
  if (!html.includes(`href="${EGRESS_TERMS_URL}"`)) {
    problems.push(`the page does not link the published terms at ${EGRESS_TERMS_URL}`);
  }
  return problems;
}

async function main() {
  const failures = [];
  const page = fileURLToPath(new URL('../dist/client/index.html', import.meta.url));
  let html;
  try {
    html = await readFile(page, 'utf8');
  } catch {
    failures.push(`${page} is missing; run pnpm build first`);
  }
  if (html !== undefined) failures.push(...renderedEgressProblems(html));

  try {
    const served = await fetchServedTerms();
    failures.push(...compareEgressTerms(served));
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  if (failures.length > 0) {
    console.error('Egress terms check failed. The website must state the terms production bills:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`Egress terms match ${EGRESS_TERMS_URL} and the built homepage renders them.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
