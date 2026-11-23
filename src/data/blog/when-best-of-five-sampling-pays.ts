// The figures in /blog/when-best-of-five-sampling-pays.
// Figures 1 and 2 are our own run of 2026-11-18 on sandbox-demo: metered spend per task in round 1, and how many
// attempts fixed all three bugs under each round's prompt. Figure 3 and Figure 4 come from two recorded production runs of the site's fleet examples (src/data/runs/fleets/fan-out.json
// and src/data/runs/fleets/cancel-on-cap.json): event timestamps and per-agent costs, copied without rounding beyond one
// decimal (seconds) or three (dollars). Figure 5 is worked arithmetic from the pass@k and pass^k definitions in Anthropic's
// "Demystifying evals for AI agents".
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

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

const seconds = (value: number) => `${value.toFixed(1)} s`;
const dollars = (value: number) => `$${value.toFixed(3)}`;
const percent = (value: number) => `${value.toFixed(1)}%`;

const dollars4 = (value: number) => `$${value.toFixed(4)}`;

/** Metered spend per task in round 1: one strong-model attempt against the sum of three cheap-model attempts. */
export const cheapVsStrong = provenance(
  metricBars(
    [
      { id: 'cli-strong', label: 'cli-flag, strong ×1', value: 0.1207, observations: { count: 1, label: 'attempt' }, detail: 'passed' },
      { id: 'cli-cheap', label: 'cli-flag, cheap ×3', value: 0.0451, observations: { count: 3, label: 'attempts' }, detail: 'all 3 passed' },
      { id: 'null-strong', label: 'null-guard, strong ×1', value: 0.0759, observations: { count: 1, label: 'attempt' }, detail: 'passed' },
      { id: 'null-cheap', label: 'null-guard, cheap ×3', value: 0.0196, observations: { count: 3, label: 'attempts' }, detail: 'all 3 passed' },
      { id: 'tz-strong', label: 'timezone, strong ×1', value: 0.0819, observations: { count: 1, label: 'attempt' }, detail: 'passed' },
      { id: 'tz-cheap', label: 'timezone, cheap ×3', value: 0.0286, observations: { count: 3, label: 'attempts' }, detail: 'all 3 passed' },
    ],
    { measure: 'metered dollars per task', unit: '', domain: [0, 0.14], formatValue: dollars4, width: 720, id: 'cheap-vs-strong-spend' },
  ),
  1,
  {
    status: 'measured',
    period: '18 Nov 2026, 00:09:59 to 00:21:41 UTC',
    unit: 'US dollars of metered model spend per task',
    source: { label: 'Repository: sandbox-demo', href: 'https://github.com/tangle-network/sandbox-demo' },
    method:
      'Round 1 of our own run, sandbox SDK 1.0.446, agent opencode, at most 40 tool calls per attempt. ' +
      'Three tasks in sandbox-demo, each one deliberately failing test (CLI flag coercion, missing null guard, timezone). ' +
      'Prompt: "The test tagged <task> fails. Fix the cause." Per task: one attempt on google/gemini-2.5-pro (strong) and three independent ' +
      'attempts on deepseek/deepseek-v4.1-flash (cheap), each in its own fresh sandbox; served model confirmed per attempt. Pass means the full ' +
      'npm test run reported 9 tests with the targeted test passing and no change to a test file, package.json or .npmrc. All 12 attempts passed. ' +
      "Values are metered spend from the platform ledger: each sandbox's agent turns bill to its own child key, and the desk read those rows at 00:31Z. " +
      'Strong: cli-flag $0.1207, null-guard $0.0759, timezone $0.0819 (sum $0.2785). Cheap bars sum three attempts: cli-flag $0.0196 + $0.0112 + $0.0143; ' +
      'null-guard $0.0074 + $0.0037 + $0.0085; timezone $0.0110 + $0.0125 + $0.0051 (the desk gives the arm total as $0.0932). ' +
      'One attempt per strong bar, so no spread is claimed. No value is computed from a price list.',
  },
);

/** Share of attempts that fixed all three planted bugs, by prompt, rounds 1 and 2. */
export const promptScope = provenance(
  metricBars(
    [
      { id: 'round-1', label: 'Round 1: fix the tagged test', value: (2 / 12) * 100, observations: { count: 12, label: 'attempts' }, detail: '2 of 12 fixed all three bugs' },
      { id: 'round-2', label: 'Round 2: make all 9 tests pass', value: 100, observations: { count: 8, label: 'attempts' }, detail: '8 of 8 fixed all three bugs' },
    ],
    { measure: 'attempts that fixed all three bugs', unit: '', domain: [0, 100], formatValue: percent, width: 720, id: 'prompt-scope-all-bugs' },
  ),
  2,
  {
    status: 'measured',
    period: '18 Nov 2026, 00:09:59 to 00:40:51 UTC',
    unit: 'percent of attempts',
    source: { label: 'Repository: sandbox-demo', href: 'https://github.com/tangle-network/sandbox-demo' },
    method:
      'Rounds 1 and 2 of our own run on sandbox-demo, agent opencode, models google/gemini-2.5-pro and deepseek/deepseek-v4.1-flash, each attempt ' +
      'in its own fresh sandbox. Round 1 (00:09:59 to 00:21:41 UTC): prompt "The test tagged <task> fails. Fix the cause.", 12 attempts (3 strong, 9 cheap), ' +
      'at most 40 tool calls per attempt; all passed their own check, and 2 (cli-flag strong and cli-flag cheap attempt 1) ended at 9 of 9 tests. ' +
      'Round 2 (00:32:45 to 00:40:51 UTC): prompt "Three of the nine tests fail. Make all 9 tests pass.", 8 attempts (2 strong, 6 cheap), 60 tool calls ' +
      'and 600 s per attempt at most; every attempt ended at 9 tests, 9 pass, 0 fail, and changed only the three source files. No attempt in either round ' +
      'touched a test file, package.json or .npmrc. One agent and one repository; the rounds differ in the prompt and in the per-attempt caps.',
  },
);

/** Seconds from the fleet's agent.started events (6.87 s into the script) to each reviewer's agent.finished event. */
export const fanOut = provenance(
  metricBars(
    [
      { id: 'cli', label: 'cli', value: 10.4, observations: { count: 1, label: 'run' }, detail: 'completed' },
      { id: 'web', label: 'web', value: 10.7, observations: { count: 1, label: 'run' }, detail: 'completed' },
      { id: 'worker', label: 'worker', value: 12.0, observations: { count: 1, label: 'run' }, detail: 'completed' },
      { id: 'shared', label: 'shared', value: 12.8, observations: { count: 1, label: 'run' }, detail: 'completed' },
      { id: 'api', label: 'api', value: 38.7, observations: { count: 1, label: 'run' }, detail: 'completed; the fleet waited for it' },
    ],
    { measure: 'seconds from start to finish, per reviewer', unit: '', domain: [0, 45], formatValue: seconds, width: 720, id: 'fan-out-finish-times' },
  ),
  3,
  {
    status: 'measured',
    period: '12 Nov 2026',
    unit: 'seconds of wall time per agent',
    source: { label: 'Example: fleets/fan-out', href: 'https://tangle.tools/?example=fleets%2Ffan-out#quickstart-title' },
    method:
      'One recorded production run of the fleets/fan-out example: fleet fleet_b6e630a465a646d98378f5ad, recorded 2026-11-12T22:43:42Z, exit 0, ' +
      'sandbox SDK 1.0.168, Codex agent, dedicated placement, one sandbox per agent, budgetUsd 3. All five agent.started events ' +
      'arrived at 6.868-6.869 s after script start; agent.finished arrived at 17.224 s (cli), 17.520 s (web), 18.856 s (worker), 19.698 s ' +
      '(shared) and 45.577 s (api). Each bar is finish minus start. fleet.finished reported durationMs 39308 and spentUsd 0.037288 of the $3 cap. ' +
      'One run, so no spread is claimed.',
  },
);

/** Dollars each attempt had spent when the run ended, from the results the script printed. */
export const cancelOnCap = provenance(
  metricBars(
    [
      { id: 'agent-0', label: 'Lookup table', value: 0.037, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
      { id: 'agent-1', label: 'Streaming parser', value: 0.041, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
      { id: 'agent-2', label: 'Fewer allocations', value: 0.035, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
      { id: 'agent-3', label: 'Worker threads', value: 0.028, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
      { id: 'agent-4', label: 'WebAssembly', value: 0.034, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
      { id: 'agent-5', label: 'Hand-written tokenizer', value: 0.038, observations: { count: 1, label: 'run' }, detail: 'cancelled' },
    ],
    { measure: 'dollars spent per attempt', unit: '', domain: [0, 0.05], formatValue: dollars, width: 720, id: 'cancel-on-cap-spend' },
  ),
  4,
  {
    status: 'measured',
    period: '18 Nov 2026',
    unit: 'US dollars of metered spend per attempt',
    source: { label: 'Example: fleets/cancel-on-cap', href: 'https://tangle.tools/?example=fleets%2Fcancel-on-cap#quickstart-title' },
    method:
      'One recorded production run of the fleets/cancel-on-cap example: fleet fleet_db3cca8418444c7cb7b75a49, recorded 2026-11-18, exit 0, ' +
      'sandbox SDK 1.0.443, Claude Code agent on deepseek/deepseek-v4.1-flash, six attempts at "Make bench/parse.js faster with <idea>". ' +
      'budgetUsd 2 is the platform hard cap; the script polls fleet.spend() every 5 s and calls fleet.cancel() at or above $0.20. ' +
      'Values are r.costUsd as printed per agent (0.037119, 0.040766, 0.034504, 0.028346, 0.034091, 0.038037), rounded to three decimals; ' +
      'they sum to $0.2129, matching the "$0.21 spent" line. fleet.cancel() reported 6 interrupted, and all six agents ended cancelled.',
  },
);

/** pass@k and pass^k at a 75% per-trial success rate, k = 3, assuming independent trials. */
export const passK = provenance(
  metricBars(
    [
      { id: 'one', label: 'One trial', value: 75, detail: 'per-trial success rate' },
      { id: 'pass-at-3', label: 'pass@3', value: 98.4, detail: 'at least one of 3 succeeds: 1 − 0.25³' },
      { id: 'pass-hat-3', label: 'pass^3', value: 42.2, detail: 'all 3 succeed: 0.75³' },
    ],
    { measure: 'probability, three trials at 75% each', unit: '', domain: [0, 100], formatValue: percent, width: 720, id: 'pass-at-k-vs-pass-hat-k' },
  ),
  5,
  {
    status: 'illustrative',
    period: 'Definitions as published; read 17 Nov 2026',
    unit: 'percent probability',
    source: { label: 'Anthropic: Demystifying evals for AI agents', href: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents' },
    method:
      'Worked arithmetic, not a measurement. Anthropic defines pass@k as the likelihood of at least one correct solution in k attempts and pass^k as the ' +
      'probability that all k trials succeed, with the example (0.75)^3 ≈ 42%. pass@3 here is 1 − (1 − 0.75)^3, which assumes the three trials fail ' +
      'independently; shared state between trials breaks that assumption. pass@k is only reachable in production when a selector can tell which attempt succeeded.',
  },
);

export const bestOfFiveFigures = [cheapVsStrong, promptScope, fanOut, cancelOnCap, passK];
