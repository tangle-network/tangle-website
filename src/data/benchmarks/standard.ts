import type { RunRecord, Suite } from './schema';

// The publishing standard, recorded on tangle-network/blueprint-agent#2428 and
// applied when every board was taken down in tangle-network/tangle-website#144:
//
//   Every cell of a published board runs to completion and receives a valid
//   grade, with zero infrastructure or harness failures, and the board is large
//   and repeated enough that its ranking cannot flip on rerun.
//
// Each gate below is computed from the run record. Nothing here reads a status
// field, because a status field is a claim and these are measurements. A run
// that satisfies all three gates publishes its ranking the moment it lands; a
// run that does not cannot be talked into publishing.

export type GateOutcome = 'met' | 'unmet' | 'unproven';

export interface Gate {
  id: 'graded' | 'clean' | 'stable';
  requirement: string;
  outcome: GateOutcome;
  finding: string; // the measured result, with the object each number counts
}

export interface Assessment {
  /** Task × configuration cells the sweep should contain, when the record breaks out cells. */
  cellsExpected: number | null;
  /** Cells the record actually carries a grade for. */
  cellsGraded: number;
  /** Cells whose grade exists but which recorded no model call at all. */
  cellsWithoutModelCall: number;
  taskCount: number | null;
  configCount: number | null;
  /** Repetitions per cell. One sweep cannot measure rerun variance. */
  repetitions: number | null;
  /** Scored configurations held back from publication. */
  withheldRows: number;
  runDate: string;
  /** No run is recorded at all — the contract's "awaiting run" state. */
  awaitingRun: boolean;
  gates: Gate[];
  /** True only when all three gates are met. */
  publishes: boolean;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function gradedGate(cellsGraded: number, cellsExpected: number | null): Gate {
  const requirement = 'Every task × configuration cell runs to completion and receives a valid grade.';
  if (cellsExpected === null) {
    return {
      id: 'graded',
      requirement,
      outcome: 'unproven',
      finding:
        'The run record carries per-configuration aggregates only, with no task × configuration breakdown, so per-cell completion cannot be checked against it.',
    };
  }
  const missing = cellsExpected - cellsGraded;
  if (missing <= 0) {
    return {
      id: 'graded',
      requirement,
      outcome: 'met',
      finding: `All ${cellsExpected} task × configuration cells carry a grade.`,
    };
  }
  return {
    id: 'graded',
    requirement,
    outcome: 'unmet',
    finding: `${cellsGraded} of ${cellsExpected} task × configuration cells carry a grade. ${missing} cell${missing === 1 ? '' : 's'} never ran, so the affected configurations were scored over a smaller task set than the rest of the sweep.`,
  };
}

function cleanGate(record: RunRecord, cellsGraded: number, cellsWithoutModelCall: number): Gate {
  const requirement = 'Zero infrastructure or harness failures among the graded cells.';
  if (cellsWithoutModelCall > 0) {
    return {
      id: 'clean',
      requirement,
      outcome: 'unmet',
      finding:
        cellsWithoutModelCall === 1
          ? 'One graded cell recorded zero input and zero output tokens, meaning the agent never reached the model. It was scored as a task failure, which charges a harness failure to the agent.'
          : `${cellsWithoutModelCall} graded cells recorded zero input and zero output tokens, meaning the agent never reached the model. They were scored as task failures, which charges harness failures to the agent.`,
    };
  }
  if (record.harnessFailures != null && record.harnessFailures > 0) {
    return {
      id: 'clean',
      requirement,
      outcome: 'unmet',
      finding: `The runner counted ${record.harnessFailures} cell${record.harnessFailures === 1 ? '' : 's'} that ended in an infrastructure or harness failure rather than an agent result.`,
    };
  }
  if (record.harnessFailures === 0 && cellsGraded > 0) {
    return {
      id: 'clean',
      requirement,
      outcome: 'met',
      finding: `The runner counted zero infrastructure failures, and all ${cellsGraded} graded cells recorded a model call.`,
    };
  }
  if (cellsGraded === 0) {
    return {
      id: 'clean',
      requirement,
      outcome: 'unproven',
      finding:
        'The run record carries no per-cell data and no infrastructure-failure count, so whether any cell failed for infrastructure reasons cannot be checked against it.',
    };
  }
  return {
    id: 'clean',
    requirement,
    outcome: 'unproven',
    finding:
      'No graded cell is missing its model call, but the run record carries no per-cell error, timeout or grading status, so a clean sweep cannot be proven from it.',
  };
}

function stableGate(record: RunRecord, repetitions: number | null): Gate {
  const requirement = 'Large and repeated enough that the ranking cannot flip on rerun.';
  const ranked = [...record.rows].sort((a, b) => b.score - a.score);
  if (ranked.length === 0) {
    return {
      id: 'stable',
      requirement,
      outcome: 'unproven',
      finding: 'No run is recorded for this suite yet, so there is no ranking to test.',
    };
  }
  const reasons: string[] = [];

  const top = ranked[0];
  const runnerUp = ranked[1];
  if (top && runnerUp && top.ciLow != null && runnerUp.ciHigh != null) {
    if (top.ciLow <= runnerUp.ciHigh) {
      reasons.push(
        `the top row's 95% interval (${percent(top.ciLow)}–${percent(top.ciHigh ?? 1)}) overlaps the runner-up's (${percent(runnerUp.ciLow ?? 0)}–${percent(runnerUp.ciHigh)}), so first place is not separated from second`,
      );
    }
  }

  const tasksPerRow = ranked.map((row) => row.n);
  const smallest = Math.min(...tasksPerRow);
  if (smallest < 10) {
    reasons.push(
      `the thinnest row is scored over ${smallest} graded task${smallest === 1 ? '' : 's'}, which cannot separate configurations`,
    );
  }

  if (repetitions !== null && repetitions < 2) {
    reasons.push('each cell ran once, so rerun variance is unmeasured');
  }

  if (reasons.length === 0) {
    return {
      id: 'stable',
      requirement,
      outcome: 'met',
      finding: `The top row's 95% interval clears the runner-up's over ${smallest}+ graded tasks per row.`,
    };
  }
  return {
    id: 'stable',
    requirement,
    outcome: 'unmet',
    finding: `${reasons.join('; ')}.`.replace(/^./, (c) => c.toUpperCase()),
  };
}

export function assess(record: RunRecord): Assessment {
  const perTask = record.perTask ?? [];
  const profiles = record.profiles ?? [];
  const hasMatrix = perTask.length > 0 && profiles.length > 0;

  const cells = perTask.flatMap((task) => Object.values(task.byProfile));
  const cellsGraded = cells.length;
  const cellsExpected = hasMatrix ? perTask.length * profiles.length : null;
  const cellsWithoutModelCall = cells.filter(
    (cell) => cell.meanTokensIn === 0 && cell.meanTokensOut === 0,
  ).length;
  const repetitions = cells.length > 0 ? Math.max(...cells.map((cell) => cell.n)) : null;

  const gates: Gate[] = [
    gradedGate(cellsGraded, cellsExpected),
    cleanGate(record, cellsGraded, cellsWithoutModelCall),
    stableGate(record, repetitions),
  ];

  // The suite's shape is reported from the best evidence in the record: the
  // matrix when it exists, otherwise the rows. cellsExpected deliberately does
  // NOT fall back this way — without a matrix there is nothing to check each
  // cell against, and a derived denominator would imply a check that never ran.
  const taskCount = hasMatrix
    ? perTask.length
    : record.rows.length > 0
      ? Math.max(...record.rows.map((row) => row.n))
      : null;
  const configCount = profiles.length > 0 ? profiles.length : record.rows.length || null;

  return {
    cellsExpected,
    cellsGraded,
    cellsWithoutModelCall,
    taskCount,
    configCount,
    repetitions,
    withheldRows: record.rows.length,
    runDate: record.generated,
    awaitingRun: record.rows.length === 0,
    gates,
    publishes: record.rows.length > 0 && gates.every((gate) => gate.outcome === 'met'),
  };
}

export interface AssessedSuite extends Suite {
  assessment: Assessment;
}

export function assessSuite(suite: Suite): AssessedSuite {
  return { ...suite, assessment: assess(suite.run) };
}

/** How many suites meet a given gate, and out of how many. Denominators matter. */
export function gateTally(suites: AssessedSuite[], id: Gate['id']): { met: number; total: number } {
  const met = suites.filter((suite) =>
    suite.assessment.gates.some((gate) => gate.id === id && gate.outcome === 'met'),
  ).length;
  return { met, total: suites.length };
}
