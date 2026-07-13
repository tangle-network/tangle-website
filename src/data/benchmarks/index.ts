import type { DomainBoard } from './schema';

// Domain leaderboards. Rows come from real eval runs, exported by
// scripts/run-domain-bench.mjs into benchmark-results/<domain>.json and
// imported here. Until a domain is swept across a profile matrix it stays
// 'partial' (seeded with the real single scores we have) or 'awaiting-run'.
// Never hand-write a competitor/model row that wasn't measured.

// Tax: real score exists from agent-eval round 1 (blueprint-agent / sonnet-5,
// blended 0.828 over n=74). One real row today; the profile sweep fills the
// rest of the board.
export const tax: DomainBoard = {
  id: 'tax',
  domain: 'Tax',
  blurb: 'Complex individual and business returns, multi-form reasoning, citation to code sections.',
  target: 0.8,
  source: 'agent-eval/.evolve/scorecard.json (round 1) + tax-agent tests/eval/canonical.ts',
  status: 'partial',
  lastRun: '2026-05-21',
  taskCount: 74,
  rows: [
    { model: 'claude-sonnet-5', harness: 'blueprint-agent', score: 0.828, n: 74, date: '2026-05-21', highlight: true },
  ],
};

// Legal: sessions captured (n=36) but the scoring harness was in repair, so
// there is no trustworthy blended score to publish. Awaiting a clean run.
export const legal: DomainBoard = {
  id: 'legal',
  domain: 'Legal',
  blurb: 'Contract review, case management workflows, jurisdiction-aware drafting.',
  target: 0.8,
  source: 'legal-agent tests/eval/canonical.ts',
  status: 'awaiting-run',
  taskCount: 36,
  rows: [],
};

// CompanyBench (VerticalBench): the coding/app-build system across verticals.
// Real per-generation data exists (gen43: 27 sessions, 7 verticals) but as
// layer pass-rates, not a per-profile blended score board yet. Awaiting the
// profile-matrix export.
export const companybench: DomainBoard = {
  id: 'companybench',
  domain: 'CompanyBench',
  blurb: 'Agent-built vertical apps scored install → typecheck → build → serve → semantic across verticals.',
  target: 0.8,
  source: 'blueprint-agent/.evolve/verticalbench',
  status: 'awaiting-run',
  taskCount: 27,
  rows: [],
};

// Creative: real score from agent-eval round 1 (0.866, n=24). A live domain.
export const creative: DomainBoard = {
  id: 'creative',
  domain: 'Creative',
  blurb: 'Brand, copy, and design generation scored against held-out briefs.',
  target: 0.8,
  source: 'agent-eval/.evolve/scorecard.json (round 1)',
  status: 'partial',
  lastRun: '2026-05-21',
  taskCount: 24,
  rows: [
    { model: 'claude-sonnet-5', harness: 'blueprint-agent', score: 0.866, n: 24, date: '2026-05-21', highlight: true },
  ],
};

export const boards: DomainBoard[] = [tax, creative, legal, companybench];
