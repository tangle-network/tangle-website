import { useState } from 'react';
import type { ProfileRow } from '../../data/benchmarks/schema';

// One horizontal bar chart, all agent profiles on a shared axis (vals.ai
// detail-page style, reskinned indigo). Each bar = one AgentProfile; hover
// reveals the full breakdown. Not per-row boxes: a single continuous plot.

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
  const max = Math.ceil(Math.max(...rows.map((r) => r.score), target) * 10) / 10; // round axis up to 0.1
  const ticks = Array.from({ length: Math.round(max / 0.2) + 1 }, (_, i) => i * 0.2);

  return (
    <div className="bb">
      <div className="bb-controls">
        <span className="bb-axis-label">{metricLabel} · higher is better</span>
        <div className="bb-sort mono">
          sort:
          {(['score', 'n', 'costUsd'] as const).map((k) => (
            <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
              {k === 'costUsd' ? 'cost' : k}
            </button>
          ))}
        </div>
      </div>

      {/* single plot: gutter of labels + one shared-axis chart area */}
      <div className="bb-plot">
        {/* gridlines + target rule span the whole chart */}
        <div className="bb-grid" aria-hidden="true">
          {ticks.map((t) => (
            <div className="bb-gridline" style={{ left: `${(t / max) * 100}%` }} key={t}>
              <span className="bb-gridval mono">{Math.round(t * 100)}</span>
            </div>
          ))}
          <div className="bb-targetrule" style={{ left: `${(target / max) * 100}%` }}>
            <span className="bb-targetlbl mono">target {Math.round(target * 100)}</span>
          </div>
        </div>

        {sorted.map((r, i) => {
          const wpct = (r.score / max) * 100;
          const pass = r.score >= target;
          return (
            <div className={`bb-bar${r.highlight ? ' hl' : ''}${hover === i ? ' hover' : ''}`} key={r.model + i}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="bb-y">
                <span className="bb-rank mono">{i + 1}</span>
                <span className="bb-model">{r.model}</span>
                {r.promptVersion && <span className="bb-tag mono">{r.promptVersion}</span>}
              </div>
              <div className="bb-track">
                <div className="bb-fill" style={{ width: `${wpct}%`, background: i === 0 ? '#C7C9F5' : pass ? '#6366F1' : '#FB7185' }}>
                  <span className="bb-val mono">{(r.score * 100).toFixed(1)}</span>
                </div>
              </div>
              {hover === i && (
                <div className="bb-tip mono">
                  <div className="bb-tip-h">{r.model}{r.promptVersion ? ` · ${r.promptVersion}` : ''}</div>
                  <div className="bb-tip-grid">
                    {r.harness && <><span>harness</span><b>{r.harness}</b></>}
                    <span>{metricLabel.toLowerCase()}</span><b>{(r.score * 100).toFixed(1)}</b>
                    <span>tasks</span><b>{r.n}</b>
                    {r.passRate != null && <><span>pass rate</span><b>{(r.passRate * 100).toFixed(0)}%</b></>}
                    {r.costUsd != null && <><span>cost/success</span><b>${r.costUsd.toFixed(2)}</b></>}
                    <span>run date</span><b>{r.date}</b>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
