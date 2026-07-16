import { useState } from 'react';
import type { ProfileRow } from '../../data/benchmarks/schema';

// Vertical column chart ranking agents on one benchmark. Each column = one agent
// (AgentProfile × runLoop × ExecutionEnvironment): bar height = mean score on a
// TRUE 0-100% axis (never truncated — a truncated axis exaggerates small gaps).
// A 95% confidence-interval whisker is drawn when per-task scores were available,
// so overlapping intervals read as "not distinguishable at this n". Hover reveals
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
// Absolute accuracy axis: 0-100%, fixed gridline stops. No truncation.
const TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

export default function BenchBar({ rows, metricLabel = 'Score' }:
  { rows: ProfileRow[]; metricLabel?: string }) {
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
  // comparative leaderboard: colour by rank (top brightest), not pass/fail —
  // the target is a reference line, not a red threshold.
  const colorFor = (_r: ProfileRow, i: number) => RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
  const logoFor = (r: ProfileRow) => (r.harness && HARNESS_LOGO[r.harness]) || null;
  const anyCI = rows.some((r) => r.ciLow != null && r.ciHigh != null);

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

      <div className="vbb-plot">
        {/* y-axis title */}
        <div className="vbb-ytitle mono">{metricLabel}, %</div>
        {/* the band: bars + gridlines + ticks share this coordinate space, where
            bottom 0% = 0 accuracy and top 100% = 100% accuracy (AXIS_MAX = 1.0) */}
        <div className="vbb-band">
          {TICKS.map((t) => (
            <div className="vbb-grid" key={t} style={{ bottom: `${t * 100}%` }}>
              <span className="vbb-tick mono">{Math.round(t * 100)}</span>
            </div>
          ))}
          <div className="vbb-cols">
            {sorted.map((r, i) => {
              const logo = logoFor(r);
              const hasCI = r.ciLow != null && r.ciHigh != null;
              return (
                <div className={`vbb-col${hover === i ? ' hover' : ''}`} key={r.model + (r.loop ?? '') + i}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <div className="vbb-bar" style={{ height: `${r.score * 100}%`, background: colorFor(r, i) }}>
                    <span className="vbb-val mono">{(r.score * 100).toFixed(1)}</span>
                  </div>
                  {hasCI && (
                    <div className="vbb-err" style={{ bottom: `${r.ciLow! * 100}%`, height: `${(r.ciHigh! - r.ciLow!) * 100}%` }}>
                      <span className="vbb-cap vbb-cap-hi" /><span className="vbb-cap vbb-cap-lo" />
                    </div>
                  )}
                  {hover === i && (
                    <div className="vbb-tip mono">
                      <div className="vbb-tip-h">{r.model}</div>
                      <div className="vbb-tip-grid">
                        <span>agent profile</span><b>{r.agentProfile ?? 'raw · no profile'}</b>
                        {r.profileAxes && r.profileAxes.length > 0 && <><span>changed axes</span><b>{r.profileAxes.join(', ')}</b></>}
                        {r.loop && <><span>loop</span><b>{r.loop}</b></>}
                        {r.harness && <><span>backend</span><b>{r.harness}</b></>}
                        <span>score</span><b>{(r.score * 100).toFixed(1)}%</b>
                        {hasCI && <><span>95% CI</span><b>{(r.ciLow! * 100).toFixed(1)}–{(r.ciHigh! * 100).toFixed(1)}</b></>}
                        <span>n</span><b>{r.n}</b>
                        {r.passRate != null && <><span>pass rate</span><b>{(r.passRate * 100).toFixed(0)}%</b></>}
                        {r.costUsd != null && <><span>cost/success</span><b>${r.costUsd.toFixed(2)}</b></>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* labels below the band, aligned to each column */}
        <div className="vbb-feet">
          {sorted.map((r, i) => {
            const logo = logoFor(r);
            return (
              <div className={`vbb-foot${hover === i ? ' hover' : ''}`} key={r.model + (r.loop ?? '') + i}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {logo && <img className="vbb-logo" src={logo} alt="" />}
                <span className="vbb-name">{r.model}</span>
                {(r.loop ?? r.promptVersion) && <span className="vbb-pv mono">{r.loop ?? r.promptVersion}</span>}
                <span className="vbb-n mono">n={r.n}</span>
              </div>
            );
          })}
        </div>
      </div>
      {anyCI && (
        <p className="vbb-note mono">Whiskers = 95% CI of each arm's mean (t, df = n−1). For same-case (paired) comparisons the paired test decides, not whether these bars' intervals overlap.</p>
      )}
    </div>
  );
}
