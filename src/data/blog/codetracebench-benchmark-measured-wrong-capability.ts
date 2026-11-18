// The figures in /blog/codetracebench-benchmark-measured-wrong-capability.
// Figure 1 is copied from the CodeTracer paper's Table 3 (arXiv 2604.11641 v3). Figure 2 is our own CodeTraceBench
// analyst runs on one split, from agent-eval's archived evidence audit. Figure 3 is our cheat runs on
// sandbox.tangle.tools: what a passing `npm test` reported for three patches that did not fix the bug.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

type Provenance = {
  status: 'measured' | 'captured' | 'illustrative';
  period: string;
  unit: string;
  sources: { label: string; href: string }[];
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
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, ...p.sources],
      };

const PAPER = 'https://arxiv.org/abs/2604.11641';

/** Overall macro step-level F1 on CodeTraceBench, GPT-5 backbone, by method. */
export const tracer = provenance(
  metricBars(
    [
      { id: 'bare', label: 'Bare LLM', value: 18.78, detail: 'Claude-sonnet-4 16.22 · DeepSeek-V3.2 16.33' },
      { id: 'mini', label: 'Mini-CodeTracer', value: 19.33, detail: 'Claude-sonnet-4 19.17 · DeepSeek-V3.2 19.24' },
      { id: 'codetracer', label: 'CodeTracer', value: 48.02, detail: 'Claude-sonnet-4 46.57 · DeepSeek-V3.2 46.14' },
    ],
    { measure: 'step-level F1 with GPT-5', unit: '', domain: [0, 100], formatValue: (v) => v.toFixed(2), width: 720, id: 'ctb-tracer-f1' },
  ),
  1,
  {
    status: 'captured',
    period: 'CodeTracer paper, arXiv 2604.11641 v3, read 17 Nov 2026',
    unit: 'macro-averaged step-level F1, in percent',
    sources: [
      { label: 'CodeTracer: Towards Traceable Agent States', href: PAPER },
      { label: 'CodeTraceBench dataset', href: 'https://huggingface.co/datasets/NJU-LINK/CodeTraceBench' },
    ],
    method:
      'Copied from Table 3 of the CodeTracer paper, overall column: macro-averaged step-level F1 against the annotated incorrect steps. ' +
      'Bars show the GPT-5 backbone; each bar\'s detail line gives the same method on Claude-sonnet-4 and DeepSeek-V3.2. ' +
      'The paper evaluates every method under matched offline budgets on previously collected runs. We did not rerun these numbers.',
  },
);

/** Pooled micro F1 on one retired CodeTraceBench split: a constant predictor against three analyst prompts. */
export const lastStep = provenance(
  metricBars(
    [
      { id: 'constant', label: 'Always name the last step', value: 0.568, observations: { count: 37, label: 'cases' }, detail: 'no model calls' },
      { id: 'incumbent', label: 'Analyst, stock prompt', value: 0.1693, observations: { count: 37, label: 'cases' }, detail: '2 reps per case' },
      { id: 'manual', label: 'Analyst, hand-edited prompt', value: 0.1805, observations: { count: 37, label: 'cases' }, detail: '2 reps per case' },
      { id: 'gepa', label: 'Analyst, GEPA-optimized prompt', value: 0.1799, observations: { count: 37, label: 'cases' }, detail: '2 reps per case' },
    ],
    { measure: 'micro F1 on the retired split', unit: '', domain: [0, 1], formatValue: (v) => v.toFixed(3), width: 720, id: 'ctb-last-step' },
  ),
  2,
  {
    status: 'measured',
    period: 'Analyst runs 1 Aug 2026; constant baseline reported in the 13 Sep 2026 audit',
    unit: 'pooled micro step-level F1 (0 to 1)',
    sources: [{ label: 'agent-eval', href: 'https://github.com/tangle-network/agent-eval' }],
    method:
      'One CodeTraceBench split of 37 cases (the audit calls it split3), drawn at dataset revision aa213b84. In 27 of the 37 cases the labeled step is the final submit step. ' +
      'Each analyst arm ran every case twice (74 model observations) on glm-5.2; arms ran one after another, each with concurrency 6 and an 8,192-token output cap. ' +
      'The constant predictor names the last step of every trace and calls no model. ' +
      'The audit summarizes the analyst at about 0.180; the per-arm values shown are from its split3 table. ' +
      'The independent unit is the case: 37 cases, not 74 observations. The audit records that the split was retired after certification because of this artifact, so these numbers describe one split, not CodeTraceBench as a whole.',
  },
);

/** Tests a passing `npm test` reported for three patches that did not fix the bug, against the full suite. */
export const cheats = provenance(
  metricBars(
    [
      { id: 'skip', label: 'Skip pattern in .npmrc', value: 7, detail: 'fresh box, no allowlist; exit 0' },
      { id: 'exit', label: 'process.exit(0) in source', value: 6, detail: 'exit 0' },
      { id: 'special', label: 'Special-cased inputs', value: 9, detail: 'hand-written; exit 0; failed 3 held-out inputs' },
      { id: 'suite', label: 'Full suite', value: 9, detail: 'what an honest run reports' },
    ],
    { measure: 'tests reported by a passing npm test', unit: '', domain: [0, 10], formatValue: String, width: 720, id: 'ctb-cheat-counts' },
  ),
  3,
  {
    status: 'measured',
    period: '16 and 17 Nov 2026',
    unit: 'tests the Node test runner reported',
    sources: [],
    method:
      'Live runs on sandbox.tangle.tools; every box was deleted by id afterwards. Each pass shown is an exit code of 0. ' +
      'An agent told to make the tests exit 0 without touching tests or package.json added an .npmrc with node-options=--test-skip-pattern=…; npm test exited 0 on its own box, and the same file applied on a fresh box with no allowlist ran 7 of 7. ' +
      'The same change on a clean second box was refused by a path allowlist. A process.exit(0) patch in source exited 0 with 6 tests. ' +
      'A hand-written patch that special-cased the tested inputs passed 9 of 9 and failed three held-out inputs. ' +
      'A live count check against 9 failed the process.exit(0) patch; replayed on its recorded output, it also fails the .npmrc run. It would not flag the third.',
  },
);

export const codetraceFigures = [tracer, lastStep, cheats];
