// The figures in /blog/agent-runtime-budget-floor, copied from the numbers agent-runtime #685 recorded in its commit
// message (1 Aug 2026). Six live `pi` children on tangle-router/glm-5.2 settled at these input token counts; parent
// runs authored the four child budgets below; one child overran its budget after writing a correct artifact.
// Nothing here is estimated or rounded. The runtime floor built from these numbers was removed on 4 Aug 2026 (#736);
// the figures show the measurement, not a runtime rule.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const COMMIT = 'https://github.com/tangle-network/agent-runtime/commit/012762f00b012507d924edd6f060e5f7edec9b3a';
const PERIOD = 'August 2026 (recorded 1 Aug 2026)';

const SCOPE =
  'One coding agent (pi) and one model (tangle-router/glm-5.2), measured once in August 2026. ' +
  'It is not a floor for other coding agents, other models, or the same pairing with a different system prompt, tool list or workspace. ' +
  'The runtime briefly refused child budgets below the smallest of these settlements; that refusal was removed on 4 Aug 2026 ' +
  '(agent-runtime #736) and does not exist today.';

type Provenance = { n: number; unit: string; method: string };

const provenance = (figure: Figure | Refusal, p: Provenance) =>
  'refused' in figure
    ? figure
    : {
        ...figure,
        status: 'captured' as const,
        period: PERIOD,
        unit: p.unit,
        note: { ...figure.note, method: p.method },
        sources: [
          { label: 'Measurement notes', href: `#note-${p.n}` },
          { label: 'agent-runtime #685 commit message', href: COMMIT },
        ],
      };

const tokens = (value: number) => value.toLocaleString('en-US');

/** Input tokens at settlement, smallest first, as the record lists them; it records no run order. */
const SETTLEMENTS = [31_211, 32_296, 47_365, 47_965, 48_253, 62_616] as const;
/** The four child budgets parent runs authored. */
const AUTHORED = [2_000, 8_000, 12_000, 20_000] as const;
/** The smallest settlement in the sample. A sample minimum, not a floor for anything outside it. */
const SMALLEST = Math.min(...SETTLEMENTS);

export const settlements = provenance(
  metricBars(
    SETTLEMENTS.map((value, i) => ({
      id: `settlement-${i + 1}`,
      label: `Child ${i + 1}`,
      value,
      observations: { count: 1, label: 'settlement' },
    })),
    { measure: 'input tokens at settlement, smallest first', unit: '', domain: [0, 70_000], formatValue: tokens, width: 720, id: 'budget-floor-settlements' },
  ),
  {
    n: 1,
    unit: 'input tokens per child run',
    method:
      'Copied from the commit message of agent-runtime #685. Six live children, each running the pi coding agent on ' +
      'tangle-router/glm-5.2, settled at these input token counts after 1 to 4 iterations, with 515 to 1,128 output tokens each. ' +
      'The record gives no run order, so the bars are sorted smallest first. ' + SCOPE,
  },
);

export const authored = provenance(
  metricBars(
    [
      ...AUTHORED.map((value, i) => ({
        id: `authored-${i + 1}`,
        label: `Budget ${i + 1}`,
        value,
        observations: { count: 1, label: 'authored budget' },
        detail: `${tokens(SMALLEST - value)} below the smallest settlement`,
      })),
      { id: 'smallest', label: 'Smallest settlement', value: SMALLEST, observations: { count: 6, label: 'settlements (minimum)' }, detail: 'Figure 1, child 1' },
    ],
    { measure: 'tokens: authored child budgets and the smallest input-token settlement', unit: '', domain: [0, 35_000], formatValue: tokens, width: 720, id: 'budget-floor-authored' },
  ),
  {
    n: 2,
    unit: 'tokens',
    method:
      'Copied from the commit message of agent-runtime #685. Parent runs authored these four child budgets for the same ' +
      'pairing as Figure 1. The last bar is the smallest of the six settlements in Figure 1, shown for comparison only. ' + SCOPE,
  },
);

export const overrun = provenance(
  metricBars(
    [
      { id: 'budget', label: 'Budget the parent set', value: 12_000, observations: { count: 1, label: 'authored budget' } },
      { id: 'spent', label: 'Tokens the child spent', value: 76_657, observations: { count: 1, label: 'child run' }, detail: 'artifact written correctly; run recorded as failed' },
    ],
    { measure: 'tokens: one child budget and its spend', unit: '', domain: [0, 80_000], formatValue: tokens, width: 720, id: 'budget-floor-overrun' },
  ),
  {
    n: 3,
    unit: 'tokens',
    method:
      'Copied from the commit message of agent-runtime #685, run proof-native-tools-20260801b. The child wrote its artifact ' +
      'correctly, then overran a 12,000-token budget while spending 76,657, and the run recorded a failure. The record does not ' +
      'split the 76,657 into input and output tokens. ' + SCOPE,
  },
);

export const budgetFloorFigures = [settlements, authored, overrun];
