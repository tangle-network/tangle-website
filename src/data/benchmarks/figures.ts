import {
  comparisonIntervals,
  costFrontier,
  isRefusal,
  rankedRates,
  taskMatrix,
  type ComparisonRow,
  type Figure,
  type MatrixCell,
  type RateRow,
  type Refusal,
  type Tier,
} from '@tangle-network/charts';
import type { BoardRecord } from './board-record';

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

/**
 * A verified board as the chart library's input. Version 2 records are the
 * library's rows as written; only a label two profiles share gets its id.
 */
export function boardReportInput(board: BoardRecord): ReportInput {
  const shared = (label: string) => board.profiles.filter((profile) => profile.label === label).length > 1;
  return {
    measure: MEASURE,
    passTier: board.grader.kind === 'app-grade' ? board.grader.passTier : null,
    rows: board.profiles.map((profile) => (shared(profile.label) ? { ...profile, label: `${profile.label} (${profile.id})` } : profile)),
    tasks: board.tasks.map((task) => task.label),
    cells: board.cells,
    comparisons: board.comparisons,
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
