import redirects from '../../../public/_redirects?raw';
import { verifyBoardRecord, type BoardRecord } from './board-record';

// Every board on /benchmarks is a record in ./boards, written by the benchmark
// runner's `vb-publish --board` for a campaign its publication decision allowed.
// Nothing here is authored: no suite list, no scores, no status. A record that
// does not verify stops the build, and a suite without a record has no page.
const files = import.meta.glob<unknown>('./boards/*.json', { eager: true, import: 'default' });

// The retired hand-written suite pages redirect to /benchmarks. A redirect would
// hide a board published under the same id, so that combination stops the build.
const redirected = new Set(
  redirects.split('\n').map((line) => line.trim().split(/\s+/)[0]?.replace(/\/$/, '')).filter(Boolean),
);

export const boards: BoardRecord[] = Object.entries(files)
  .map(([path, value]) => {
    const board = verifyBoardRecord(value, path);
    const expected = `./boards/${board.suite.id}.json`;
    if (path !== expected) throw new Error(`benchmark board ${path} holds suite ${board.suite.id}; it belongs at ${expected}`);
    if (redirected.has(`/benchmarks/${board.suite.id}`)) {
      throw new Error(`benchmark board ${path}: public/_redirects redirects /benchmarks/${board.suite.id}; remove that redirect to publish it`);
    }
    return board;
  })
  .sort((a, b) => b.campaign.completedAt.localeCompare(a.campaign.completedAt));

export function boardById(id: string): BoardRecord | undefined {
  return boards.find((board) => board.suite.id === id);
}
