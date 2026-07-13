import { useState } from 'react';
import type { ProfileRow } from '../../data/benchmarks/schema';

// Vertical column chart ranking agent profiles on one benchmark
// (artificial-analysis "Highlights" style, reskinned indigo). Each column =
// one AgentProfile: value on top, bar height = score, harness logo + model
// name below. Hover reveals the full breakdown.

// harness = the coding harness / runtime from the AgentProfile that ran the
// eval (codex, claude, opencode, tcloud, ...), not the domain.
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
  const colorFor = (r: ProfileRow, i: number) =>
    r.score < target ? '#FB7185' : RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
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
                      <div className="vbb-tip-h">{r.model}{r.promptVersion ? ` · ${r.promptVersion}` : ''}</div>
                      <div className="vbb-tip-grid">
                        {r.harness && <><span>harness</span><b>{r.harness}</b></>}
                        {r.passRate != null && <><span>pass rate</span><b>{(r.passRate * 100).toFixed(0)}%</b></>}
                        {r.costUsd != null && <><span>cost/success</span><b>${r.costUsd.toFixed(2)}</b></>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="vbb-foot">
                  {logo && <img className="vbb-logo" src={logo} alt="" />}
                  <span className="vbb-name">{r.model}</span>
                  {r.promptVersion && <span className="vbb-pv mono">{r.promptVersion}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
