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
  cli: () => React.ReactNode;
  sdk: () => React.ReactNode;
}

const examples: Example[] = [
  {
    key: 'e2e',
    label: 'E2E Test',
    cli: () => <>
      <P>$</P> bad run \{'\n'}
      {'  '}<F>--goal</F> <S>"Sign up, verify welcome email, check dashboard"</S> \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--model</F> <D>claude-sonnet-4-20250514</D> <F>--vision</F>{'\n\n'}
      <D>agent-driver v0.10.0</D>{'\n'}
      <D>Model: anthropic/claude-sonnet-4-20250514 | Vision: ✓</D>{'\n\n'}
      <W>  ▶ Sign up, verify welcome email, check dashboard</W>{'\n'}
      <D>    turn 1  navigate  → /signup</D>{'\n'}
      <D>    turn 2  type      → email · test@example.com</D>{'\n'}
      <D>    turn 3  click     → "Create Account"</D>{'\n'}
      <D>    turn 4  evaluate  → welcome banner visible</D>{'\n'}
      <D>    turn 5  navigate  → /dashboard</D>{'\n'}
      <D>    turn 6  evaluate  → user data loaded</D>{'\n\n'}
      <P>  ✓ Goal achieved</P> <D>(6 turns, 12.1s)</D>{'\n'}
      <D>    Screenshots: 6 · Video: recording.webm</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n\n'}
      <K>const</K> <W>driver</W> = <K>new</K> <W>PlaywrightDriver</W>(page);{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'} driver {'}'});{'\n\n'}
      <K>const</K> <W>result</W> = <K>await</K> agent.<W>run</W>({'{'}{'\n'}
      {'  '}goal: <S>'Sign up, verify welcome email, check dashboard'</S>,{'\n'}
      {'  '}startUrl: <S>'https://your-app.com'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(result.success); <D>{'// true'}</D>{'\n'}
      console.log(result.turns);   <D>{'// 6'}</D>
    </>,
  },
  {
    key: 'test-suite',
    label: 'Test Suite',
    cli: () => <>
      <P>$</P> bad run <F>--cases</F> <S>tests/e2e.json</S> <F>--concurrency</F> <Y>4</Y>{'\n\n'}
      <D>Running 5 test cases (4 concurrent)...</D>{'\n\n'}
      <P>✓</P> <W>signup</W>         <D>(4 turns, 8.1s)</D>{'\n'}
      <P>✓</P> <W>login</W>          <D>(2 turns, 3.4s)</D>{'\n'}
      <P>✓</P> <W>create-project</W> <D>(6 turns, 14.2s)</D>{'\n'}
      <Y>✗</Y> <W>billing</W>        <D>(stuck at payment modal)</D>{'\n'}
      <P>✓</P> <W>settings</W>       <D>(3 turns, 5.8s)</D>{'\n\n'}
      <D>Pass: 4/5 · Fail: 1 · Duration: 31.5s</D>{'\n'}
      <D>Report: ./results/report.html</D>
    </>,
    sdk: () => <>
      <K>const</K> <W>cases</W> = [{'\n'}
      {'  '}{'{'} id: <S>'signup'</S>, goal: <S>'Create account'</S>, startUrl: <S>'/signup'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'login'</S>, goal: <S>'Login with credentials'</S>, startUrl: <S>'/login'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'billing'</S>, goal: <S>'Update payment method'</S>, startUrl: <S>'/billing'</S> {'},'}{'\n'}
      ];{'\n\n'}
      <K>const</K> <W>results</W> = <K>await</K> agent.<W>runBatch</W>(cases, {'{'}{'\n'}
      {'  '}concurrency: <Y>4</Y>,{'\n'}
      {'}'});{'\n\n'}
      <K>for</K> (<K>const</K> <W>r</W> <K>of</K> results) {'{'}{'\n'}
      {'  '}console.log(`${'{'}<W>r</W>.id{'}'}: ${'{'}<W>r</W>.success ? <S>'✓'</S> : <S>'✗'</S>{'}'}`);{'\n'}
      {'}'}
    </>,
  },
  {
    key: 'showcase',
    label: 'Showcase',
    cli: () => <>
      <P>$</P> bad showcase \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--steps</F> <S>'Navigate to signup, Fill form, Submit, Check dashboard'</S> \{'\n'}
      {'  '}<F>--format</F> demo{'\n\n'}
      <D>Capturing 4 steps...</D>{'\n'}
      <P>✓</P> <W>Step 1</W> Navigate to signup <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 2</W> Fill form <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 3</W> Submit <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 4</W> Check dashboard <D>(screenshot + highlight)</D>{'\n\n'}
      <P>✓ Demo generated</P>{'\n'}
      <D>  → showcase-demo.html (interactive player)</D>{'\n'}
      <D>  → showcase.gif (animated)</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>runShowcase</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver/showcase'</S>;{'\n\n'}
      <K>const</K> <W>result</W> = <K>await</K> <W>runShowcase</W>(page, {'{'}{'\n'}
      {'  '}steps: [{'\n'}
      {'    '}{'{'} action: <S>'navigate'</S>, url: <S>'/signup'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'fill'</S>, selector: <S>'form'</S>, values: {'{'} email: <S>'test@test.com'</S> {'}'} {'},'}{'\n'}
      {'    '}{'{'} action: <S>'click'</S>, selector: <S>'button[type=submit]'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'wait'</S>, selector: <S>'.dashboard'</S> {'},'}{'\n'}
      {'  '}],{'\n'}
      {'  '}format: <S>'demo'</S>,{'\n'}
      {'}'});
    </>,
  },
  {
    key: 'design-audit',
    label: 'Design Audit',
    cli: () => <>
      <P>$</P> bad design-audit \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--extract-tokens</F> \{'\n'}
      {'  '}<F>--pages</F> <S>'/, /pricing, /docs'</S>{'\n\n'}
      <D>Auditing 3 pages...</D>{'\n'}
      <D>Viewport: 1440×900</D>{'\n\n'}
      <W>Health Score: </W><P>82</P><W>/100</W>{'\n\n'}
      <W>Findings:</W>{'\n'}
      {'  '}<Y>⚠</Y> <W>Typography: 3 inconsistent font sizes</W>{'\n'}
      {'  '}<Y>⚠</Y> <W>Spacing: 12px/16px mixed in cards</W>{'\n'}
      {'  '}<P>✓</P> <W>Colors: Consistent palette</W>{'\n'}
      {'  '}<P>✓</P> <W>Contrast: WCAG AA compliant</W>{'\n\n'}
      <D>Tokens → ./design-tokens.json</D>{'\n'}
      <D>Screenshots → ./audit-results/</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>designAudit</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n\n'}
      <K>const</K> <W>audit</W> = <K>await</K> <W>designAudit</W>({'{'}{'\n'}
      {'  '}url: <S>'https://your-app.com'</S>,{'\n'}
      {'  '}pages: [<S>'/'</S>, <S>'/pricing'</S>, <S>'/docs'</S>],{'\n'}
      {'  '}extractTokens: <Y>true</Y>,{'\n'}
      {'}'});{'\n\n'}
      console.log(audit.score);    <D>{'// 82'}</D>{'\n'}
      console.log(audit.findings); <D>{'// [{type, severity, ...}]'}</D>{'\n'}
      console.log(audit.tokens);   <D>{'// {colors, fonts, spacing}'}</D>
    </>,
  },
  {
    key: 'visual-diff',
    label: 'Visual Diff',
    cli: () => <>
      <P>$</P> bad visual-diff \{'\n'}
      {'  '}<F>--baseline</F> <S>./screenshots/v1</S> \{'\n'}
      {'  '}<F>--current</F> <S>https://staging.your-app.com</S> \{'\n'}
      {'  '}<F>--threshold</F> <Y>0.02</Y>{'\n\n'}
      <D>Comparing 8 pages against baseline...</D>{'\n\n'}
      <P>✓</P> <W>/</W>          <D>0.00% diff</D>{'\n'}
      <P>✓</P> <W>/pricing</W>   <D>0.01% diff</D>{'\n'}
      <Y>⚠</Y> <W>/dashboard</W> <D>4.21% diff — layout shift detected</D>{'\n'}
      <P>✓</P> <W>/settings</W>  <D>0.00% diff</D>{'\n\n'}
      <D>Diff images → ./visual-diff/</D>{'\n'}
      <W>1 regression detected</W>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>visualDiff</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n\n'}
      <K>const</K> <W>diff</W> = <K>await</K> <W>visualDiff</W>({'{'}{'\n'}
      {'  '}baseline: <S>'./screenshots/v1'</S>,{'\n'}
      {'  '}currentUrl: <S>'https://staging.your-app.com'</S>,{'\n'}
      {'  '}threshold: <Y>0.02</Y>,{'\n'}
      {'}'});{'\n\n'}
      <K>for</K> (<K>const</K> <W>page</W> <K>of</K> diff.pages) {'{'}{'\n'}
      {'  '}<K>if</K> (page.diffPercent {'>'} <Y>0.02</Y>) {'{'}{'\n'}
      {'    '}console.log(`Regression: ${'{'}<W>page</W>.path{'}'}`);{'\n'}
      {'  '}{'}'}{'\n'}
      {'}'}
    </>,
  },
  {
    key: 'scrape',
    label: 'Scrape',
    cli: () => <>
      <P>$</P> bad scrape \{'\n'}
      {'  '}<F>--url</F> <S>https://docs.example.com</S> \{'\n'}
      {'  '}<F>--depth</F> <Y>3</Y> \{'\n'}
      {'  '}<F>--extract</F> <S>"all code examples and API endpoints"</S> \{'\n'}
      {'  '}<F>--output</F> <S>api-reference.json</S>{'\n\n'}
      <D>Crawling docs.example.com (depth: 3)...</D>{'\n'}
      <D>  Discovered 47 pages</D>{'\n'}
      <D>  Extracted 128 code blocks</D>{'\n'}
      <D>  Found 34 API endpoints</D>{'\n\n'}
      <P>✓ Saved to api-reference.json</P>{'\n'}
      <D>  47 pages · 128 code blocks · 34 endpoints</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'} driver {'}'});{'\n\n'}
      <K>const</K> <W>data</W> = <K>await</K> agent.<W>scrape</W>({'{'}{'\n'}
      {'  '}url: <S>'https://docs.example.com'</S>,{'\n'}
      {'  '}depth: <Y>3</Y>,{'\n'}
      {'  '}extract: <S>'all code examples and API endpoints'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(data.pages.length);    <D>{'// 47'}</D>{'\n'}
      console.log(data.codeBlocks.length); <D>{'// 128'}</D>
    </>,
  },
];

export default function BrowserAgentShowcase() {
  const [mode, setMode] = useState<'cli' | 'sdk'>('cli');
  const [activeExample, setActiveExample] = useState(examples[0].key);
  const current = examples.find(e => e.key === activeExample) ?? examples[0];
  const Content = mode === 'cli' ? current.cli : current.sdk;

  return (
    <div style={{ overflow: 'hidden', borderRadius: 16, border: '2px solid rgb(42,43,57)', background: '#0a0a0a' }}>
      {/* Mode toggle + example tabs */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {/* Window dots */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,95,87,0.8)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(254,188,46,0.8)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(97,114,243,0.8)' }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', padding: 2, marginRight: 12, flexShrink: 0 }}>
          {(['cli', 'sdk'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '4px 12px',
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

        {/* Example tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', flex: 1, padding: '0 8px' }}>
          {examples.map(ex => (
            <button
              key={ex.key}
              type="button"
              onClick={() => setActiveExample(ex.key)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: sat,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: activeExample === ex.key ? 'rgba(97,114,243,0.15)' : 'transparent',
                color: activeExample === ex.key ? '#818cf8' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.15s',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code content */}
      <pre style={{
        padding: 20,
        fontFamily: mono,
        fontSize: 12.5,
        lineHeight: 1.7,
        color: 'rgba(255,255,255,0.8)',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        height: 380,
        overflowY: 'auto',
        overflowX: 'auto',
      }}>
        <code>
          <Content />
        </code>
      </pre>
    </div>
  );
}
