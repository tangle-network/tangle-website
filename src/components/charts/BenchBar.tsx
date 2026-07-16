import { useState } from 'react';
import type { ProfileRow } from '../../data/benchmarks/schema';

// Vertical column chart ranking agents on one benchmark (artificial-analysis
// "Highlights" style, reskinned indigo). Each column = one agent
// (AgentProfile × runLoop × ExecutionEnvironment): value on top, bar height =
// score, backend logo + model name below. Hover reveals the full breakdown:
// agent profile, changed axes, loop strategy, backend.

// The logo keys on `harness` = the execution ENVIRONMENT the run used
// (claude-code, opencode, codex, ...). A direct-API ('router') or in-sandbox
// run has no harness logo — that is correct, not a gap.
const HARNESS_LOGO: Record<string, string> = {
  'claude-code': '/images/harness/claude-code.svg', claude: '/images/harness/claude-code.svg',
  codex: '/images/harness/codex.png', opencode: '/images/harness/opencode.svg',
  hermes: '/images/harness/hermes.png', openclaw: '/images/harness/openclaw.png',
  nanoclaw: '/images/harness/nanoclaw.png', kimi: '/images/harness/kimi-code.png',
  pi: '/images/harness/pi.svg',
};
// indigo ramp by rank: top bar brightest, descending into deeper indigo
const RANK_COLORS = ['#C7C9F5', '#A5AAFC', '#818CF8', '#6366F1', '#4F46E5'];

export default function BenchBar({ rows, target = 0.8, metricLabel = 'Score' }:
  { rows: ProfileRow[]; target?: number; metricLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [sort, setSort] = useState<'score' | 'n' | 'costUsd'>('score');

  if (!rows.length) {
    return (
      <div className="bb-empty">
        <span className="bb-empty-badge">awaiting run</span>
        <p>No published scores yet. The eval runner sweeps agent profiles through this benchmark's held-out task suite and exports the ranking here.</p>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => ((b[sort] ?? 0) as number) - ((a[sort] ?? 0) as number));
  const max = Math.ceil(Math.max(...rows.map((r) => r.score), target) * 10) / 10;
  // comparative leaderboard: colour by rank (top brightest), not pass/fail —
  // the target is a reference line, not a red threshold.
  const colorFor = (_r: ProfileRow, i: number) => RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
  const logoFor = (r: ProfileRow) => (r.harness && HARNESS_LOGO[r.harness]) || null;

  return (
    <div className="vbb">
      <div className="vbb-controls">
        <div className="vbb-sort mono">
          {(['score', 'n', 'costUsd'] as const).map((k) => (
            <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
              {k === 'costUsd' ? 'cost' : k}
            </button>
          ))}
        </div>
      </div>

      <div className="vbb-plot" style={{ ['--target' as string]: `${(target / max) * 100}%` }}>
        <div className="vbb-targetline"><span className="mono">target {Math.round(target * 100)}</span></div>
        <div className="vbb-cols">
          {sorted.map((r, i) => {
            const hpct = (r.score / max) * 100;
            const logo = logoFor(r);
            return (
              <div className={`vbb-col${hover === i ? ' hover' : ''}`} key={r.model + (r.promptVersion ?? '') + i}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="vbb-bar-wrap">
                  <div className="vbb-bar" style={{ height: `${hpct}%`, background: colorFor(r, i) }}>
                    <span className="vbb-val mono">{(r.score * 100).toFixed(1)}</span>
                  </div>
                  {hover === i && (
                    <div className="vbb-tip mono">
                      <div className="vbb-tip-h">{r.model}</div>
                      <div className="vbb-tip-grid">
                        <span>agent profile</span><b>{r.agentProfile ?? 'raw · no profile'}</b>
                        {r.profileAxes && r.profileAxes.length > 0 && <><span>changed axes</span><b>{r.profileAxes.join(', ')}</b></>}
                        {r.loop && <><span>loop</span><b>{r.loop}</b></>}
                        {r.harness && <><span>backend</span><b>{r.harness}</b></>}
                        {r.passRate != null && <><span>pass rate</span><b>{(r.passRate * 100).toFixed(0)}%</b></>}
                        {r.costUsd != null && <><span>cost/success</span><b>${r.costUsd.toFixed(2)}</b></>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="vbb-foot">
                  {logo && <img className="vbb-logo" src={logo} alt="" />}
                  <span className="vbb-name">{r.model}</span>
                  {(r.loop ?? r.promptVersion) && <span className="vbb-pv mono">{r.loop ?? r.promptVersion}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
