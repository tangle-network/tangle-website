// A board reaches /benchmarks only as a record the benchmark runner wrote for a
// campaign its publication decision allowed. These tests hold the build-time
// verifier to that: a record the runner produced verifies, and any edit to it,
// or any record whose numbers disagree, does not. Run:
//   node --experimental-strip-types --test scripts/benchmarks-board.test.mjs
//
// The fixture is the allowed test campaign from blueprint-agent's publication
// tests (synthetic runs, labelled "Admission fixture"), written by
// `vb-publish --board`. It proves the verifier and the page, never a score, and
// it lives here rather than in src/data/benchmarks/boards so it never builds.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { canonicalCandidateDigest } from '@tangle-network/agent-interface'

import { boardRecordProblems, verifyBoardRecord } from '../src/data/benchmarks/board-record.ts'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/benchmark-board.json', import.meta.url), 'utf8'))

/** Edit a copy, then re-sign it, so a check other than the digest must catch the edit. */
function edited(edit, source = fixture) {
  const board = structuredClone(source)
  edit(board)
  const { digest: _digest, ...body } = board
  board.digest = canonicalCandidateDigest(body)
  return board
}

function problems(board) {
  return boardRecordProblems(board).join('\n')
}

test('a record the runner wrote verifies', () => {
  assert.deepEqual(boardRecordProblems(fixture), [])
  assert.equal(verifyBoardRecord(fixture, 'fixture').suite.id, fixture.suite.id)
})

test('every committed board verifies', () => {
  const dir = new URL('../src/data/benchmarks/boards/', import.meta.url)
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.json'))) {
    const board = JSON.parse(readFileSync(new URL(name, dir), 'utf8'))
    assert.deepEqual(boardRecordProblems(board), [], name)
    assert.equal(`${board.suite.id}.json`, name)
  }
})

test('an edit without the runner fails the digest', () => {
  const board = structuredClone(fixture)
  board.profiles[1].solved += 1
  assert.match(problems(board), /digest sha256:[0-9a-f]{64} does not match the record/)
  assert.throws(() => verifyBoardRecord(board, 'edited.json'), /benchmark board edited.json does not verify/)
})

// The runner ranks AgentProfiles across models with a `profile` comparison
// (blueprint-agent #2632); a board ordered by one verifies like any other.
test('a record ordered by a profile comparison verifies', () => {
  assert.deepEqual(boardRecordProblems(edited((b) => { b.comparisons[0].kind = 'profile' })), [])
})

const inconsistent = [
  ['a solved count its cells do not hold', (b) => { b.profiles[1].solved += 1 }, /counts \d+ solved; its cells hold/],
  ['a missing cell', (b) => { b.cells.pop() }, /has 9 of 10 task cells/],
  ['a cell that ran once', (b) => { b.cells[0].attempts = 1 }, /ran 1 times, not 3/],
  ['one repetition per cell', (b) => { b.campaign.repetitions = 1 }, /at least two repetitions/],
  ['a harness failure', (b) => { b.integrity.harnessFailures = 1 }, /integrity counts 1 harnessFailures/],
  ['a quarantined cell', (b) => { b.integrity.quarantined = 2 }, /integrity counts 2 quarantined/],
  ['an unrecorded expected cell', (b) => { b.integrity.recordedCells -= 1 }, /expected cells were recorded/],
  ['a cost without receipts', (b) => { b.profiles[0].cost.receipts = 0 }, /carries no router receipt/],
  ['a cost its cells do not sum to', (b) => { b.profiles[0].cost.totalUsd += 1 }, /is not the sum of its cells/],
  ['a cost per solved task that is not total over solved', (b) => { b.profiles[1].cost.perSolvedUsd = 0.01 }, /cost per solved task/],
  ['an interval that excludes its rate', (b) => { b.profiles[1].interval.upper = 0.05 }, /contains its rate/],
  ['an interval that names another method', (b) => { b.profiles[1].interval.method = 'wilson' }, /task-clustered bootstrap/],
  ['a cost frontier the costs do not support', (b) => { b.profiles[1].onFront = true }, /marked on the cost frontier, but is not on it/],
  ['tiers that do not cover every attempt', (b) => { b.cells[0].tiers.A -= 1 }, /one App Grade tier per attempt/],
  ['a swapped ranking', (b) => { b.profiles.reverse(); b.profiles.forEach((p, i) => { p.rank = i + 1 }) }, /no supported comparison places/],
  ['a comparison that does not clear its minimum effect', (b) => { b.comparisons[0].minimumEffect = 0.8 }, /does not clear its minimum effect/],
  ['an AgentProfile its digest does not name', (b) => { b.profiles[0].agentProfile.model.default = 'another-model' }, /AgentProfile digest does not match/],
  ['a looser analysis than the floors', (b) => { b.decision.alpha = 0.1 }, /alpha and power within the floors/],
  ['a grader that counts an F', (b) => { b.grader.passTier = 'F' }, /pass tier above F/],
  ['a comparison of no known kind', (b) => { b.comparisons[0].kind = 'vibes' }, /comparison \S+ has no known kind/],
]
for (const [name, edit, detail] of inconsistent) {
  test(`refuses ${name}, even re-signed`, () => {
    assert.match(problems(edited(edit)), detail)
  })
}

// These controls exercise the descriptive contract without creating a public result.
// Both positive fixtures must come from the producer's explicit export path.
const descriptiveFixture = JSON.parse(readFileSync(new URL('./fixtures/benchmark-board-descriptive.json', import.meta.url), 'utf8'))

test('a descriptive record the runner wrote verifies without ranks', () => {
  assert.equal(descriptiveFixture.mode, 'descriptive')
  assert.deepEqual(boardRecordProblems(descriptiveFixture), [])
  assert.ok(descriptiveFixture.profiles.every((profile) => profile.rank === null && profile.onFront === null))
  assert.deepEqual(descriptiveFixture.profiles.map((profile) => profile.id), descriptiveFixture.decision.roster)
  verifyBoardRecord(descriptiveFixture, 'descriptive fixture')
})

const descriptiveInconsistent = [
  ['an implicit mode', (b) => { delete b.mode }, /mode must be ranked or descriptive/],
  ['an unknown mode', (b) => { b.mode = 'preview' }, /mode must be ranked or descriptive/],
  ['an old contract', (b) => { b.version = 2 }, /version is not 3/],
  ['a manufactured rank', (b) => { b.profiles[0].rank = 1 }, /must have no rank/],
  ['a frontier claim', (b) => { b.profiles[0].onFront = true }, /invalid cost frontier marker/],
  ['a reordered roster', (b) => { b.profiles.reverse() }, /sealed roster order/],
  ['a missing roster member', (b) => { b.decision.roster.pop() }, /each registered profile exactly once/],
  ['a duplicate roster member', (b) => { b.decision.roster[1] = b.decision.roster[0] }, /each registered profile exactly once/],
  ['invented comparison support', (b) => { b.comparisons[0].supported = !b.comparisons[0].supported }, /support does not match both intervals/],
  ['an unregistered direction', (b) => { b.comparisons[0].direction = 'observed-winner' }, /registered direction/],
  ['a failed paired design', (b) => { b.comparisons[0].designAdequate = false }, /adequate paired design/],
  ['too few pairs', (b) => { b.comparisons[0].requiredPairs = b.comparisons[0].pairs + 1 }, /adequate paired design/],
  ['a missing pair target', (b) => { delete b.comparisons[0].requiredPairs }, /adequate paired design/],
  ['an impossible difference interval', (b) => { b.comparisons[0].interval.lower = -2 }, /outside \[-1, 1\]/],
  ['missing measurements', (b) => { b.integrity.missing = 1 }, /integrity counts 1 missing/],
  ['unknown costs', (b) => { b.integrity.unknownCost = 1 }, /integrity counts 1 unknownCost/],
  ['a quarantined run', (b) => { b.integrity.quarantined = 1 }, /integrity counts 1 quarantined/],
]
for (const [name, edit, detail] of descriptiveInconsistent) {
  test(`descriptive mode refuses ${name}, even re-signed`, () => {
    assert.match(problems(edited(edit, descriptiveFixture)), detail)
  })
}

// Complete publication records pair every registered task and repetition.
// Re-signing a corrupted record must not relax its registered statistical floor.
const publicationInconsistent = [
  ['profile confidence below its registered floor', (b) => { b.profiles[0].interval.level = 0.5 }, /confidence.*registered alpha/],
  ['bootstrap comparison confidence below its registered floor', (b) => { b.comparisons[0].interval.level = 0.5 }, /confidence.*registered alpha/],
  ['exact comparison confidence below its registered floor', (b) => { b.comparisons[0].exactInterval.level = 0.5 }, /confidence.*registered alpha/],
  ['more pairs than complete attempts', (b) => { b.comparisons[0].pairs = 1000000 }, /pairs.*complete task repetitions/],
  ['fewer pairs than complete attempts', (b) => { b.comparisons[0].pairs -= 1 }, /pairs.*complete task repetitions/],
  ['a repeated comparison id', (b) => { b.comparisons.push(structuredClone(b.comparisons[0])) }, /comparison.*repeats/],
  ['removed registered comparisons', (b) => { b.comparisons = [] }, /at least one registered comparison/],
  ['an overflowing cost sum', (b) => {
    const profile = b.profiles[0]
    b.cells.filter((cell) => cell.setup === profile.id).forEach((cell) => { cell.costUsd = 1e308 })
    profile.cost.totalUsd = 1e308
    profile.cost.meanUsd = profile.cost.totalUsd / profile.attempts
    profile.cost.perSolvedUsd = profile.solved > 0 ? profile.cost.totalUsd / profile.solved : null
  }, /cost.*not the sum of its cells/],
  ['an exact interval that excludes its observed difference', (b) => {
    const comparison = b.comparisons[0]
    const favored = b.profiles.find((profile) => profile.id === comparison.favored)
    const other = b.profiles.find((profile) => profile.id === comparison.other)
    const difference = favored.rate - other.rate
    comparison.exactInterval.lower = difference + 0.01
    comparison.exactInterval.upper = difference + 0.02
    comparison.supported = comparison.interval.lower > comparison.minimumEffect && comparison.exactInterval.lower > comparison.minimumEffect
  }, /exact interval.*observed difference/],
]
for (const [mode, source] of [['ranked', fixture], ['descriptive', descriptiveFixture]]) {
  for (const [name, edit, detail] of publicationInconsistent) {
    test(`${mode} mode refuses ${name}, even re-signed`, () => {
      assert.match(problems(edited(edit, source)), detail)
    })
  }
}

for (const [mode, source] of [['ranked', fixture], ['descriptive', descriptiveFixture]]) {
  test(`${mode} mode preserves the registered confidence floor across multiple comparisons`, () => {
    const multiple = edited((b) => {
      b.comparisons.push({ ...structuredClone(b.comparisons[0]), id: 'second-registered-comparison' })
    }, source)
    assert.match(problems(multiple), /confidence.*registered alpha/)
    const adjusted = edited((b) => {
      b.comparisons.forEach((comparison) => {
        comparison.interval.level = 1 - b.decision.alpha / b.comparisons.length
        comparison.exactInterval.level = comparison.interval.level
      })
    }, multiple)
    assert.deepEqual(boardRecordProblems(adjusted), [])
  })
}

for (const [mode, source] of [['ranked', fixture], ['descriptive', descriptiveFixture]]) {
  test(`${mode} mode accounts for independently rounded cell costs`, () => {
    const withCostOffset = (offset) => edited((b) => {
      const profile = b.profiles[0]
      const own = b.cells.filter((cell) => cell.setup === profile.id)
      profile.cost.totalUsd = Number((own.reduce((sum, cell) => sum + cell.costUsd, 0) + offset).toFixed(6))
      profile.cost.meanUsd = Number((profile.cost.totalUsd / profile.attempts).toFixed(6))
      profile.cost.perSolvedUsd = profile.solved > 0 ? Number((profile.cost.totalUsd / profile.solved).toFixed(6)) : null
    }, source)
    const cells = source.cells.filter((cell) => cell.setup === source.profiles[0].id).length
    const bound = (cells + 1) * 0.5e-6
    assert.deepEqual(boardRecordProblems(withCostOffset(Math.floor(bound * 1e6) * 1e-6)), [])
    assert.match(problems(withCostOffset(Math.ceil(bound * 1e6 + 1) * 1e-6)), /cost.*not the sum of its cells/)
  })
}

test('descriptive evidence cannot become a ranked claim by changing the mode', () => {
  const board = edited((b) => {
    b.mode = 'ranked'
    b.profiles.forEach((profile, index) => { profile.rank = index + 1 })
  }, descriptiveFixture)
  assert.match(problems(board), /invalid cost frontier marker|does not clear its minimum effect|no supported comparison places/)
})
