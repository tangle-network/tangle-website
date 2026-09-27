import {
  comparisonIntervals,
  costFrontier,
  isRefusal,
  rankedRates,
  taskMatrix,
  type ComparisonRow,
  type Figure,
  type Interval,
  type IntervalMethod,
  type MatrixCell,
  type RateRow,
  type Refusal,
  type Tier,
} from '@tangle-network/charts';
import type { BoardInterval, BoardRecord } from './board-record';

// The benchmark pages draw with @tangle-network/charts. The library draws and
// never decides: ranks, intervals and pass counts come from the record, and a
// figure it cannot draw honestly comes back as a Refusal with its reason.

/** What a report page draws, in the chart library's input types. */
export interface ReportInput {
  /** The measure, lower case. */
  measure: string;
  /** The App Grade tier a pass needs, or null when the runner's verification decides a pass. */
  passTier: Tier | null;
  /** One row per setup, in rank order when every row has a rank. */
  rows: RateRow[];
  /** Task labels in registered order. */
  tasks: string[];
  cells: MatrixCell[];
  comparisons: ComparisonRow[];
}

export interface ReportFigures {
  /** Ranking, cost per pass, and the comparisons that order the ranking. */
  board: Array<Figure | Refusal>;
  tasks: Array<Figure | Refusal>;
}

export const MEASURE = 'pass rate';

/** Every figure a report page shows, in page order. */
export function reportFigures(input: ReportInput): ReportFigures {
  const passTier = input.passTier ? { passTier: input.passTier } : {};
  return {
    board: [
      rankedRates(input.rows, { measure: input.measure, ...passTier, id: 'ranking' }),
      costFrontier(input.rows, { measure: input.measure, id: 'cost' }),
      comparisonIntervals(input.comparisons, input.rows, { measure: input.measure, id: 'order' }),
    ],
    tasks: [taskMatrix(input.tasks, input.rows, input.cells, { ...passTier, id: 'tasks' })],
  };
}

// Version 1 of the board record states its intervals without naming the
// method. The producer fixes them (blueprint-agent scripts/experiments/lib):
// a profile interval is a task-clustered percentile bootstrap
// (board-record.ts:282), and a comparison states the same kind over paired
// differences (publication-decision.ts:705) with the exact McNemar interval
// (publication-decision.ts:275). Version 2 of the record names the method.
const V1_METHOD = { profile: 'task-cluster-bootstrap', comparison: 'task-cluster-bootstrap', exact: 'mcnemar-exact' } as const;

function interval(value: BoardInterval, method: IntervalMethod): Interval {
  return { lower: value.lower, upper: value.upper, level: value.level, method };
}

/** A verified board as the chart library's input. */
export function boardReportInput(board: BoardRecord): ReportInput {
  // Two profiles can share a harness and model label; the id tells them apart.
  const shared = (label: string) => board.profiles.filter((profile) => profile.label === label).length > 1;
  const rows: RateRow[] = board.profiles.map((profile) => ({
    id: profile.id,
    label: shared(profile.label) ? `${profile.label} (${profile.id})` : profile.label,
    rank: profile.rank,
    solved: profile.solved,
    attempts: profile.attempts,
    rate: profile.solveRate,
    // The publication decision computed the interval and gated power on it.
    estimate: 'bootstrap',
    interval: interval(profile.interval, V1_METHOD.profile),
    tiers: profile.tiers,
    cost: { perSolvedUsd: profile.cost.perSolvedUsd, basis: 'receipts', receipts: profile.cost.receipts },
    medianWallMs: profile.medianWallMs,
    // Version 1 records no frontier; the library draws no frontier line without one.
    onFront: null,
  }));
  return {
    measure: MEASURE,
    passTier: board.grader.kind === 'app-grade' ? board.grader.passTier : null,
    rows,
    tasks: board.tasks.map((task) => task.label),
    cells: board.cells.map((cell) => ({
      task: cell.task,
      setup: cell.profile,
      attempts: cell.attempts,
      solved: cell.solved,
      tiers: cell.tiers,
      mean: null,
      costUsd: cell.costUsd,
    })),
    comparisons: board.comparisons.map((comparison) => ({
      favored: comparison.favored,
      other: comparison.other,
      pairs: comparison.pairs,
      minimumEffect: comparison.minimumEffect,
      interval: interval(comparison.interval, V1_METHOD.comparison),
      exactInterval: interval(comparison.exactInterval, V1_METHOD.exact),
    })),
  };
}

/** A drawn figure with its note number, or the library's reason for not drawing it. */
export type FigureSlot = { figure: Figure; note: number } | { refusal: Refusal };

/** What each figure is, for the heading of a figure the library refused to draw. */
export const FIGURE_NAMES: Record<string, string> = {
  ranking: 'Ranking',
  cost: 'Cost per pass',
  order: 'Why the order holds',
  tasks: 'Tasks',
};

/** Number drawn figures in page order; notes list them in the same order. */
export function numberFigures(figures: ReportFigures): { board: FigureSlot[]; tasks: FigureSlot[]; drawn: Figure[] } {
  const drawn: Figure[] = [];
  const slot = (item: Figure | Refusal): FigureSlot => {
    if (isRefusal(item)) return { refusal: item };
    drawn.push(item);
    return { figure: item, note: drawn.length };
  };
  const board = figures.board.map(slot);
  const tasks = figures.tasks.map(slot);
  return { board, tasks, drawn };
}
