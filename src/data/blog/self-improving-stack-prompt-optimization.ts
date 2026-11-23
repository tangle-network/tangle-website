// The figures in /blog/self-improving-stack-prompt-optimization. Every value is copied from a published record:
// Simon Willison's dspy-datasette-agent-prompts report (figure 1) and agent-eval's archived 2026-09-13 evidence audit
// (figures 2 to 4). Nothing here was re-run for this post.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const WILLISON = { label: 'Willison: dspy-datasette-agent-prompts', href: 'https://github.com/simonw/research/tree/main/dspy-datasette-agent-prompts' };
const AUDIT = {
  label: 'agent-eval evidence audit',
  href: 'https://github.com/tangle-network/agent-eval/blob/main/archive/2026-09-13-self-improvement-evidence-audit.md',
};

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
    : {
        ...figure,
        status: p.status,
        period: p.period,
        unit: p.unit,
        note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, p.source],
      };

const pct = (value: number) => `${value.toFixed(1)}%`;
const f1 = (value: number) => value.toFixed(4);
const usd = (value: number) => `$${value.toFixed(2)}`;

/** Willison's GEPA run: the training score went up and the held-out score went down. */
export const willison = provenance(
  metricBars(
    [
      { id: 'base-train', label: 'Production prompt, train', value: 90.0, observations: { count: 20, label: 'questions' } },
      { id: 'gepa-train', label: 'GEPA prompt, train', value: 95.0, observations: { count: 20, label: 'questions' }, detail: '+5 points' },
      { id: 'base-test', label: 'Production prompt, held-out', value: 95.0, observations: { count: 10, label: 'questions' } },
      { id: 'gepa-test', label: 'GEPA prompt, held-out', value: 85.0, observations: { count: 10, label: 'questions' }, detail: '−10 points' },
    ],
    { measure: 'gold values visible to the user', unit: '', domain: [0, 100], formatValue: pct, width: 720, id: 'willison-train-vs-heldout' },
  ),
  1,
  {
    status: 'captured',
    period: 'Run published 2 Jul 2026; read 17 Nov 2026',
    unit: 'percent of gold check values present in the user-visible answer, averaged over the split',
    source: WILLISON,
    method:
      'Copied from the report\'s results table with the corrected metric. Task model gpt-4.1-nano, reflection model gpt-5-mini, ' +
      'dspy.GEPA auto="light", temperature 0, dspy 3.2.1, datasette 1.0a35, datasette-agent 0.3a0. 20 training questions served ' +
      'both GEPA rollouts and candidate selection (no separate valset); 10 questions were held out. GEPA accepted one mutation, ' +
      'growing a ~2,400-character prompt to ~8,800 characters. Each held-out question is worth 10 points. The repository marks ' +
      'the write-up as AI-generated research.',
  },
);

/** What finding a candidate cost against what checking it cost, in two of our runs. */
export const promptOptCost = provenance(
  metricBars(
    [
      { id: 'r1-search', label: 'First run: GEPA search', value: 4.46, detail: '10 train / 6 selection cases' },
      { id: 'r1-proof', label: 'First run: proof', value: 50.63, detail: 'six comparison runs' },
      { id: 'r2-search', label: 'Transfer run: GEPA search', value: 7.05, detail: '12 selection cases' },
      { id: 'r2-proof', label: 'Transfer run: proof', value: 31.07, detail: 'four comparison runs' },
    ],
    { measure: 'documented model cost', unit: '', domain: [0, 60], formatValue: usd, width: 720, id: 'search-vs-proof-cost' },
  ),
  2,
  {
    status: 'captured',
    period: 'Runs of 1 and 2 Aug 2026, audited 13 Sep 2026',
    unit: 'US dollars of documented model cost',
    source: AUDIT,
    method:
      'Copied from the audit\'s model-backed evidence table (CodeTraceBench analyst rows). Search is the official Python GEPA ' +
      'instruction search; proof is the documented total of the comparison runs used to decide promotion. Per-observation costs ' +
      'are labeled estimated in the raw results, not provider-billed. Ratios: 50.63 / 4.46 ≈ 11.4; 31.07 / 7.05 ≈ 4.4. ' +
      'First run: analyst model glm-5.2 through z.ai; the transfer run used the same analyst engine and model for both arms. Proof totals are documented in the reports; the incumbent, manual and G2 raw files ' +
      'were unavailable to the audit, so they were not independently recomputed.',
  },
);

/** The three-arm comparison: stock prompt, a manual edit and GEPA's instructions on the same final cases. */
export const arms = provenance(
  metricBars(
    [
      { id: 'stock', label: 'Stock prompt', value: 0.4285, observations: { count: 138, label: 'model observations' } },
      { id: 'manual', label: 'Manual edit (W)', value: 0.4047, observations: { count: 138, label: 'model observations' } },
      { id: 'gepa', label: 'GEPA instructions (G)', value: 0.4809, observations: { count: 138, label: 'model observations' } },
    ],
    { measure: 'pooled micro F1', unit: '', domain: [0, 1], formatValue: f1, width: 720, id: 'three-arm-micro-f1' },
  ),
  3,
  {
    status: 'captured',
    period: 'Run of 1 Aug 2026, audited 13 Sep 2026',
    unit: 'pooled positive-label micro F1 (0 to 1)',
    source: AUDIT,
    method:
      'Copied from the audit. 69 cases (32 holdout2, 37 split3), 2 repetitions, 138 model observations per arm; glm-5.2, stock ' +
      'DSPy RLM execution, seed 0. Paired F1 intervals for GEPA against stock: [−0.027, +0.067] on holdout2 and [−0.042, +0.046] on ' +
      'split3. For the manual arm against stock: [−0.096, +0.001] and [−0.064, +0.053]. All four cross zero; reported median paired ' +
      'delta was zero for all four. Promotion followed a preregistered pooled point-estimate rule. split3 was retired afterwards ' +
      'because a constant last-step prediction scored micro F1 0.568 on it. Incumbent and manual raw files were unavailable to the audit.',
  },
);

/** A GEPA challenger that won on selection data and lost on fresh agent families. */
export const transfer = provenance(
  metricBars(
    [
      { id: 'g1', label: 'Shipping prompt (G1)', value: 0.2489, observations: { count: 128, label: 'model observations' } },
      { id: 'g2', label: 'GEPA challenger (G2)', value: 0.1928, observations: { count: 128, label: 'model observations' }, detail: '−0.0561; rejected' },
    ],
    { measure: 'fresh pooled micro F1', unit: '', domain: [0, 1], formatValue: f1, width: 720, id: 'g2-transfer' },
  ),
  4,
  {
    status: 'captured',
    period: 'Run of 2 Aug 2026, audited 13 Sep 2026',
    unit: 'pooled positive-label micro F1 (0 to 1)',
    source: AUDIT,
    method:
      'Copied from the audit. 64 fresh cases from the OpenHands and Terminus2 agent families, 128 observations per arm, same ' +
      'analyst engine and model. G2\'s search had improved a weighted selection objective by 0.064 on 12 cases. Per-family paired ' +
      'intervals: OpenHands [−0.126, +0.058], Terminus2 [−0.143, +0.023]. Failures: 3/128 for G2, 0/128 for G1. The fixed promotion ' +
      'rule rejected G2. G2 raw files were unavailable to the audit.',
  },
);

export const promptOptFigures = [willison, promptOptCost, arms, transfer];
