// The figures in /blog/openai-compatible-routers-for-agents. Figure 1 is worked arithmetic from the OpenAI Node SDK's
// documented retry default. Figure 2 is three numbers from one day of live requests against Tangle Router: the
// catalog's list price, the price ceiling we sent before and after the router's max_price fix, and the input rate the
// response's price header reported.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

type Provenance = { status: 'measured' | 'illustrative'; period: string; unit: string; source: { label: string; href: string }; method: string };

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : { ...figure, status: p.status, period: p.period, unit: p.unit, note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, p.source] };

/** HTTP calls the router receives for one agent step that keeps failing with a retryable error. */
export const retries = provenance(metricBars([
  { id: 'both-retry', label: 'Agent retries twice, SDK default', value: 9, detail: '3 agent attempts × 3 SDK attempts' },
  { id: 'agent-only', label: 'Agent retries twice, SDK maxRetries 0', value: 3, detail: '3 agent attempts × 1' },
  { id: 'sdk-only', label: 'Agent does not retry, SDK default', value: 3, detail: '1 × 3 SDK attempts' },
], { measure: 'calls to the router for one failing step', unit: '', domain: [0, 10], formatValue: String, width: 720, id: 'router-retries-multiply' }), 1, {
  status: 'illustrative',
  period: 'OpenAI Node SDK retry default as documented on 17 Nov 2026',
  unit: 'HTTP calls to the router',
  source: { label: 'openai-node: Retries', href: 'https://github.com/openai/openai-node#retries' },
  method: 'Worked arithmetic, not a measurement. The OpenAI Node SDK retries connection errors, 408, 409, 429 and 5xx responses ' +
    '2 times by default (3 attempts). ' +
    'An agent loop that retries a step twice makes 3 attempts. Each bar multiplies the two. A 4xx other than 408, 409 and 429 is not retried by the SDK. ' +
    'Each call can also walk the router\'s fallback list, so attempts reaching model providers can exceed the bar.',
});

/** Dollars per million input tokens for openai/gpt-4o-mini on Tangle Router. */
export const ceiling = provenance(metricBars([
  { id: 'list', label: 'Provider list price', value: 0.15, detail: 'catalog; what the ceiling was checked against before the fix' },
  { id: 'ceiling', label: 'Our price ceiling, before the fix', value: 0.155, detail: 'sent as the max_price prompt value; request passed' },
  { id: 'ceiling-after', label: 'The same ceiling, after the fix', value: 0.155, detail: 'refused: 400 max_price_exceeded at the billed rate' },
  { id: 'rate', label: 'Billable rate reported', value: 0.15825, detail: 'list × 1.055 markup, from the price header; what the ceiling bounds now' },
], { measure: 'input price for openai/gpt-4o-mini', unit: '', domain: [0, 0.2], formatValue: (value) => `$${value}`, width: 720,
  id: 'router-price-ceiling' }), 2, {
  status: 'measured',
  period: '17 Nov 2026',
  unit: 'US dollars per million input tokens',
  source: { label: 'Tangle Router model catalog', href: 'https://router.tangle.tools/models' },
  method: 'One key, the router release in production that day, 17 Nov 2026 20:04-20:10 UTC. List price: pricing.prompt for openai/gpt-4o-mini in ' +
    'GET /v1/models/user (0.00000015 per token), with pricing_policy.markup 1.055 in the same response. Ceiling: a chat completion with ' +
    'provider.max_price {prompt: 0.155, completion: 0.62} answered 200. ' +
    'Billable rate: that response\'s x-tangle-price-input header, 1.5825e-7 per token ' +
    '(output 6.33e-7). This compares response headers, not a ledger debit. ' +
    'After the router\'s fix (release 61111287, 18 Nov 2026 00:08 UTC), the same request was refused with 400 max_price_exceeded: "billed prompt ' +
    'price $0.15825/M exceeds provider.max_price.prompt $0.155/M" (gen_01M7NZPV3VZ471BYN512FD7CHB), and a ceiling of ' +
    '{prompt: 0.15825, completion: 0.633} answered 200 with the same price headers (gen_01M7NZPVGM8T5AWK4YBX55VQMS).',
});

export const routerFigures = [retries, ceiling];
