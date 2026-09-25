import { canonicalAgentProfileDigest, canonicalCandidateDigest } from '@tangle-network/agent-interface';

// A board record is what the benchmark runner writes for one suite when its
// publication decision allows a campaign (blueprint-agent
// scripts/experiments/lib/board-record.ts, written by `vb-publish --board`).
// A campaign the decision refuses writes no record, so it has no page here.
//
// This module does not decide anything. It checks that a record is the one the
// decision produced and that its numbers agree with each other: the digest over
// every field, each AgentProfile digest, every task × profile cell present with
// its repetitions, profile totals equal to the sum of their cells, zero harness
// failures, and each adjacent pair in the ranking ordered by a comparison whose
// interval clears its minimum effect. A record that fails any check throws, and
// the throw stops the site build.

export const TIERS = ['F', 'C', 'B', 'A', 'S'] as const;
export type Tier = (typeof TIERS)[number];
export type TierCounts = Record<Tier, number>;

export interface BoardInterval {
  lower: number;
  upper: number;
  level: number;
}

export type EgressStatus = 'proven-no-egress' | 'proven-provider-only' | 'native-web-permitted';

export interface BoardProfile {
  id: string;
  rank: number;
  label: string;
  harness: string;
  model: string;
  treatment: 'no-web' | 'native-web' | 'provider';
  egress: EgressStatus;
  agentProfile: Record<string, unknown>;
  agentProfileDigest: string;
  pins: { harness: string; searchArm: string; searchPersona?: string; searchMode?: string; skills?: string[]; effort?: string };
  attempts: number;
  solved: number;
  solveRate: number;
  interval: BoardInterval;
  tiers: TierCounts | null;
  cost: { totalUsd: number; meanUsd: number; perSolvedUsd: number | null; receipts: number };
  medianWallMs: number;
}

export interface BoardCell {
  task: string;
  profile: string;
  attempts: number;
  solved: number;
  tiers: TierCounts | null;
  costUsd: number;
}

// `treatment`: two arms of one model. `trained-profile`: a trained checkpoint
// against its parent. `profile`: two AgentProfiles across models.
export const COMPARISON_KINDS = ['treatment', 'trained-profile', 'profile'] as const;

export interface BoardComparison {
  id: string;
  kind: (typeof COMPARISON_KINDS)[number];
  favored: string;
  other: string;
  pairs: number;
  minimumEffect: number;
  interval: BoardInterval;
  exactInterval: BoardInterval;
}

export type BoardGrader =
  | { kind: 'app-grade'; passTier: Tier; graderCommit: string; costUsd: number; costBasis: string }
  | { kind: 'verification'; pass: string };

export interface BoardRecord {
  version: 1;
  digest: string;
  suite: { id: string; name: string; description: string };
  campaign: { id: string; completedAt: string; repetitions: number; shots: number };
  grader: BoardGrader;
  tasks: Array<{ label: string; digest: string }>;
  profiles: BoardProfile[];
  cells: BoardCell[];
  comparisons: BoardComparison[];
  integrity: {
    expectedCells: number;
    recordedCells: number;
    harnessFailures: number;
    missing: number;
    duplicate: number;
    unknownCost: number;
    quarantined: number;
    funnel: Array<{ id: string; entering: number; excluded: number; remaining: number }>;
  };
  decision: {
    planSeal: string;
    manifest: string;
    results: string;
    grades: string | null;
    alpha: number;
    power: number;
  };
}

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const HEX64 = /^[0-9a-f]{64}$/;
// Rounding in the record is to six decimals; allow for it and nothing more.
const TOLERANCE = 2e-6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE;
}

function isInterval(value: unknown): value is BoardInterval {
  return isRecord(value) && typeof value.lower === 'number' && typeof value.upper === 'number' &&
    typeof value.level === 'number' && Number.isFinite(value.lower) && Number.isFinite(value.upper) &&
    value.lower <= value.upper && value.level > 0 && value.level < 1;
}

function isTierCounts(value: unknown): value is TierCounts {
  return isRecord(value) && Object.keys(value).length === TIERS.length && TIERS.every((tier) => isCount(value[tier]));
}

function tierTotal(tiers: TierCounts): number {
  return TIERS.reduce((sum, tier) => sum + tiers[tier], 0);
}

/** Every reason a parsed record is not a board the decision produced, or none. */
export function boardRecordProblems(value: unknown): string[] {
  if (!isRecord(value)) return ['the record is not an object'];
  const problems: string[] = [];
  const problem = (text: string) => problems.push(text);

  if (value.version !== 1) problem('version is not 1');
  if (typeof value.digest !== 'string' || !SHA256.test(value.digest)) {
    problem('digest is not a sha256 digest');
  } else {
    const { digest, ...body } = value;
    let computed: string | null = null;
    try {
      computed = canonicalCandidateDigest(body);
    } catch (error) {
      problem(`the record is not canonical JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (computed !== null && computed !== digest) problem(`digest ${digest} does not match the record (${computed})`);
  }

  const suite = value.suite;
  if (!isRecord(suite) || typeof suite.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(suite.id) ||
    !isText(suite.name) || typeof suite.description !== 'string') {
    problem('suite needs a slug id, a name and a description');
  }
  const campaign = value.campaign;
  const reps = isRecord(campaign) && isCount(campaign.repetitions) ? campaign.repetitions : 0;
  if (!isRecord(campaign) || !isText(campaign.id) || typeof campaign.completedAt !== 'string' ||
    Number.isNaN(Date.parse(campaign.completedAt)) || !isCount(campaign.shots) || campaign.shots < 1) {
    problem('campaign needs an id, a completion time and a shot count');
  }
  if (reps < 2) problem('every cell needs at least two repetitions');

  const grader = value.grader;
  const appGrade = isRecord(grader) && grader.kind === 'app-grade';
  if (appGrade) {
    if (!['C', 'B', 'A', 'S'].includes(grader.passTier as string) || typeof grader.graderCommit !== 'string' ||
      !/^[0-9a-f]{40}$/.test(grader.graderCommit) || !isAmount(grader.costUsd) || !isText(grader.costBasis)) {
      problem('an App Grade grader needs a pass tier above F, a full commit, a cost and its basis');
    }
  } else if (!isRecord(grader) || grader.kind !== 'verification' || !isText(grader.pass)) {
    problem('grader is neither App Grade nor the runner verification');
  }

  const tasks = Array.isArray(value.tasks) ? value.tasks : [];
  if (tasks.length === 0) problem('the board has no tasks');
  const labels = new Set<string>();
  for (const task of tasks) {
    if (!isRecord(task) || !isText(task.label) || typeof task.digest !== 'string' || !SHA256.test(task.digest)) {
      problem('a task needs an opaque label and a sha256 digest');
      continue;
    }
    if (labels.has(task.label)) problem(`task label ${task.label} repeats`);
    labels.add(task.label);
  }

  const profiles = Array.isArray(value.profiles) ? value.profiles : [];
  if (profiles.length === 0) problem('the board has no profiles');
  const ids = new Set<string>();
  const cellsByProfile = new Map<string, Record<string, unknown>[]>();
  const cells = Array.isArray(value.cells) ? value.cells : [];
  const seen = new Set<string>();
  for (const cell of cells) {
    if (!isRecord(cell) || !isText(cell.task) || !isText(cell.profile) || !isCount(cell.attempts) ||
      !isCount(cell.solved) || !isAmount(cell.costUsd)) {
      problem('a cell needs a task, a profile, counts and a cost');
      continue;
    }
    const key = `${cell.task}\u0000${cell.profile}`;
    if (seen.has(key)) problem(`cell ${cell.profile}/${cell.task} repeats`);
    seen.add(key);
    if (!labels.has(cell.task)) problem(`cell ${cell.profile}/${cell.task} names no board task`);
    if (cell.attempts !== reps) problem(`cell ${cell.profile}/${cell.task} ran ${cell.attempts} times, not ${reps}`);
    if (cell.solved > cell.attempts) problem(`cell ${cell.profile}/${cell.task} solved more than it attempted`);
    if (appGrade) {
      if (!isTierCounts(cell.tiers) || tierTotal(cell.tiers) !== cell.attempts) {
        problem(`cell ${cell.profile}/${cell.task} needs one App Grade tier per attempt`);
      }
    } else if (cell.tiers !== null) {
      problem(`cell ${cell.profile}/${cell.task} carries tiers without an App Grade grader`);
    }
    const list = cellsByProfile.get(cell.profile) ?? [];
    list.push(cell);
    cellsByProfile.set(cell.profile, list);
  }

  profiles.forEach((profile, index) => {
    if (!isRecord(profile) || !isText(profile.id)) {
      problem(`profile ${index + 1} has no id`);
      return;
    }
    const id = profile.id;
    if (ids.has(id)) problem(`profile ${id} repeats`);
    ids.add(id);
    if (profile.rank !== index + 1) problem(`profile ${id} is listed at position ${index + 1} with rank ${String(profile.rank)}`);
    if (!isText(profile.label) || !isText(profile.harness) || !isText(profile.model)) problem(`profile ${id} needs a label, a harness and a model`);
    if (!['proven-no-egress', 'proven-provider-only', 'native-web-permitted'].includes(profile.egress as string)) {
      problem(`profile ${id} has no egress status`);
    }
    const pins = profile.pins;
    if (!isRecord(pins) || !isText(pins.harness) || !isText(pins.searchArm) || pins.harness !== profile.harness) {
      problem(`profile ${id} needs the pins its plan registered, with its harness`);
    }
    if (typeof profile.agentProfileDigest !== 'string' || !SHA256.test(profile.agentProfileDigest) || !isRecord(profile.agentProfile)) {
      problem(`profile ${id} needs an AgentProfile and its digest`);
    } else {
      let computed: string | null = null;
      try {
        computed = canonicalAgentProfileDigest(profile.agentProfile as never);
      } catch (error) {
        problem(`profile ${id} carries an invalid AgentProfile: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (computed !== null && computed !== profile.agentProfileDigest) problem(`profile ${id} AgentProfile digest does not match its AgentProfile`);
    }

    const own = cellsByProfile.get(id) ?? [];
    if (own.length !== labels.size) problem(`profile ${id} has ${own.length} of ${labels.size} task cells`);
    const attempts = own.reduce((sum, cell) => sum + (cell.attempts as number), 0);
    const solved = own.reduce((sum, cell) => sum + (cell.solved as number), 0);
    const costUsd = own.reduce((sum, cell) => sum + (cell.costUsd as number), 0);
    if (profile.attempts !== attempts || profile.attempts !== labels.size * reps) {
      problem(`profile ${id} counts ${String(profile.attempts)} attempts; its cells hold ${attempts}`);
    }
    if (profile.solved !== solved) problem(`profile ${id} counts ${String(profile.solved)} solved; its cells hold ${solved}`);
    if (typeof profile.solveRate !== 'number' || attempts === 0 || !close(profile.solveRate, solved / attempts)) {
      problem(`profile ${id} solve rate is not solved over attempts`);
    }
    if (!isInterval(profile.interval) || profile.interval.lower < 0 || profile.interval.upper > 1 ||
      typeof profile.solveRate !== 'number' || profile.solveRate < profile.interval.lower - TOLERANCE ||
      profile.solveRate > profile.interval.upper + TOLERANCE) {
      problem(`profile ${id} interval does not contain its solve rate within [0, 1]`);
    }
    const cost = profile.cost;
    if (!isRecord(cost) || !isAmount(cost.totalUsd) || !isAmount(cost.meanUsd) || !isCount(cost.receipts)) {
      problem(`profile ${id} needs a receipt-backed cost`);
    } else {
      if (!close(cost.totalUsd, costUsd)) problem(`profile ${id} cost ${cost.totalUsd} is not the sum of its cells (${costUsd})`);
      if (attempts > 0 && !close(cost.meanUsd, cost.totalUsd / attempts)) problem(`profile ${id} mean cost is not total over attempts`);
      const perSolved = solved > 0 ? cost.totalUsd / solved : null;
      if (perSolved === null ? cost.perSolvedUsd !== null : typeof cost.perSolvedUsd !== 'number' || !close(cost.perSolvedUsd, perSolved)) {
        problem(`profile ${id} cost per solved task is not total over solved`);
      }
      if (cost.receipts === 0) problem(`profile ${id} cost carries no router receipt`);
    }
    if (appGrade) {
      if (!isTierCounts(profile.tiers) || tierTotal(profile.tiers) !== attempts ||
        TIERS.some((tier) => (profile.tiers as TierCounts)[tier] !== own.reduce((sum, cell) => sum + ((cell.tiers as TierCounts | null)?.[tier] ?? 0), 0))) {
        problem(`profile ${id} tiers are not the sum of its cells`);
      }
    } else if (profile.tiers !== null) {
      problem(`profile ${id} carries tiers without an App Grade grader`);
    }
    if (!isAmount(profile.medianWallMs)) problem(`profile ${id} has no median wall time`);
  });
  for (const profile of cellsByProfile.keys()) if (!ids.has(profile)) problem(`cells name profile ${profile}, which the board does not rank`);

  const comparisons = Array.isArray(value.comparisons) ? value.comparisons : [];
  const supported = new Set<string>();
  for (const comparison of comparisons) {
    if (!isRecord(comparison) || !isText(comparison.id) || !ids.has(comparison.favored as string) ||
      !ids.has(comparison.other as string) || comparison.favored === comparison.other || !isCount(comparison.pairs) ||
      typeof comparison.minimumEffect !== 'number' || comparison.minimumEffect <= 0 || comparison.minimumEffect >= 1 ||
      !isInterval(comparison.interval) || !isInterval(comparison.exactInterval)) {
      problem('a comparison needs two ranked profiles, its pairs, a minimum effect and both intervals');
      continue;
    }
    if (!(COMPARISON_KINDS as readonly unknown[]).includes(comparison.kind)) {
      problem(`comparison ${comparison.id} has no known kind`);
      continue;
    }
    if (comparison.interval.lower <= comparison.minimumEffect || comparison.exactInterval.lower <= comparison.minimumEffect) {
      problem(`comparison ${comparison.id} does not clear its minimum effect of ${comparison.minimumEffect}`);
      continue;
    }
    supported.add(`${comparison.favored as string}\u0000${comparison.other as string}`);
  }
  for (let index = 1; index < profiles.length; index++) {
    const upper = profiles[index - 1];
    const lower = profiles[index];
    if (isRecord(upper) && isRecord(lower) && !supported.has(`${String(upper.id)}\u0000${String(lower.id)}`)) {
      problem(`no supported comparison places ${String(upper.id)} above ${String(lower.id)}`);
    }
  }

  const integrity = value.integrity;
  if (!isRecord(integrity) || !['expectedCells', 'recordedCells', 'harnessFailures', 'missing', 'duplicate', 'unknownCost', 'quarantined']
    .every((field) => isCount(integrity[field])) || !Array.isArray(integrity.funnel)) {
    problem('integrity needs every cell count and the funnel');
  } else {
    if (integrity.recordedCells !== integrity.expectedCells) problem(`${String(integrity.recordedCells)} of ${String(integrity.expectedCells)} expected cells were recorded`);
    for (const field of ['harnessFailures', 'missing', 'duplicate', 'unknownCost', 'quarantined'] as const) {
      if (integrity[field] !== 0) problem(`integrity counts ${String(integrity[field])} ${field}`);
    }
    if ((integrity.expectedCells as number) < labels.size * profiles.length * reps) problem('the board holds more cells than the campaign expected');
    const last = integrity.funnel.at(-1);
    if (!isRecord(last) || last.remaining !== integrity.expectedCells) problem('the funnel does not keep every expected cell');
  }

  const decision = value.decision;
  if (!isRecord(decision) || typeof decision.planSeal !== 'string' || !(HEX64.test(decision.planSeal) || SHA256.test(decision.planSeal)) ||
    typeof decision.manifest !== 'string' || !SHA256.test(decision.manifest) ||
    typeof decision.results !== 'string' || !SHA256.test(decision.results) ||
    (appGrade ? typeof decision.grades !== 'string' || !SHA256.test(decision.grades) : decision.grades !== null) ||
    typeof decision.alpha !== 'number' || decision.alpha <= 0 || decision.alpha > 0.05 ||
    typeof decision.power !== 'number' || decision.power < 0.8 || decision.power >= 1) {
    problem('decision needs the plan seal, the evidence digests, and alpha and power within the floors');
  }
  return problems;
}

/** The record, or a throw naming the file and every problem. */
export function verifyBoardRecord(value: unknown, source: string): BoardRecord {
  const problems = boardRecordProblems(value);
  if (problems.length > 0) {
    throw new Error(`benchmark board ${source} does not verify:\n- ${problems.join('\n- ')}`);
  }
  return value as BoardRecord;
}
