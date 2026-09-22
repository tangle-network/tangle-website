// The publishing gates decide whether a benchmark ranking reaches the public
// site, so they are tested directly rather than through a rendered page. Run:
//   node --experimental-strip-types --test scripts/benchmarks-standard.test.mjs
// standard.ts has no runtime imports (its only import is `import type`), so
// Node's type stripping can load it without a bundler.
import assert from 'node:assert/strict'
import test from 'node:test'

import { assess, gateTally } from '../src/data/benchmarks/standard.ts'

const cell = (overrides = {}) => ({ passRate: 1, n: 1, meanTokensIn: 900, meanTokensOut: 400, ...overrides })

/** A sweep that clears all three gates: full matrix, real model calls, separated top row. */
function qualifyingRun() {
  const profiles = [
    { profileId: 'a', harness: 'router', model: 'm-1' },
    { profileId: 'b', harness: 'router', model: 'm-2' },
  ]
  const perTask = Array.from({ length: 12 }, (unused, index) => ({
    label: String(index + 1).padStart(2, '0'),
    byProfile: { a: cell({ n: 3 }), b: cell({ n: 3 }) },
  }))
  return {
    source: 'test',
    generated: '2026-09-20',
    profiles,
    perTask,
    harnessFailures: 0,
    rows: [
      { model: 'm-1', score: 0.95, n: 12, ciLow: 0.9, ciHigh: 0.99, date: '2026-09-20' },
      { model: 'm-2', score: 0.6, n: 12, ciLow: 0.4, ciHigh: 0.8, date: '2026-09-20' },
    ],
  }
}

function outcome(assessment, id) {
  return assessment.gates.find((gate) => gate.id === id).outcome
}

test('a qualifying run publishes', () => {
  const assessment = assess(qualifyingRun())
  assert.equal(outcome(assessment, 'graded'), 'met')
  assert.equal(outcome(assessment, 'clean'), 'met')
  assert.equal(outcome(assessment, 'stable'), 'met')
  assert.equal(assessment.publishes, true)
  assert.equal(assessment.cellsGraded, 24)
  assert.equal(assessment.cellsExpected, 24)
})

test('a missing task-by-configuration cell blocks publication', () => {
  const run = qualifyingRun()
  delete run.perTask[0].byProfile.b
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'graded'), 'unmet')
  assert.equal(assessment.cellsGraded, 23)
  assert.equal(assessment.publishes, false)
  assert.match(assessment.gates[0].finding, /23 of 24/)
})

test('a graded cell that never reached the model blocks publication', () => {
  const run = qualifyingRun()
  run.perTask[3].byProfile.a = cell({ n: 3, passRate: 0, meanTokensIn: 0, meanTokensOut: 0 })
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'clean'), 'unmet')
  assert.equal(assessment.cellsWithoutModelCall, 1)
  assert.equal(assessment.publishes, false)
})

test('a runner-counted harness failure blocks publication', () => {
  const run = qualifyingRun()
  run.harnessFailures = 2
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'clean'), 'unmet')
  assert.match(assessment.gates[1].finding, /counted 2 cells/)
  assert.equal(assessment.publishes, false)
})

test('an absent harness-failure count leaves the clean gate unproven', () => {
  const run = qualifyingRun()
  delete run.harnessFailures
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'clean'), 'unproven')
  assert.equal(assessment.publishes, false)
})

test('a run record with no per-cell data cannot prove either coverage gate', () => {
  const run = qualifyingRun()
  delete run.perTask
  delete run.profiles
  delete run.harnessFailures
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'graded'), 'unproven')
  assert.equal(outcome(assessment, 'clean'), 'unproven')
  assert.equal(assessment.publishes, false)
  assert.equal(assessment.cellsExpected, null)
})

test('overlapping top intervals block publication', () => {
  const run = qualifyingRun()
  run.rows[1] = { model: 'm-2', score: 0.92, n: 12, ciLow: 0.86, ciHigh: 0.97, date: '2026-09-20' }
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'stable'), 'unmet')
  assert.match(assessment.gates[2].finding, /overlaps the runner-up/)
  assert.equal(assessment.publishes, false)
})

test('a single repetition per cell blocks publication', () => {
  const run = qualifyingRun()
  for (const task of run.perTask) for (const key of Object.keys(task.byProfile)) task.byProfile[key].n = 1
  const assessment = assess(run)
  assert.equal(assessment.repetitions, 1)
  assert.equal(outcome(assessment, 'stable'), 'unmet')
  assert.match(assessment.gates[2].finding, /ran once/)
})

test('a suite with no rows is awaiting its first run and publishes nothing', () => {
  const assessment = assess({ source: 'test', generated: '2026-09-20', rows: [] })
  assert.equal(assessment.awaitingRun, true)
  assert.equal(assessment.publishes, false)
  assert.equal(assessment.withheldRows, 0)
  assert.equal(outcome(assessment, 'stable'), 'unproven')
})

test('gateTally reports a denominator', () => {
  const met = { assessment: assess(qualifyingRun()) }
  const blocked = { assessment: assess({ source: 'test', generated: '2026-09-20', rows: [] }) }
  assert.deepEqual(gateTally([met, blocked], 'stable'), { met: 1, total: 2 })
})

test('a single scored configuration leaves the stable gate unproven, not met', () => {
  const run = qualifyingRun()
  run.rows = [run.rows[0]]
  run.profiles = [run.profiles[0]]
  for (const task of run.perTask) delete task.byProfile.b
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'stable'), 'unproven')
  assert.match(assessment.gates[2].finding, /no runner-up/)
  assert.equal(assessment.publishes, false)
})

test('a missing confidence bound on the top two rows leaves the stable gate unproven', () => {
  const run = qualifyingRun()
  delete run.rows[1].ciHigh
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'stable'), 'unproven')
  assert.match(assessment.gates[2].finding, /cannot be measured/)
  assert.equal(assessment.publishes, false)
})

test('repetitions report the fewest of any cell, so one unrepeated cell blocks publication', () => {
  const run = qualifyingRun()
  run.perTask[5].byProfile.b.n = 1
  const assessment = assess(run)
  assert.equal(assessment.repetitions, 1)
  assert.equal(outcome(assessment, 'stable'), 'unmet')
  assert.match(assessment.gates[2].finding, /ran once/)
  assert.equal(assessment.publishes, false)
})

test('an undeclared configuration in the task breakdown fails the graded gate even when counts match', () => {
  const run = qualifyingRun()
  // Swap a declared cell for a stray one: the raw cell count stays 24.
  run.perTask[2].byProfile.zzz = run.perTask[2].byProfile.b
  delete run.perTask[2].byProfile.b
  const assessment = assess(run)
  assert.equal(outcome(assessment, 'graded'), 'unmet')
  assert.match(assessment.gates[0].finding, /`zzz`/)
  assert.equal(assessment.cellsGraded, 23)
  assert.equal(assessment.publishes, false)
})
