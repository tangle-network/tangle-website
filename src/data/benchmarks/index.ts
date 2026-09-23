import { verifyBoardRecord, type BoardRecord } from './board-record';

// Every board on /benchmarks is a record in ./boards, written by the benchmark
// runner's `vb-publish --board` for a campaign its publication decision allowed.
// Nothing here is authored: no suite list, no scores, no status. A record that
// does not verify stops the build, and a suite without a record has no page.
const files = import.meta.glob<unknown>('./boards/*.json', { eager: true, import: 'default' });

export const boards: BoardRecord[] = Object.entries(files)
  .map(([path, value]) => {
    const board = verifyBoardRecord(value, path);
    const expected = `./boards/${board.suite.id}.json`;
    if (path !== expected) throw new Error(`benchmark board ${path} holds suite ${board.suite.id}; it belongs at ${expected}`);
    return board;
  })
  .sort((a, b) => b.campaign.completedAt.localeCompare(a.campaign.completedAt));

export function boardById(id: string): BoardRecord | undefined {
  return boards.find((board) => board.suite.id === id);
}
