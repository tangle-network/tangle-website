import { useState } from 'react';
import {
  benchmarkHarnessLabel,
  benchmarkModelLabel,
  benchmarkProfileLabel,
  type ProfileRow,
} from '../../data/benchmarks/schema';

// Vertical column chart ranking agents on one benchmark. Each column = one agent
// (AgentProfile × runLoop × ExecutionEnvironment): bar height = mean score on a
// TRUE 0-100% axis (never truncated, since a truncated axis exaggerates small gaps).
// A 95% confidence-interval whisker is drawn when per-task scores were available,
// so overlapping intervals read as "not distinguishable at this n". Hover reveals
// agent profile, changed axes, loop strategy, backend.

// Two distinct logos per bar:
//  - the MODEL's provider brand (who made the base model), always shown.
//  - the HARNESS/backend (the coding CLI that ran it with tools), shown only for
//    harness configs, so "a model in a harness" reads differently from "a raw
//    model call". 'router' (a direct API call) is a raw model, no harness mark.
const HARNESS_LOGO: Record<string, string> = {
  'claude-code': '/images/harness/claude-code.svg', claude: '/images/harness/claude-code.svg',
  codex: '/images/harness/codex.png', opencode: '/images/harness/opencode.svg',
  hermes: '/images/harness/hermes.png', openclaw: '/images/harness/openclaw.png',
  nanoclaw: '/images/harness/nanoclaw.png', kimi: '/images/harness/kimi-code.png',
  pi: '/images/harness/pi.svg',
};
// base-model → provider brand mark, matched by model-id shape.
const MODEL_PROVIDER: { re: RegExp; logo: string; name: string }[] = [
  { re: /(^|\/)(gpt|o[0-9]|codex|oss)/i, logo: '/images/models/openai.svg', name: 'OpenAI' },
  { re: /(claude|sonnet|opus|haiku|fable)/i, logo: '/images/models/anthropic.svg', name: 'Anthropic' },
  { re: /gemini/i, logo: '/images/models/google.svg', name: 'Google' },
  { re: /glm/i, logo: '/images/models/zhipu.svg', name: 'Zhipu' },
];
const providerFor = (model: string) => MODEL_PROVIDER.find((p) => p.re.test(model)) ?? null;
// indigo ramp by rank: top bar brightest, descending into deeper indigo
const RANK_COLORS = ['#C7C9F5', '#A5AAFC', '#818CF8', '#6366F1', '#4F46E5'];
// When rows carry a `method`, colour by family so the comparison reads at a
// glance: harness (tools) strongest, then steered, then raw.
const METHOD_COLOR: Record<string, string> = {
  harness: '#4F46E5', 'harness-steered': '#4338CA', optimized: '#047857',
  steered: '#818CF8', raw: '#C0C2E8',
};
const METHOD_LABEL: Record<string, string> = {
  raw: 'raw model', steered: 'raw + steer', harness: 'harness (tools)',
  'harness-steered': 'harness + steer', optimized: 'optimized profile',
};
// Absolute accuracy axis: 0-100%, fixed gridline stops. No truncation.
const TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

export default function BenchBar({ rows, metricLabel = 'Score', costLabel = 'cost/success' }:
  { rows: ProfileRow[]; metricLabel?: string; costLabel?: string }) {
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

  const sorted = [...rows].sort((a, b) => {
    // cost is a minimize-metric: lowest $/success ranks first (missing cost sorts
    // last, not as "free"). score and n are maximize-metrics: highest ranks first.
    if (sort === 'costUsd') return (a.costUsd ?? Infinity) - (b.costUsd ?? Infinity);
    return ((b[sort] ?? 0) as number) - ((a[sort] ?? 0) as number);
  });
  const byMethod = rows.some((r) => r.method);
  // colour by method family when present (unified comparison), else by rank.
  const colorFor = (r: ProfileRow, i: number) =>
    (byMethod && r.method && METHOD_COLOR[r.method]) || RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
  const logoFor = (r: ProfileRow) => (r.harness && HARNESS_LOGO[r.harness]) || null;
  const anyCI = rows.some((r) => r.ciLow != null && r.ciHigh != null);
  const hasMeasuredCost = rows.some((r) => r.costUsd != null);
  const sortOptions: Array<'score' | 'n' | 'costUsd'> = hasMeasuredCost
    ? ['score', 'n', 'costUsd']
    : ['score', 'n'];
  const methodsPresent = [...new Set(sorted.map((r) => r.method).filter(Boolean))] as string[];

  return (
    <div className="vbb">
      <div className="vbb-controls">
        {(methodsPresent.length > 1 || anyCI) && (
          <div className="vbb-legend mono">
            {methodsPresent.length > 1 && methodsPresent.map((m) => (
              <span key={m} className="vbb-leg"><i style={{ background: METHOD_COLOR[m] }} />{METHOD_LABEL[m] ?? m}</span>
            ))}
            {anyCI && (
              <span className="vbb-leg">
                <svg className="vbb-leg-ci" width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
                  <path d="M1.5 1h8M1.5 11h8M5.5 1v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </svg>
                95% CI
              </span>
            )}
          </div>
        )}
        <div className="vbb-sort mono">
          {sortOptions.map((k) => (
            <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
              {k === 'costUsd' ? 'cost' : k === 'n' ? 'cases' : 'score'}
            </button>
          ))}
        </div>
      </div>

      <div className="vbb-scroll" tabIndex={0} aria-label="Agent configuration chart; scroll horizontally on narrow screens">
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
                <div className={`vbb-col${hover === i ? ' hover' : ''}`} key={`${r.agentProfile ?? 'raw'}:${r.model}:${r.harness ?? 'direct'}:${i}`}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <div className={`vbb-bar vbb-bar-${r.method ?? 'raw'}`} style={{ height: `${r.score * 100}%`, background: colorFor(r, i) }}>
                    {/* value inside the bar, artificial-analysis style */}
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
                        <span>harness</span><b>{r.harness && r.harness !== 'router' ? r.harness : 'none (direct model call)'}</b>
                        <span>agent profile</span><b>{r.agentProfile ?? 'raw · no profile'}</b>
                        {r.profileAxes && r.profileAxes.length > 0 && <><span>changed axes</span><b>{r.profileAxes.join(', ')}</b></>}
                        {hasCI && <><span>95% CI</span><b>{(r.ciLow! * 100).toFixed(1)} to {(r.ciHigh! * 100).toFixed(1)} · n={r.n}</b></>}
                        {r.costUsd != null && <><span>{costLabel}</span><b>${r.costUsd.toFixed(2)}</b></>}
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
            const provider = providerFor(r.model);
            const harnessLogo = logoFor(r);
            const isHarness = r.method === 'harness' || r.method === 'harness-steered';
            return (
              <div className={`vbb-foot${hover === i ? ' hover' : ''}`} key={`${r.agentProfile ?? 'raw'}:${r.model}:${r.harness ?? 'direct'}:${i}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* model provider mark, always; harness backend mark layered for
                    harness configs so "model in a harness" ≠ "raw model call". */}
                <span className="vbb-marks">
                  {provider && <img className="vbb-model-logo" src={provider.logo} alt={provider.name} title={provider.name} />}
                  {isHarness && harnessLogo && (
                    <img className="vbb-harness-logo" src={harnessLogo} alt={r.harness} title={`harness: ${r.harness}`} />
                  )}
                </span>
                <span className="vbb-name">{benchmarkModelLabel(r.model)}</span>
                <span className="vbb-sub mono">via {isHarness ? benchmarkHarnessLabel(r.harness) : 'direct call'}</span>
                <span className="vbb-profile mono" title={r.agentProfile ?? 'raw'}>{benchmarkProfileLabel(r.agentProfile)}</span>
                <span className="vbb-n mono">n={r.n}</span>
                {r.costUsd != null && <span className="vbb-cost mono">{costLabel} ${r.costUsd.toFixed(2)}</span>}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      {(() => {
        const ns = [...new Set(rows.map((r) => r.n))];
        const uniform = ns.length === 1 ? ns[0] : null;
        if (uniform == null) return null;
        return <p className="vbb-note mono">Same {uniform} held-out cases for every bar.</p>;
      })()}
    </div>
  );
}
