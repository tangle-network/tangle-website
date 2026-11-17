// The figures in /blog/ai-accountant-complex-tax-returns.
// Figure 1 is Column Tax's TaxCalcBench README, TY24 leaderboard, GPT-5.4 row, copied as published.
// Figures 2 and 3 are our own TaxCalcBench run (the `tax` board in ../benchmarks/applied, run 19 Jul 2026):
// line accuracy with Student-t 95% intervals, and model cost per return, for five harness and model pairs on 51 TY24 returns.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';
import { boards, harnessLabel, type AppliedRow } from '../benchmarks/applied';

type Provenance = {
  status: 'measured' | 'captured' | 'illustrative';
  period: string;
  unit: string;
  source: { label: string; href: string };
  method: string;
};

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : { ...figure, status: p.status, period: p.period, unit: p.unit, note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, p.source] };

const TCB_REPO = 'https://github.com/column-tax/tax-calc-bench';
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

/** TaxCalcBench TY24, GPT-5.4: the same runs scored four ways. */
export const strictVsLine = provenance(metricBars([
  { id: 'strict', label: 'Whole return, exact', value: 0.6275, detail: 'every line matches' },
  { id: 'lenient', label: 'Whole return, ±$5', value: 0.6667, detail: 'every line within $5' },
  { id: 'line', label: 'By line, exact', value: 0.8978, detail: 'share of lines that match' },
  { id: 'line-lenient', label: 'By line, ±$5', value: 0.9112, detail: 'share of lines within $5' },
], { measure: 'GPT-5.4 on TaxCalcBench TY24', unit: '', domain: [0, 1], formatValue: percent, width: 720,
  id: 'tcb-strict-vs-line' }), 1, {
  status: 'captured',
  period: 'TY24 leaderboard as published in the TaxCalcBench README, read 17 Nov 2026',
  unit: 'share of returns (whole-return bars) or share of lines (by-line bars)',
  source: { label: 'TaxCalcBench README, TY24 leaderboard', href: `${TCB_REPO}#tax-year-ty-24` },
  method: 'Copied from the TY24 table in Column Tax\'s TaxCalcBench README: the GPT-5.4 row, columns "Correct returns (strict)", ' +
    '"Correct returns (lenient)", "Correct (by line)" and "Correct (by line, lenient)". We did not run these numbers. ' +
    'Strict counts a return as correct only when every evaluated line matches exactly; lenient allows ±$5 per line, a tolerance the ' +
    'TaxCalcBench paper (arXiv 2507.16126) says real tax calculation does not allow. GPT-5.4 Pro tied GPT-5.4 on strict at 62.75%, the ' +
    'best TY24 strict score in the table. The TY25 edition (June 2026) uses PDF inputs, state returns and harder cases; its live numbers ' +
    'are at taxcalcbench.ai.',
});

const TAX = boards.find((board) => board.id === 'tax');
if (!TAX) throw new Error('the tax board is missing from /benchmarks/applied');
const RETURNS = { count: 51, label: 'returns' };
const usd = (value: number) => `$${value < 0.1 ? value.toFixed(3) : value.toFixed(2)}`;
const label = (row: AppliedRow) => `${harnessLabel(row)}, ${row.model}`;

const RUN = 'One run on 19 Jul 2026 of Column Tax\'s TaxCalcBench TY24 set, 51 returns per row. ' +
  'Each row is a harness (Codex, Claude Code, or a direct call through Tangle Router) paired with a model. ' +
  'The run data has no repeats, so it says nothing about pass^k consistency. The later TY25 edition adds realistic PDF inputs, ' +
  'state returns and more complex cases, so these TY24 numbers come from the simpler set.';
const LINE_METHOD = 'The measure is line accuracy: the share of evaluated return lines that match the expected output. ' +
  'Intervals are Student-t 95% intervals over per-return line accuracy. We did not compute strict whole-return accuracy and do not report it. ';
const COST_METHOD = 'The measure is model spend per return as metered on the run; it excludes sandbox time. ' +
  'The detail on each row is that pair\'s line accuracy from Figure 2. ';

/** Our run: line accuracy per harness and model, with 95% intervals. */
export const lineAccuracy = provenance(metricBars(
  TAX.rows.map((row) => ({
    id: row.id, label: label(row), value: row.score, interval: { lower: row.lower, upper: row.upper },
    observations: RETURNS, detail: `${usd(row.cost ?? 0)} per return`,
  })),
  { measure: 'line accuracy on TaxCalcBench TY24', unit: '', domain: [0, 1], formatValue: percent, width: 720, id: 'tcb-line-accuracy' },
), 2, {
  status: 'measured',
  period: '19 Jul 2026',
  unit: 'share of return lines correct',
  source: { label: 'TaxCalcBench', href: TCB_REPO },
  method: LINE_METHOD + RUN,
});

/** Our run: model cost per return. */
export const costPerReturn = provenance(metricBars(
  TAX.rows.map((row) => ({
    id: row.id, label: label(row), value: row.cost ?? 0, observations: RETURNS, detail: `${percent(row.score)} line accuracy`,
  })),
  { measure: 'model cost per TY24 return', unit: '', domain: [0, 0.25],
    formatValue: usd, width: 720, id: 'tcb-cost-per-return' },
), 3, {
  status: 'measured',
  period: '19 Jul 2026',
  unit: 'US dollars of model spend per return',
  source: { label: 'TaxCalcBench', href: TCB_REPO },
  method: COST_METHOD + RUN,
});

export const taxAgentFigures = [strictVsLine, lineAccuracy, costPerReturn];
