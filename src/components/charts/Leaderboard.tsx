import { useState } from 'react';
import type { ProfileRow } from '../../data/benchmarks/schema';
import { SEMANTIC } from '../../data/benchmarks/schema';

// vals.ai / artificial-analysis style leaderboard: rank AgentProfiles on one
// domain. Sortable, the top row gets a score-bar emphasis. Empty rows render an
// explicit awaiting-run state.

type SortKey = 'score' | 'n' | 'costUsd';

export default function Leaderboard({ rows, target = 0.8, status }:
  { rows: ProfileRow[]; target?: number; status: string }) {
  const [sort, setSort] = useState<SortKey>('score');
  const [desc, setDesc] = useState(true);

  if (!rows.length) {
    return (
      <div className="lb-empty">
        <span className="lb-empty-badge">awaiting run</span>
        <p>No published scores for this domain yet. The eval runner sweeps agent profiles through the held-out task suite and exports results here.</p>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const av = (a[sort] ?? 0) as number, bv = (b[sort] ?? 0) as number;
    return desc ? bv - av : av - bv;
  });
  const max = Math.max(...rows.map((r) => r.score), target);
  const th = (key: SortKey, label: string) => (
    <button className={`lb-th${sort === key ? ' on' : ''}`}
      onClick={() => { sort === key ? setDesc(!desc) : setSort(key); }}>
      {label}{sort === key ? (desc ? ' ↓' : ' ↑') : ''}
    </button>
  );

  return (
    <div className="lb">
      <div className="lb-head">
        <span className="lb-th-rank">#</span>
        <span className="lb-th-model">Agent profile</span>
        {th('score', 'Score')}
        {th('n', 'n')}
        {th('costUsd', 'Cost / success')}
      </div>
      {sorted.map((r, i) => (
        <div className={`lb-row${r.highlight ? ' hl' : ''}`} key={r.model + (r.promptVersion ?? '') + i}>
          <span className="lb-rank">{i + 1}</span>
          <div className="lb-model">
            <span className="lb-model-name">{r.model}</span>
            {r.harness && <span className="lb-harness mono">{r.harness}</span>}
            {r.promptVersion && <span className="lb-pv mono">{r.promptVersion}</span>}
          </div>
          <div className="lb-score">
            <div className="lb-bar-track">
              <div className="lb-bar" style={{
                width: `${(r.score / max) * 100}%`,
                background: r.score >= target ? (i === 0 ? SEMANTIC.top : SEMANTIC.pass) : SEMANTIC.fail,
              }} />
              <div className="lb-target" style={{ left: `${(target / max) * 100}%` }} />
            </div>
            <span className="lb-score-val mono">{(r.score * 100).toFixed(1)}</span>
          </div>
          <span className="lb-n mono">{r.n}</span>
          <span className="lb-cost mono">{r.costUsd != null ? `$${r.costUsd.toFixed(2)}` : '—'}</span>
        </div>
      ))}
      {status === 'partial' && (
        <p className="lb-partial mono">Partial board: {rows.length} real profile{rows.length > 1 ? 's' : ''} measured. The full matrix sweep populates the ranking.</p>
      )}
    </div>
  );
}
