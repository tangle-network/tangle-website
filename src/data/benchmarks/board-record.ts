import { canonicalCandidateDigest } from '@tangle-network/agent-interface';

// A board is one VerticalBench campaign's record, written by the runner (`vb-publish --board`) only when its
// publication decision allowed it. The runner rechecks its sealed evidence before exporting; this consumer checks
// that the committed bytes are the record the runner signed (its digest) and that the rates it prints are the
// counts it carries. It runs no second statistical model.
export interface BoardInterval { lower: number; upper: number; level: number; method: string }
export interface BoardProfile {
  id: string; rank: number | null; label: string; harness: string; model: string;
  attempts: number; solved: number; rate: number; interval: BoardInterval;
  cost: { totalUsd: number; meanUsd: number; perSolvedUsd: number | null; basis: 'receipts'; receipts: number };
  medianWallMs: number;
}
export interface BoardRecord {
  version: 3;
  mode: 'ranked' | 'descriptive';
  digest: string;
  suite: { id: string; name: string; description: string };
  campaign: { id: string; completedAt: string; repetitions: number; shots: number };
  grader: { kind: 'app-grade'; passTier: string; graderCommit: string } | { kind: 'verification'; pass: string };
  tasks: Array<{ label: string; digest: string }>;
  profiles: BoardProfile[];
  cells: Array<{ task: string; setup: string; attempts: number; solved: number; costUsd: number }>;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 2e-6; // the record rounds to six decimals

/** Every reason a parsed record is not the board the runner published, or none. */
export function boardRecordProblems(value: unknown): string[] {
  const board = value as BoardRecord;
  const problems: string[] = [];
  if (board?.version !== 3 || !['ranked', 'descriptive'].includes(board.mode)) problems.push('not a version 3 ranked or descriptive board');
  if (typeof board?.digest !== 'string') return [...problems, 'no digest'];
  const { digest, ...body } = board;
  if (canonicalCandidateDigest(body) !== digest) problems.push(`digest ${digest} does not match the record`);
  const tasks = new Set(board.tasks.map((t) => t.label));
  for (const p of board.profiles) {
    const own = board.cells.filter((c) => c.setup === p.id);
    const attempts = own.reduce((n, c) => n + c.attempts, 0), solved = own.reduce((n, c) => n + c.solved, 0);
    if (own.length !== tasks.size || attempts !== p.attempts || solved !== p.solved) problems.push(`profile ${p.id} counts do not match its cells`);
    if (!close(p.rate, solved / attempts)) problems.push(`profile ${p.id} rate is not solved over attempts`);
    if (p.rate < p.interval.lower - 2e-6 || p.rate > p.interval.upper + 2e-6) problems.push(`profile ${p.id} interval does not contain its rate`);
    if (!close(p.cost.totalUsd, own.reduce((n, c) => n + c.costUsd, 0)) && Math.abs(p.cost.totalUsd - own.reduce((n, c) => n + c.costUsd, 0)) > own.length * 1e-6) problems.push(`profile ${p.id} cost is not the sum of its cells`);
  }
  return problems;
}

export function verifyBoardRecord(value: unknown, path: string): BoardRecord {
  const problems = boardRecordProblems(value);
  if (problems.length) throw new Error(`benchmark board ${path} is not a published board:\n  ${problems.join('\n  ')}`);
  return value as BoardRecord;
}
