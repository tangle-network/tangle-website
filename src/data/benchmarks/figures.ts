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
  type RankedRatesOptions,
  type Refusal,
  type Tier,
} from '@tangle-network/charts';
import type { BoardRecord } from './board-record';

// The benchmark pages draw with @tangle-network/charts. The library draws and
// never decides: ranks, intervals and pass counts come from the record, and a
// figure it cannot draw honestly comes back as a Refusal with its reason.

/** What a report page draws, in the chart library's input types. */
export interface ReportInput {
  /** Descriptive results preserve the registered roster without implying rank. */
  mode?: 'ranked' | 'descriptive';
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
export function reportFigures(
  input: ReportInput,
  options: Pick<RankedRatesOptions, 'orientation' | 'identities'> = {},
): ReportFigures {
  const passTier = input.passTier ? { passTier: input.passTier } : {};
  return {
    board: [
      rankedRates(input.rows, { measure: input.measure, ...passTier, ...(input.mode === 'descriptive' ? { order: 'input' as const } : {}), id: 'ranking', ...options }),
      costFrontier(input.rows, { measure: input.measure, id: 'cost' }),
      comparisonIntervals(input.comparisons, input.rows, { measure: input.measure, id: 'order' }),
    ],
    tasks: [taskMatrix(input.tasks, input.rows, input.cells, { ...passTier, id: 'tasks' })],
  };
}

/**
 * A verified board as the chart library's input. Version 3 records are the
 * library's rows as written; only a label two profiles share gets its id.
 */
export function boardReportInput(board: BoardRecord): ReportInput {
  const shared = (label: string) => board.profiles.filter((profile) => profile.label === label).length > 1;
  return {
    mode: board.mode,
    measure: MEASURE,
    passTier: board.grader.kind === 'app-grade' ? board.grader.passTier : null,
    rows: board.profiles.map((profile) => (shared(profile.label) ? { ...profile, label: `${profile.label} (${profile.id})` } : profile)),
    tasks: board.tasks.map((task) => task.label),
    cells: board.cells,
    comparisons: board.comparisons,
  };
}

/** Identity marks come from the registered provider and harness, never a model-name guess. */
export function boardChartIdentities(board: BoardRecord): RankedRatesOptions['identities'] {
  const providers: Record<string, { label: string; src: string }> = {
    openai: { label: 'OpenAI', src: '/images/models/openai.svg' },
    anthropic: { label: 'Anthropic', src: '/images/models/anthropic.svg' },
    google: { label: 'Google', src: '/images/models/google.svg' },
    zhipu: { label: 'Zhipu', src: '/images/models/zhipu.svg' },
  };
  const harnesses: Record<string, { label: string; src: string }> = {
    opencode: { label: 'OpenCode', src: '/images/harness/opencode.svg' },
    codex: { label: 'Codex', src: '/images/harness/codex.png' },
    'claude-code': { label: 'Claude Code', src: '/images/harness/claude-code.svg' },
    pi: { label: 'Pi', src: '/images/harness/pi.svg' },
  };
  return Object.fromEntries(board.profiles.map((profile) => {
    const model = profile.agentProfile.model;
    const provider = typeof model === 'object' && model !== null && 'provider' in model && typeof model.provider === 'string'
      ? model.provider
      : undefined;
    return [profile.id, {
      ...(provider && providers[provider] ? { model: { ...providers[provider], label: profile.model } } : {}),
      ...(harnesses[profile.harness] ? { harness: harnesses[profile.harness] } : {}),
    }];
  }));
}

/** A drawn figure with its note number, or the library's reason for not drawing it. */
export type FigureSlot = { figure: Figure; note: number } | { refusal: Refusal };

/** What each figure is, for the heading of a figure the library refused to draw. */
export const FIGURE_NAMES: Record<string, string> = {
  ranking: 'Success rate',
  cost: 'Cost per pass',
  order: 'Comparisons',
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
