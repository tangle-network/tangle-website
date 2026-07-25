import type { DomainBoard, ProfileRow } from './schema';
import { boards } from './index';

// The Agent Readiness Index flips the benchmark axis. A DomainBoard ranks
// agents on one company's task suite; the index ranks COMPANIES by how well
// the whole agent roster does on their API. A board joins the index by
// declaring `company` on its entry (API-integration suites only), so adding
// results/<company>.json plus one board entry auto-adds an index row here.
// Boards without `company` (academic imports like TaxCalcBench) never appear.
//
// Index boards must be pass/fail suites: each row's score IS the agent's pass
// rate on the suite (metricLabel 'Pass rate'). `passRate` wins when a row
// carries both.

export interface ReadinessAgent {
  model: string;
  harness?: string;
  scorePts: number; // 0..100 pass rate in points
  n: number; // graded runs behind this agent's number
}

export interface ReadinessRow {
  company: string;
  boardId: string;
  scorePts: number; // Agent-Readiness Score, 0..100 = 100 x mean pass rate across the roster
  best: ReadinessAgent;
  worst: ReadinessAgent;
  spreadPts: number; // best minus worst, in points
  agents: number; // roster size
  tasks?: number; // held-out tasks in the suite
  runs: number; // total graded runs behind the score (sum of per-agent n)
  lastRun?: string; // ISO
  board: DomainBoard;
}

const passRateOf = (r: ProfileRow) => r.passRate ?? r.score;
const toAgent = (r: ProfileRow): ReadinessAgent => ({
  model: r.model,
  harness: r.harness,
  scorePts: passRateOf(r) * 100,
  n: r.n,
});

// Companies ranked by Agent-Readiness Score, best first. Only boards with a
// completed sweep produce a row; a company is either measured or pending,
// never estimated.
export function readinessRows(): ReadinessRow[] {
  const rows: ReadinessRow[] = [];
  for (const b of boards) {
    if (!b.company || b.rows.length === 0) continue;
    const sorted = [...b.rows].sort((x, y) => passRateOf(y) - passRateOf(x));
    const mean = sorted.reduce((s, r) => s + passRateOf(r), 0) / sorted.length;
    const best = toAgent(sorted[0]);
    const worst = toAgent(sorted[sorted.length - 1]);
    rows.push({
      company: b.company,
      boardId: b.id,
      scorePts: mean * 100,
      best,
      worst,
      spreadPts: best.scorePts - worst.scorePts,
      agents: sorted.length,
      tasks: b.taskCount,
      runs: sorted.reduce((s, r) => s + r.n, 0),
      lastRun: b.lastRun,
      board: b,
    });
  }
  return rows.sort((a, z) => z.scorePts - a.scorePts);
}

// Companies queued for a first measured run, in planned order. Names only:
// a company with no completed sweep gets no number anywhere on the page.
export const pendingCompanies: { company: string; api: string }[] = [
  { company: 'Cal.com', api: 'Scheduling API' },
  { company: 'Ghost', api: 'Admin and Content APIs' },
  { company: 'Plausible', api: 'Stats API' },
  { company: 'Typesense', api: 'Search API' },
  { company: 'Lago', api: 'Billing API' },
  { company: 'Chatwoot', api: 'Platform API' },
  { company: 'Directus', api: 'Items API' },
  { company: 'Listmonk', api: 'Campaigns API' },
];

// Set when the full methodology post publishes; the page renders the link
// only when this is non-null, so it can never point at a missing page.
export const methodologyPostUrl: string | null = null;
