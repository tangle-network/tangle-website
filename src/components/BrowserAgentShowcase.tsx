import { useState } from 'react';

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sat = "'Satoshi', sans-serif";

const P = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#4ade80' }}>{children}</span>;
const F = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#6172f3' }}>{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#a78bfa' }}>{children}</span>;
const D = ({ children }: { children: React.ReactNode }) => <span style={{ color: 'rgba(255,255,255,0.3)' }}>{children}</span>;
const W = ({ children }: { children: React.ReactNode }) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{children}</span>;
const Y = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#fbbf24' }}>{children}</span>;
const K = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#c084fc' }}>{children}</span>;

interface Example {
  key: string;
  label: string;
  title: string;
  desc: string;
  bullets: string[];
  cli: () => React.ReactNode;
  sdk: () => React.ReactNode;
}

const examples: Example[] = [
  {
    key: 'e2e',
    label: 'E2E Test',
    title: 'End-to-end testing in one sentence.',
    desc: 'Describe a user flow in plain English. The agent launches a browser, navigates autonomously using vision, and verifies every step — with screenshots as proof.',
    bullets: ['No selectors or scripts to maintain', 'Vision-based — reads the page like a human', 'Screenshots + video on every turn', 'Works with any web app, any framework'],
    cli: () => <>
      <P>$</P> bad run \{'\n'}
      {'  '}<F>--goal</F> <S>"Sign up, verify email, check dashboard"</S> \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--model</F> <D>claude-sonnet-4-20250514</D> <F>--vision</F>{'\n\n'}
      <D>agent-driver v0.10.0</D>{'\n'}
      <D>Model: anthropic/claude-sonnet-4-20250514 | Vision: ✓</D>{'\n\n'}
      <W>  ▶ Sign up, verify email, check dashboard</W>{'\n'}
      <D>    turn 1  navigate  → /signup</D>{'\n'}
      <D>    turn 2  type      → email · test@example.com</D>{'\n'}
      <D>    turn 3  click     → "Create Account"</D>{'\n'}
      <D>    turn 4  evaluate  → welcome banner visible</D>{'\n'}
      <D>    turn 5  navigate  → /dashboard</D>{'\n'}
      <D>    turn 6  evaluate  → user data loaded</D>{'\n\n'}
      <P>  ✓ Goal achieved</P> <D>(6 turns, 12.1s)</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n\n'}
      <K>const</K> <W>driver</W> = <K>new</K> <W>PlaywrightDriver</W>(page);{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'} driver {'}'});{'\n\n'}
      <K>const</K> <W>result</W> = <K>await</K> agent.<W>run</W>({'{'}{'\n'}
      {'  '}goal: <S>'Sign up, verify email, check dashboard'</S>,{'\n'}
      {'  '}startUrl: <S>'https://your-app.com'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(result.success); <D>{'// true'}</D>{'\n'}
      console.log(result.turns);   <D>{'// 6'}</D>
    </>,
  },
  {
    key: 'suite',
    label: 'Test Suite',
    title: 'Run dozens of tests in parallel.',
    desc: 'Define test cases as JSON — goals + URLs. The agent runs them concurrently across browser instances and reports pass/fail with evidence for each.',
    bullets: ['Concurrent execution across browsers', 'JSON-based test definitions', 'Per-test screenshots and traces', 'CI-friendly exit codes and reports'],
    cli: () => <>
      <P>$</P> bad run <F>--cases</F> <S>tests/e2e.json</S> <F>--concurrency</F> <Y>4</Y>{'\n\n'}
      <D>Running 5 test cases (4 concurrent)...</D>{'\n\n'}
      <P>✓</P> <W>signup</W>         <D>(4 turns, 8.1s)</D>{'\n'}
      <P>✓</P> <W>login</W>          <D>(2 turns, 3.4s)</D>{'\n'}
      <P>✓</P> <W>create-project</W> <D>(6 turns, 14.2s)</D>{'\n'}
      <Y>✗</Y> <W>billing</W>        <D>(stuck at payment modal)</D>{'\n'}
      <P>✓</P> <W>settings</W>       <D>(3 turns, 5.8s)</D>{'\n\n'}
      <D>Pass: 4/5 · Fail: 1 · Duration: 31.5s</D>
    </>,
    sdk: () => <>
      <K>const</K> <W>cases</W> = [{'\n'}
      {'  '}{'{'} id: <S>'signup'</S>, goal: <S>'Create account'</S>, url: <S>'/signup'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'login'</S>, goal: <S>'Login with creds'</S>, url: <S>'/login'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'billing'</S>, goal: <S>'Update payment'</S>, url: <S>'/billing'</S> {'},'}{'\n'}
      ];{'\n\n'}
      <K>const</K> <W>results</W> = <K>await</K> agent.<W>runBatch</W>(cases, {'{'}{'\n'}
      {'  '}concurrency: <Y>4</Y>,{'\n'}
      {'}'});{'\n\n'}
      <D>{'// results: [{id, success, turns, screenshots}]'}</D>
    </>,
  },
  {
    key: 'showcase',
    label: 'Showcase',
    title: 'Generate product demos automatically.',
    desc: 'Walk through your app step-by-step. Each step is captured with highlighted elements, then assembled into an interactive HTML player or animated GIF.',
    bullets: ['Interactive HTML demo player', 'Animated GIF export', 'Element highlighting per step', 'Zero manual screenshot work'],
    cli: () => <>
      <P>$</P> bad showcase \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--steps</F> <S>'Navigate signup, Fill form, Submit, Dashboard'</S> \{'\n'}
      {'  '}<F>--format</F> demo{'\n\n'}
      <D>Capturing 4 steps...</D>{'\n'}
      <P>✓</P> <W>Step 1</W> Navigate signup <D>(highlight)</D>{'\n'}
      <P>✓</P> <W>Step 2</W> Fill form <D>(highlight)</D>{'\n'}
      <P>✓</P> <W>Step 3</W> Submit <D>(highlight)</D>{'\n'}
      <P>✓</P> <W>Step 4</W> Dashboard <D>(highlight)</D>{'\n\n'}
      <P>✓ Demo generated</P>{'\n'}
      <D>  → showcase-demo.html</D>{'\n'}
      <D>  → showcase.gif</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>runShowcase</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver/showcase'</S>;{'\n\n'}
      <K>const</K> <W>demo</W> = <K>await</K> <W>runShowcase</W>(page, {'{'}{'\n'}
      {'  '}steps: [{'\n'}
      {'    '}{'{'} action: <S>'navigate'</S>, url: <S>'/signup'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'fill'</S>, selector: <S>'form'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'click'</S>, selector: <S>'button[type=submit]'</S> {'},'}{'\n'}
      {'  '}],{'\n'}
      {'  '}format: <S>'demo'</S>,{'\n'}
      {'}'});
    </>,
  },
  {
    key: 'audit',
    label: 'Design Audit',
    title: 'Audit your UI for design consistency.',
    desc: 'Crawl your site and extract design tokens — fonts, colors, spacing. Get a health score with actionable findings for typography, contrast, and layout consistency.',
    bullets: ['Extracts actual design tokens from live pages', 'WCAG contrast compliance checking', 'Multi-page crawling', 'JSON token output for design systems'],
    cli: () => <>
      <P>$</P> bad design-audit \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--extract-tokens</F> <F>--pages</F> <S>'/, /pricing, /docs'</S>{'\n\n'}
      <D>Auditing 3 pages...</D>{'\n\n'}
      <W>Health Score: </W><P>82</P><W>/100</W>{'\n\n'}
      {'  '}<Y>⚠</Y> <W>Typography: 3 inconsistent font sizes</W>{'\n'}
      {'  '}<Y>⚠</Y> <W>Spacing: 12px/16px mixed in cards</W>{'\n'}
      {'  '}<P>✓</P> <W>Colors: Consistent palette</W>{'\n'}
      {'  '}<P>✓</P> <W>Contrast: WCAG AA compliant</W>{'\n\n'}
      <D>Tokens → design-tokens.json</D>
    </>,
    sdk: () => <>
      <K>const</K> <W>audit</W> = <K>await</K> agent.<W>designAudit</W>({'{'}{'\n'}
      {'  '}url: <S>'https://your-app.com'</S>,{'\n'}
      {'  '}pages: [<S>'/'</S>, <S>'/pricing'</S>, <S>'/docs'</S>],{'\n'}
      {'  '}extractTokens: <Y>true</Y>,{'\n'}
      {'}'});{'\n\n'}
      console.log(audit.score);    <D>{'// 82'}</D>{'\n'}
      console.log(audit.findings); <D>{'// [{type, severity}]'}</D>{'\n'}
      console.log(audit.tokens);   <D>{'// {colors, fonts}'}</D>
    </>,
  },
  {
    key: 'diff',
    label: 'Visual Diff',
    title: 'Catch visual regressions before users do.',
    desc: 'Compare your staging site against baseline screenshots pixel-by-pixel. Flag layout shifts, color changes, and missing elements with configurable thresholds.',
    bullets: ['Pixel-level comparison with diff images', 'Configurable threshold per page', 'Layout shift detection', 'CI integration for PR checks'],
    cli: () => <>
      <P>$</P> bad visual-diff \{'\n'}
      {'  '}<F>--baseline</F> <S>./screenshots/v1</S> \{'\n'}
      {'  '}<F>--current</F> <S>https://staging.your-app.com</S> \{'\n'}
      {'  '}<F>--threshold</F> <Y>0.02</Y>{'\n\n'}
      <D>Comparing 8 pages...</D>{'\n\n'}
      <P>✓</P> <W>/</W>          <D>0.00% diff</D>{'\n'}
      <P>✓</P> <W>/pricing</W>   <D>0.01% diff</D>{'\n'}
      <Y>⚠</Y> <W>/dashboard</W> <D>4.21% — layout shift</D>{'\n'}
      <P>✓</P> <W>/settings</W>  <D>0.00% diff</D>{'\n\n'}
      <W>1 regression detected</W>
    </>,
    sdk: () => <>
      <K>const</K> <W>diff</W> = <K>await</K> agent.<W>visualDiff</W>({'{'}{'\n'}
      {'  '}baseline: <S>'./screenshots/v1'</S>,{'\n'}
      {'  '}currentUrl: <S>'https://staging.app.com'</S>,{'\n'}
      {'  '}threshold: <Y>0.02</Y>,{'\n'}
      {'}'});{'\n\n'}
      diff.pages.filter(p ={'>'} p.regression){'\n'}
      {'  '}.forEach(p ={'>'} console.log(p.path, p.diff));
    </>,
  },
  {
    key: 'scrape',
    label: 'Scrape',
    title: 'Extract structured data from any site.',
    desc: 'Point the agent at a URL with a natural language extraction prompt. It crawls pages, understands content semantically, and returns structured JSON.',
    bullets: ['Depth-controlled crawling', 'Natural language extraction queries', 'Code block and API endpoint detection', 'Structured JSON output'],
    cli: () => <>
      <P>$</P> bad scrape \{'\n'}
      {'  '}<F>--url</F> <S>https://docs.example.com</S> \{'\n'}
      {'  '}<F>--depth</F> <Y>3</Y> \{'\n'}
      {'  '}<F>--extract</F> <S>"all API endpoints and code examples"</S>{'\n\n'}
      <D>Crawling docs.example.com (depth: 3)...</D>{'\n'}
      <D>  47 pages · 128 code blocks · 34 endpoints</D>{'\n\n'}
      <P>✓ Saved to api-reference.json</P>
    </>,
    sdk: () => <>
      <K>const</K> <W>data</W> = <K>await</K> agent.<W>scrape</W>({'{'}{'\n'}
      {'  '}url: <S>'https://docs.example.com'</S>,{'\n'}
      {'  '}depth: <Y>3</Y>,{'\n'}
      {'  '}extract: <S>'all API endpoints and code examples'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(data.pages.length);      <D>{'// 47'}</D>{'\n'}
      console.log(data.codeBlocks.length); <D>{'// 128'}</D>
    </>,
  },
];

export default function BrowserAgentShowcase() {
  const [mode, setMode] = useState<'cli' | 'sdk'>('cli');
  const [activeKey, setActiveKey] = useState(examples[0].key);
  const current = examples.find(e => e.key === activeKey) ?? examples[0];
  const Content = mode === 'cli' ? current.cli : current.sdk;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* Left: context card */}
      <div>
        {/* Tab pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.5rem' }}>
          {examples.map(ex => (
            <button
              key={ex.key}
              type="button"
              onClick={() => setActiveKey(ex.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: activeKey === ex.key ? '1px solid rgba(97,114,243,0.4)' : '1px solid rgba(255,255,255,0.08)',
                background: activeKey === ex.key ? 'rgba(97,114,243,0.12)' : 'transparent',
                color: activeKey === ex.key ? '#818cf8' : 'rgba(255,255,255,0.4)',
                fontFamily: sat,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{ minHeight: 280 }}>
          <h3 style={{ fontFamily: sat, fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1.25, marginBottom: '0.75rem' }}>
            {current.title}
          </h3>
          <p style={{ fontFamily: sat, fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            {current.desc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {current.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#6172f3', fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>→</span>
                <span style={{ fontFamily: sat, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: '20px' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: terminal */}
      <div style={{ overflow: 'hidden', borderRadius: 16, border: '2px solid rgb(42,43,57)', background: '#0a0a0a' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '8px 14px' }}>
          <div style={{ display: 'flex', gap: 6, marginRight: 14, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,95,87,0.8)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(254,188,46,0.8)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(97,114,243,0.8)' }} />
          </div>

          {/* CLI / SDK toggle */}
          <div style={{ display: 'flex', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', padding: 2, marginRight: 12 }}>
            {(['cli', 'sdk'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 600,
                  background: mode === m ? 'rgba(97,114,243,0.2)' : 'transparent',
                  color: mode === m ? '#818cf8' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'cli' ? '$ CLI' : '{ } SDK'}
              </button>
            ))}
          </div>

          <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
            bad {current.key === 'e2e' ? 'run' : current.key === 'suite' ? 'run --cases' : current.key === 'showcase' ? 'showcase' : current.key === 'audit' ? 'design-audit' : current.key === 'diff' ? 'visual-diff' : 'scrape'}
          </span>
        </div>

        {/* Code */}
        <pre style={{
          padding: 20,
          fontFamily: mono,
          fontSize: 13.5,
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.8)',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: 320,
          maxHeight: 440,
          overflowY: 'auto',
          overflowX: 'auto',
        }}>
          <code>
            <Content />
          </code>
        </pre>
      </div>
    </div>
  );
}
