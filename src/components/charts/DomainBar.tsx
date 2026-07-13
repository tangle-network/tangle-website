import { useState } from 'react';
import type { DomainScore, LayerStat } from '../../data/benchmarks/schema';
import { statusColor, SEMANTIC } from '../../data/benchmarks/schema';

// Artificial-analysis / vals.ai styled horizontal bar chart, reskinned indigo.
// Reusable: renders either domain scores (0..1) or layer pass-rates. Pending /
// no-baseline rows render as a hatched "awaiting run" track, never a fake bar.

type Row = { label: string; value: number | null; target?: number; n?: number;
  color: string; status?: string; note?: string; pending?: boolean };

function chartRows(domains?: DomainScore[], layers?: LayerStat[]): Row[] {
  if (domains?.length) {
    return domains.map((d) => ({
      label: d.domain, value: d.score, target: d.target, n: d.n,
      color: statusColor[d.status], status: d.status, note: d.note,
      pending: d.score == null,
    }));
  }
  if (layers?.length) {
    return layers.map((l) => ({
      label: l.layer, value: l.passRate, n: l.pass + l.fail + l.skipped,
      color: l.passRate >= 0.7 ? SEMANTIC.goodEdge : l.passRate >= 0.4 ? '#6366F1' : SEMANTIC.failLight,
      status: `${l.pass}/${l.pass + l.fail + l.skipped} pass`, pending: false,
    }));
  }
  return [];
}

export default function DomainBar({ domains, layers, target = 0.8, showTarget = true }:
  { domains?: DomainScore[]; layers?: LayerStat[]; target?: number; showTarget?: boolean }) {
  const rows = chartRows(domains, layers);
  const [hover, setHover] = useState<number | null>(null);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="dbar">
      {showTarget && domains && (
        <div className="dbar-target" style={{ left: `calc(11rem + ${target * 100}% * (100% - 11rem) / 100%)` }} />
      )}
      {rows.map((r, i) => (
        <div className={`dbar-row${r.pending ? ' pending' : ''}`} key={r.label}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <div className="dbar-label">{r.label}</div>
          <div className="dbar-track">
            {r.pending ? (
              <div className="dbar-empty">awaiting run{r.n ? ` · n=${r.n}` : ''}</div>
            ) : (
              <div className="dbar-fill" style={{ width: pct(r.value as number), background: r.color }}>
                <span className="dbar-val">{pct(r.value as number)}</span>
              </div>
            )}
            {showTarget && domains && !r.pending && (
              <div className="dbar-tick" style={{ left: `${(r.target ?? target) * 100}%` }} />
            )}
          </div>
          {hover === i && (r.note || r.n != null) && (
            <div className="dbar-tip">
              {r.status && <b>{r.status}</b>}
              {r.n != null && <span> · n={r.n}</span>}
              {r.note && <div className="dbar-tip-note">{r.note}</div>}
            </div>
          )}
        </div>
      ))}
      {showTarget && domains && <div className="dbar-legend">Vertical rule marks the {pct(target)} pass target.</div>}
    </div>
  );
}
