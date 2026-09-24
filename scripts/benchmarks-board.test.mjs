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
function edited(edit) {
  const board = structuredClone(fixture)
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
  ['an interval that excludes its solve rate', (b) => { b.profiles[1].interval.upper = 0.05 }, /does not contain its solve rate/],
  ['tiers that do not cover every attempt', (b) => { b.cells[0].tiers.A -= 1 }, /one App Grade tier per attempt/],
  ['a swapped ranking', (b) => { b.profiles.reverse(); b.profiles.forEach((p, i) => { p.rank = i + 1 }) }, /no supported comparison places/],
  ['a comparison that does not clear its minimum effect', (b) => { b.comparisons[0].minimumEffect = 0.8 }, /does not clear its minimum effect/],
  ['an AgentProfile its digest does not name', (b) => { b.profiles[0].agentProfile.model.default = 'another-model' }, /AgentProfile digest does not match/],
  ['a looser analysis than the floors', (b) => { b.decision.alpha = 0.1 }, /alpha and power within the floors/],
  ['a grader that counts an F', (b) => { b.grader.passTier = 'F' }, /pass tier above F/],
]
for (const [name, edit, detail] of inconsistent) {
  test(`refuses ${name}, even re-signed`, () => {
    assert.match(problems(edited(edit)), detail)
  })
}
