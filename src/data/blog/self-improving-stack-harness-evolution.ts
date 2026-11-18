// The figures in /blog/self-improving-stack-harness-evolution. Both are captured, not re-run: the numbers are copied
// from agent-eval's archived 2026-09-13 self-improvement evidence audit, which recomputed some arms from the committed
// CodeTraceBench result files of August 2026 and reports the rest as documented. No paid calls ran for this post.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const AUDIT = 'https://github.com/tangle-network/agent-eval/blob/main/archive/2026-09-13-self-improvement-evidence-audit.md';

type Provenance = { period: string; unit: string; method: string };

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : {
        ...figure,
        status: 'captured' as const,
        period: p.period,
        unit: p.unit,
        note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, { label: 'agent-eval evidence audit', href: AUDIT }],
      };

const dollars = (value: number) => `$${value.toFixed(2)}`;

/** Search spend against the spend that proved (or disproved) the result, for two GEPA campaigns. */
export const proofCost = provenance(
  metricBars(
    [
      { id: 'analyst-search', label: 'Analyst prompt: search', value: 4.46, observations: { count: 1, label: 'search' } },
      { id: 'analyst-proof', label: 'Analyst prompt: comparison', value: 50.63, observations: { count: 6, label: 'comparison runs' }, detail: '69 cases × 2 reps per arm' },
      { id: 'transfer-search', label: 'Transfer: search', value: 7.05, observations: { count: 1, label: 'search' } },
      { id: 'transfer-proof', label: 'Transfer: comparison', value: 31.07, observations: { count: 4, label: 'comparison runs' }, detail: '64 cases per arm; candidate rejected' },
    ],
    { measure: 'documented spend per campaign phase', unit: '', domain: [0, 60], formatValue: dollars, width: 720, id: 'loop-proof-cost' },
  ),
  2,
  {
    period: 'GEPA campaigns of 1 and 2 Aug 2026, audited 13 Sep 2026',
    unit: 'US dollars of documented model spend',
    method:
      'Copied from the audit\'s model-backed evidence table, rows "August 1, CodeTraceBench analyst" and "August 2, CodeTraceBench transfer". ' +
      'The analyst campaign used real Python GEPA on a trace-analyst prompt with glm-5.2; the transfer campaign compared a second GEPA candidate with the shipping prompt on fresh OpenHands and Terminus2 traces. ' +
      'Comparison spend sums the documented comparison runs; per-observation costs are labeled estimated, not provider-billed. ' +
      'Search spend is the documented figure; the audit did not recompute it from raw files.',
  },
);

/** Positive-label micro F1 on the retired split3 trace set. */
export const trivialBaseline = provenance(
  metricBars(
    [
      { id: 'constant', label: 'Always predict the last step', value: 0.568, observations: { count: 37, label: 'cases' }, detail: 'no model' },
      { id: 'analyst', label: 'LLM trace analyst', value: 0.18, observations: { count: 37, label: 'cases' }, detail: 'about 0.180' },
    ],
    { measure: 'micro F1 at locating the failing step', unit: '', domain: [0, 1], formatValue: (value) => value.toFixed(3), width: 720, id: 'loop-trivial-baseline' },
  ),
  1,
  {
    period: 'split3 of the 1 Aug 2026 CodeTraceBench certification, retired before 13 Sep 2026',
    unit: 'micro F1 (0 to 1)',
    method:
      'Copied from the audit: "27/37 cases label the final submit step. A constant last-step prediction scored micro F1 0.568 there, versus about 0.180 for the analyst." ' +
      'The audit reports about 0.180 for the analyst; the incumbent, manual and GEPA prompts on split3 scored 0.1693 to 0.1805. ' +
      'The split was retired after this was found, and the pooled result no longer supports a general analysis-quality claim.',
  },
);

export const harnessEvolutionFigures = [trivialBaseline, proofCost];
