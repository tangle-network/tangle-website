// The figures in /blog/agent-runtime-budget-floor, drawn from the numbers agent-runtime #685 recorded.
// Source: tangle-network/agent-runtime@012762f, src/runtime/supervise/budget-floor.ts (WORKER_TOKEN_FLOOR.pi and its
// comment) and tests/kernel/budget-floor.test.ts. Six live `pi` children on tangle-router/glm-5.2 settled at these input
// token counts; four separate parent runs authored the child budgets below. Nothing here is estimated or rounded.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const COMMIT = 'https://github.com/tangle-network/agent-runtime/commit/012762f00b012507d924edd6f060e5f7edec9b3a';
const TEST = 'https://github.com/tangle-network/agent-runtime/blob/012762f00b012507d924edd6f060e5f7edec9b3a/tests/kernel/budget-floor.test.ts';
const RECORDED = '1 Aug 2026';

/** Input tokens at settlement, smallest first, as the source lists them; the source records no run order. */
const SETTLEMENTS = [31_211, 32_296, 47_365, 47_965, 48_253, 62_616] as const;
/** The child budgets four parent runs authored. */
const AUTHORED = [2_000, 8_000, 12_000, 20_000] as const;
/** The runtime floor is the smallest settlement ever observed for the pairing, not the median. */
export const FLOOR = Math.min(...SETTLEMENTS);

const tokens = (value: number) => value.toLocaleString('en-US');
const provenance = (figure: Figure | Refusal, status: 'measured' | 'captured', n: number, source: { label: string; href: string }) =>
  'refused' in figure ? figure : {
    ...figure,
    status,
    period: RECORDED,
    unit: 'input tokens',
    sources: [{ label: 'Measurement notes', href: `#note-${n}` }, source],
  };

export const settlements = provenance(
  metricBars(
    SETTLEMENTS.map((value, i) => ({ id: `settlement-${i + 1}`, label: `Run ${i + 1}`, value, observations: { count: 1, label: 'settlement' } })),
    { measure: 'input tokens at settlement, smallest first', unit: '', domain: [0, 70_000], formatValue: tokens, width: 720, id: 'budget-floor-settlements' },
  ),
  'measured', 1, { label: 'agent-runtime #685', href: COMMIT },
);

export const authored = provenance(
  metricBars(
    [
      ...AUTHORED.map((value, i) => ({ id: `authored-${i + 1}`, label: `Budget ${i + 1}`, value, observations: { count: 1, label: 'parent run' }, detail: `${tokens(FLOOR - value)} short` })),
      { id: 'floor', label: 'Floor', value: FLOOR, observations: { count: 6, label: 'settlements (minimum)' }, detail: 'lowest settlement' },
    ],
    { measure: 'child budget', unit: '', domain: [0, 35_000], formatValue: tokens, width: 720, id: 'budget-floor-authored' },
  ),
  'captured', 2, { label: 'budget-floor.test.ts', href: TEST },
);

export const figures = [settlements, authored];
