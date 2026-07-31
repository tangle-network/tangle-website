import type { DomainBoard } from '../benchmarks/schema';
import { boardById } from '../benchmarks/index';

// Partner pages are a PROJECTION over the same board data the benchmark pages
// render, never a parallel store. A partner declares the board slug it is
// measured by; the board itself still comes from src/data/benchmarks/results
// via boardById. When the eval runner exports results/<id>.json and the board
// entry lands in benchmarks/index.ts, the partner page's board section fills in
// with no edit here.
//
// HONESTY GATE (structural, not editorial). partnerBoard() returns undefined for
// a board that is absent OR carries zero rows, so a partner whose sweep has not
// run renders "measurement pending" and can never render an empty chart, a zero,
// or a placeholder row. Same invariant readiness.ts enforces by skipping
// `b.rows.length === 0`, and the same rule schema.ts states: a domain with runs
// pending renders awaiting-run, never a fabricated row.

// One rung of the difficulty ladder a vertical escalates through. `tasks` is the
// count of authored leaves at that rung, counted from the vertical source, never
// a target or a plan.
export interface LadderRung {
  level: string; // "L1", "L2", "L3"
  name: string; // "Contract", "Protocol", "System"
  tasks: number; // authored leaves at this rung
  shape: string; // what the agent has to build
  grader: string; // how a submission at this rung is graded
  example: { id: string; summary: string }; // one real authored leaf
}

// A theme the partner's developer community actually builds, joined to the
// benchmark tasks written from it. `projects` is the count in the community
// corpus; `tasks` is the count of authored benchmark leaves carrying that tag.
export interface CorpusTheme {
  theme: string;
  projects: number;
  tasks?: number;
  taskIds?: string[];
}

export interface Partner {
  slug: string; // /partners/<slug>
  name: string;
  role: string; // one line: what this partner is to the benchmark
  summary: string; // one paragraph for the index card
  siteUrl?: string;
  // Board slug in src/data/benchmarks/index.ts this partner is measured by.
  // Undefined, or a board with no rows, renders as measurement pending.
  boardId?: string;
  verticalId?: string; // the VerticalBench vertical id, for provenance
  verticalSource?: string; // repo path the task counts are counted from
  taskCount?: number; // authored leaves in the vertical
  difficultyMix?: { hard: number; extreme: number };
  ladder?: LadderRung[];
  corpus?: { label: string; total: number; themes: CorpusTheme[] };
}

export const arc: Partner = {
  slug: 'arc',
  name: 'Arc',
  role: 'Benchmark partner',
  summary:
    'Circle\'s USDC-native L1, where USDC is the gas token and the Arc Privacy Sector runs a '
    + 'private EVM inside hardware enclaves. The arc vertical measures whether a coding agent can '
    + 'build on it, from one contract up to a running system.',
  boardId: 'arc',
  verticalId: 'arc',
  verticalSource: 'scripts/experiments/scenarios/verticals/crypto/arc.ts',
  taskCount: 31,
  difficultyMix: { hard: 17, extreme: 14 },
  ladder: [
    {
      level: 'L1',
      name: 'Contract',
      tasks: 8,
      shape: 'One Solidity contract for the USDC-native chain.',
      grader:
        'A hidden forge test suite, decoded outside the workspace, compiles the agent\'s contract '
        + 'and runs adversarial tests against it. The exit code is the grade.',
      example: {
        id: 'arc-agent-job-escrow',
        summary:
          'A USDC escrow where a poster funds a named job for a specific worker, the worker submits, '
          + 'only the poster releases, exactly once, and the poster can reclaim only after a deadline '
          + 'and only if the job was never submitted. The calibration run recorded the reference '
          + 'contract passing 7 of 7 tests and a plausible naive contract failing 4 of them, on '
          + 'access control, state machine order, and the exactly-once release.',
      },
    },
    {
      level: 'L2',
      name: 'Protocol',
      tasks: 18,
      shape:
        'Several contracts that have to agree with each other, or the protocol semantics of the Arc '
        + 'Privacy Sector: trust domains, shielded balances, key rotation, consensus rules.',
      grader:
        'A hidden pytest oracle for the privacy-sector rules, or a hidden forge test suite run over '
        + 'the whole contract set including integration tests that cross contract boundaries.',
      example: {
        id: 'arc-oracle-committee',
        summary:
          'Reporters bond USDC in a staking vault and submit signed observations to a committee that '
          + 'aggregates by median, slashes outliers through the vault, and pushes the result to a '
          + 'resolver where it waits behind a dispute window before any consumer can read it. The '
          + 'aggregation rule, the slashing authority, and the finality rule each live in a different '
          + 'contract, so getting one right is not enough.',
      },
    },
    {
      level: 'L3',
      name: 'System',
      tasks: 5,
      shape:
        'A protocol plus the off-chain services that operate it: a keeper that acts on chain state, '
        + 'an event-sourced indexer serving HTTP, and an operator CLI.',
      grader:
        'A hidden harness boots a chain, deploys the agent\'s contracts, starts the agent\'s own '
        + 'services as real processes, drives a scenario, and asserts on-chain state, HTTP responses, '
        + 'and CLI output against each other.',
      example: {
        id: 'arc-lending-market',
        summary:
          'A USDC money market as a running system: lender shares, per-borrower index interest, '
          + 'LTV-enforced borrowing and close-factor liquidation on chain, plus a liquidation keeper '
          + 'that repairs underwater positions, a positions indexer serving an HTTP API, and an '
          + 'operator CLI. The harness requires all four surfaces to be present before it will grade, '
          + 'and checks every number the services report against on-chain truth.',
      },
    },
  ],
};

export const canteen: Partner = {
  slug: 'canteen',
  name: 'Canteen',
  role: 'Ecosystem partner',
  summary:
    'The New York firm that runs Arc\'s public developer stack: a testnet node, a keyed JSON-RPC '
    + 'gateway, the arc-canteen CLI, and an open-source showcase. Their hackathon corpus is what the '
    + 'benchmark\'s task content is drawn from.',
  verticalId: 'canteen-arc-gateway',
  verticalSource: 'scripts/experiments/scenarios/verticals/infra/canteen-arc-gateway.ts',
  corpus: {
    label: 'Lepton and Agora hackathon projects',
    total: 370,
    // Tag frequency across the corpus, with the benchmark tasks written from each
    // theme. `tasks` counts authored leaves in the arc vertical carrying that tag;
    // a theme with no authored task carries no count rather than a zero.
    themes: [
      { theme: 'Payments', projects: 322 },
      { theme: 'Agents', projects: 305, tasks: 4, taskIds: ['arc-agent-job-escrow', 'arc-prediction-market', 'arc-sponsor-credit-line', 'arc-agent-job-market'] },
      { theme: 'x402', projects: 175, tasks: 3, taskIds: ['arc-x402-settlement', 'arc-x402-facilitator', 'arc-x402-paid-api'] },
      { theme: 'Wallets', projects: 130 },
      { theme: 'Gateway', projects: 90 },
      { theme: 'Trading', projects: 75 },
      { theme: 'DeFi and Yield', projects: 72, tasks: 2, taskIds: ['arc-lending-vault', 'arc-lending-market'] },
      { theme: 'Oracle', projects: 72, tasks: 3, taskIds: ['arc-stake-slash-oracle', 'arc-oracle-committee', 'arc-staked-verdict-oracle'] },
      { theme: 'Escrow', projects: 69, tasks: 3, taskIds: ['arc-agent-job-escrow', 'arc-milestone-escrow', 'arc-agent-job-market'] },
      { theme: 'Prediction Markets', projects: 59, tasks: 2, taskIds: ['arc-prediction-market', 'arc-prediction-market-ops'] },
      { theme: 'Bridge', projects: 54 },
      { theme: 'Identity and KYC', projects: 51 },
      { theme: 'ERC-8004', projects: 47 },
    ],
  },
};

export const partners: Partner[] = [arc, canteen];

export function partnerBySlug(slug: string): Partner | undefined {
  return partners.find((p) => p.slug === slug);
}

// The board backing a partner page, or undefined when measurement has not run.
// A board with zero rows is treated as pending: the page must state that plainly
// rather than render an empty leaderboard.
export function partnerBoard(p: Partner): DomainBoard | undefined {
  if (!p.boardId) return undefined;
  const b = boardById(p.boardId);
  return b && b.rows.length > 0 ? b : undefined;
}

// Themes that have at least one authored benchmark task, for the grounding table.
export function groundedThemes(p: Partner): CorpusTheme[] {
  return (p.corpus?.themes ?? []).filter((t) => (t.tasks ?? 0) > 0);
}
