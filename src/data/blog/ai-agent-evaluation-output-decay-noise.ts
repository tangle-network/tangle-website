// The figures in /blog/ai-agent-evaluation-output-decay-noise.
// Figure 1 is worked arithmetic from the comment on OUTPUT_DECAY_MINIMUM_CALLS in agent-eval's behavioral metrics.
// Figure 2 is the mean pass rates the site's recorded eval examples printed on production.
// Figure 3 is worked arithmetic from the 75% per-trial rate in Anthropic's pass^k example.
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

const percent = (value: number) => `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`;

const METRICS = 'https://github.com/tangle-network/agent-eval/blob/main/src/trace-analyst/behavioral-metrics.ts';
const FIX = 'https://github.com/tangle-network/agent-eval/commit/b44898e419af67315c5083e68710ec72e9ee0089';
const EXAMPLE = (path: string) => `https://tangle.tools/?example=${encodeURIComponent(path)}#quickstart-title`;
const ANTHROPIC = 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents';

/** The chance that n distinct, randomly ordered output lengths arrive strictly decreasing: 1/n!. */
export const chance = provenance(
  metricBars(
    [
      { id: 'calls-3', label: '3 calls', value: 0.16666666666666666, detail: '1 in 6', facts: ['The old minimum'] },
      { id: 'calls-4', label: '4 calls', value: 0.041666666666666664, detail: '1 in 24' },
      { id: 'calls-5', label: '5 calls', value: 0.008333333333333333, detail: '1 in 120', facts: ['The current minimum'] },
    ],
    { measure: 'chance a run of output lengths falls every call', unit: '', domain: [0, 0.2], formatValue: percent, width: 720, id: 'decay-chance-by-calls' },
  ),
  1,
  {
    status: 'illustrative',
    period: 'agent-eval behavioral metrics on main, read 17 Nov 2026',
    unit: 'probability under a random-order model',
    sources: [
      { label: 'agent-eval behavioral metrics', href: METRICS },
      { label: 'agent-eval fix: decay fired on three-call noise', href: FIX },
    ],
    method:
      'Worked arithmetic, not a measurement. n distinct values in random order have n! orderings, and one of them is strictly decreasing, ' +
      'so the chance is 1/n!: 1/6 (16.7%) at 3 calls, 1/24 (4.2%) at 4, 1/120 (0.83%) at 5. ' +
      'This is the assumption the source comment states. Real output lengths can tie, hit a response cap or depend on each other, so this is ' +
      'not a false-positive rate for real traces. The current rule also allows equal neighbours and requires the last output to be at most ' +
      '60% of the first; the bars count only the direction condition.',
  },
);

/** Mean pass rate, shipped or baseline against candidate, from three recorded eval examples. */
export const ties = provenance(
  metricBars(
    [
      { id: 'gate-shipped', label: 'Shipped prompt', value: 1, observations: { count: 2, label: 'tasks' }, detail: 'regression-gate' },
      { id: 'gate-candidate', label: 'Candidate prompt', value: 1, observations: { count: 2, label: 'tasks' }, detail: 'regression-gate' },
      { id: 'models-glm', label: 'glm-5.3', value: 1, observations: { count: 3, label: 'tasks' }, detail: 'compare-models' },
      { id: 'models-deepseek', label: 'deepseek-v4.1-flash', value: 1, observations: { count: 3, label: 'tasks' }, detail: 'compare-models' },
      { id: 'agents-claude', label: 'Claude Code', value: 1, observations: { count: 3, label: 'tasks' }, detail: 'compare-harnesses' },
      { id: 'agents-codex', label: 'Codex', value: 1, observations: { count: 3, label: 'tasks' }, detail: 'compare-harnesses' },
    ],
    { measure: 'mean pass rate on the tagged test', unit: '', domain: [0, 1], formatValue: percent, width: 720, id: 'recorded-ties-at-ceiling' },
  ),
  2,
  {
    status: 'measured',
    period: '2 Nov 2026',
    unit: 'share of tasks whose tagged test passed',
    sources: [
      { label: 'regression-gate run', href: EXAMPLE('evals/regression-gate') },
      { label: 'compare-models run', href: EXAMPLE('evals/compare-models') },
      { label: 'compare-harnesses run', href: EXAMPLE('evals/compare-harnesses') },
    ],
    method:
      'Each bar is aggregates.byJudge.suite.mean that one recorded example printed on production on 2 Nov 2026, with @tangle-network/agent-eval 1.0.12 ' +
      'and @tangle-network/sandbox 1.0.168. One trial per task (reps 1, seed 42). Each task ran in a fresh sandbox on the public sandbox-demo ' +
      'repository and was scored 1 when its tagged test exited 0, with npm test filtered by test name. regression-gate used 2 tasks and ' +
      'compare-models and compare-harnesses used 3. compare-models ran glm-5.3 and deepseek/deepseek-v4.1-flash in opencode; compare-harnesses ' +
      'ran Claude Code and Codex on glm-5.3; regression-gate ran Claude Code on glm-5.3 with the default candidate prompt. No interval is drawn: ' +
      'every task passed in every arm, so a bootstrap interval would have zero width.',
  },
);

/** pass@k and pass^k for an agent that solves a task 75% of the time on each independent trial. */
export const evalNoisePassK = provenance(
  metricBars(
    [
      { id: 'pass-1', label: 'pass@1 = pass^1', value: 0.75, detail: 'one trial' },
      { id: 'pass-at-3', label: 'pass@3', value: 0.984375, detail: 'at least one of 3 succeeds: 1 - 0.25^3' },
      { id: 'pass-pow-3', label: 'pass^3', value: 0.421875, detail: 'all 3 succeed: 0.75^3' },
    ],
    { measure: 'chance of success at a 75% per-trial rate', unit: '', domain: [0, 1], formatValue: percent, width: 720, id: 'pass-at-k-vs-pass-pow-k' },
  ),
  3,
  {
    status: 'illustrative',
    period: 'Anthropic\'s 75% example, read 17 Nov 2026',
    unit: 'probability',
    sources: [{ label: 'Anthropic: Demystifying evals for AI agents', href: ANTHROPIC }],
    method:
      'Worked arithmetic, not a measurement. Per-trial success p = 0.75, trials independent. ' +
      'pass@k = 1 - (1 - p)^k, so pass@3 = 1 - 0.25^3 = 0.984 (98.4%). ' +
      'pass^k = p^k, so pass^3 = 0.75^3 = 0.42 (42.2%). ' +
      'Anthropic\'s guide gives the 75% rate and the roughly 42% pass^3; the pass@3 value is our arithmetic from the same rate.',
  },
);

export const evalNoiseFigures = [chance, ties, evalNoisePassK];
