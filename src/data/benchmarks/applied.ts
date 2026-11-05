// Every board on /benchmarks/applied, in one shape. See boards/README.md for how a board gets here.
import { verifyBoardRecord, type BoardRecord } from './board-record';

export interface AppliedRow { id: string; model: string; harness: string; score: number; lower: number; upper: number; samples: string; detail?: string; cost?: number }
export interface AppliedBoard { id: string; title: string; measure: string; max: number; percent: boolean; interval: 'student-t' | 'task-cluster-bootstrap'; date: string; by: string; url: string; costTitle?: string; rows: AppliedRow[] }

const HARNESSES: Record<string, { label: string; src?: string }> = {
  'claude-code': { label: 'Claude Code', src: '/images/harness/claude-code.svg' },
  codex: { label: 'Codex', src: '/images/harness/codex.png' },
  opencode: { label: 'OpenCode', src: '/images/harness/opencode.svg' },
  router: { label: 'Direct API call' },
  'legal-agent': { label: 'Tangle legal agent' },
};
const MAKERS: Record<string, string> = { Claude: 'anthropic', GPT: 'openai', Gemini: 'google', GLM: 'zhipu' };

const modelName = (id: string) => id.replace(/^gpt-([\d.]+)-(\w)(\w*)/, (_, version, first, rest) => `GPT-${version} ${first.toUpperCase()}${rest}`);

// The sealed records `vb-publish` writes. A board that does not verify stops the build.
const sealed = (board: BoardRecord): AppliedBoard => ({
  id: board.suite.id,
  title: board.suite.name.split(' on ')[0],
  measure: 'Tasks solved',
  max: 1,
  percent: true,
  interval: 'task-cluster-bootstrap',
  date: board.campaign.completedAt.slice(0, 10),
  by: 'VerticalBench',
  url: 'https://github.com/tangle-network/blueprint-agent',
  costTitle: `${board.suite.name.split(' ')[0]}: cost per solved task`,
  rows: board.profiles.map((p) => ({ id: p.id, model: modelName(p.model), harness: p.harness, score: p.rate, lower: p.interval!.lower, upper: p.interval!.upper, samples: `${p.solved} of ${p.attempts} attempts`, ...(p.cost.perSolvedUsd === null ? {} : { cost: p.cost.perSolvedUsd }) })),
});

const records = import.meta.glob<unknown>('./boards/*.json', { eager: true, import: 'default' });
const imported = import.meta.glob<{ record: Omit<AppliedBoard, 'interval'> & { interval: string } }>('./applied/*.json', { eager: true, import: 'default' });

export const boards: AppliedBoard[] = [
  ...Object.values(imported).map((file) => file.record as AppliedBoard),
  ...Object.entries(records).map(([path, value]) => {
    const board = verifyBoardRecord(value, path);
    if (!path.endsWith(`/boards/${board.suite.id}.json`)) throw new Error(`benchmark board ${path} holds suite ${board.suite.id}`);
    return sealed(board);
  }),
].sort((a, b) => b.rows.length - a.rows.length || a.id.localeCompare(b.id));

export const identity = (row: AppliedRow) => {
  const harness = HARNESSES[row.harness];
  if (!harness) throw new Error(`benchmark board names an unknown harness: ${row.harness}`);
  const maker = MAKERS[row.model.split(/[ -]/)[0]];
  return {
    ...(maker ? { model: { label: row.model, src: `/images/models/${maker}.svg` } } : {}),
    harness,
  };
};
export const harnessLabel = (row: AppliedRow) => HARNESSES[row.harness].label;
