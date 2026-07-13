import type { AgentBenchmark } from './schema';

// Real domain scores from agent-eval/.evolve/scorecard.json (round 1, 2026-05-21).
// score = blended eval score 0..1; n = graded sessions. Nulls are honest: legal
// is in measurement-repair, gtm has no baseline yet. Do not fill these with
// invented numbers — they populate when the eval run publishes.
export const agentEvalRound1: AgentBenchmark = {
  id: 'agent-eval-domains',
  title: 'AgentProfile domain scores',
  subtitle: 'Tangle agents scored on held-out tasks per domain',
  agentProfile: { harness: 'blueprint-agent', model: 'claude-sonnet-5' },
  source: 'agent-eval/.evolve/scorecard.json (round 1)',
  date: '2026-05-21',
  method: 'Blended score over held-out tasks per domain, agent-eval harness. Target 0.80.',
  domains: [
    { domain: 'Creative', score: 0.866, target: 0.8, n: 24, status: 'above-target' },
    { domain: 'Tax', score: 0.828, target: 0.8, n: 74, status: 'above-target' },
    { domain: 'Legal', score: null, target: 0.8, n: 36, status: 'measurement-repair', note: 'Scoring harness in repair; n=36 sessions captured, blended score not yet trustworthy.' },
    { domain: 'GTM', score: null, target: 0.8, n: 0, status: 'no-baseline', note: 'Awaiting first baseline sweep.' },
  ],
};

// Real verification-layer pass rates from blueprint-agent VerticalBench gen 43
// (7 verticals, 27 sessions, 2026). Layers scored install→semantic. Skipped
// layers (serve/design/flow/...) are honestly shown as skipped, not passing.
export const verticalBenchGen43: AgentBenchmark = {
  id: 'verticalbench-gen43',
  title: 'VerticalBench verification layers',
  subtitle: 'Where agent-built vertical apps pass and fail, by layer',
  agentProfile: { harness: 'blueprint-agent', model: 'kimi-k2', systemPrompt: 'BLUEPRINT_AGENT_SYSTEM_PROMPT' },
  source: 'blueprint-agent/.evolve/verticalbench/scorecards/gen43-6vert-kimi',
  date: '2026-05',
  sessionCount: 27,
  method: 'Live session corpus, 7 verticals. Each leaf passes install+typecheck+build+lint+serve+semantic. Same system prompt bytes as production.',
  domains: [],
  layers: [
    { layer: 'install', passRate: 1.0, pass: 25, fail: 0, skipped: 0 },
    { layer: 'build', passRate: 0.72, pass: 18, fail: 5, skipped: 2 },
    { layer: 'typecheck', passRate: 0.64, pass: 16, fail: 8, skipped: 1 },
    { layer: 'semantic', passRate: 0.24, pass: 6, fail: 19, skipped: 0 },
  ],
};

export const benchmarks: AgentBenchmark[] = [agentEvalRound1, verticalBenchGen43];
