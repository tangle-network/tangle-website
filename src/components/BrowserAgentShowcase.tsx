import { useState } from 'react';

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sat = "'Satoshi Variable', 'Satoshi', sans-serif";

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
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
  cli: () => React.ReactNode;
  sdk: () => React.ReactNode;
}

const examples: Example[] = [
  {
    key: 'e2e', label: 'E2E Test', icon: '▶',
    title: 'End-to-end testing in one sentence.',
    desc: 'Describe a user flow in plain English. The agent launches a browser, navigates autonomously using vision, and verifies every step with screenshots as proof.',
    bullets: ['No selectors or scripts to write', 'Vision-based page understanding', 'Screenshots + video per turn', 'Works with any web framework'],
    cli: () => <>
      <P>$</P> bad run \{'\n'}
      {'  '}<F>--goal</F> <S>"Sign up, verify email, check dashboard"</S> \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--model</F> <D>claude-sonnet-4-20250514</D> <F>--vision</F>{'\n\n'}
      <D>agent-driver v0.10.0</D>{'\n'}
      <D>Model: claude-sonnet-4-20250514 | Vision: ✓</D>{'\n\n'}
      <W>  ▶ Sign up, verify email, check dashboard</W>{'\n'}
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
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n'}
      <K>const</K> <W>driver</W> = <K>new</K> <W>PlaywrightDriver</W>(page);{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'}{'\n'}
      {'  '}driver,{'\n'}
      {'  '}config: {'{'} model: <S>'claude-sonnet-4-20250514'</S>, vision: <Y>true</Y> {'}'}{'\n'}
      {'}'});{'\n\n'}
      <K>const</K> <W>result</W> = <K>await</K> agent.<W>run</W>({'{'}{'\n'}
      {'  '}goal: <S>'Sign up, verify email, check dashboard'</S>,{'\n'}
      {'  '}startUrl: <S>'https://your-app.com'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(result.success);     <D>{'// true'}</D>{'\n'}
      console.log(result.turns);       <D>{'// 6'}</D>{'\n'}
      console.log(result.screenshots); <D>{'// ["step-1.png", ...]'}</D>
    </>,
  },
  {
    key: 'suite', label: 'Test Suite', icon: '⚡',
    title: 'Run dozens of tests in parallel.',
    desc: 'Define test cases as JSON — goals and URLs. The agent runs them concurrently across browser instances and reports pass/fail with full evidence.',
    bullets: ['Concurrent execution across browsers', 'JSON-based test definitions', 'Per-test screenshots and traces', 'CI-friendly exit codes'],
    cli: () => <>
      <P>$</P> bad run <F>--cases</F> <S>tests/e2e.json</S> <F>--concurrency</F> <Y>4</Y>{'\n\n'}
      <D>Running 5 test cases (4 concurrent)...</D>{'\n\n'}
      <P>✓</P> <W>signup</W>         <D>(4 turns, 8.1s)</D>{'\n'}
      <P>✓</P> <W>login</W>          <D>(2 turns, 3.4s)</D>{'\n'}
      <P>✓</P> <W>create-project</W> <D>(6 turns, 14.2s)</D>{'\n'}
      <Y>✗</Y> <W>billing</W>        <D>(stuck at payment modal)</D>{'\n'}
      <P>✓</P> <W>settings</W>       <D>(3 turns, 5.8s)</D>{'\n\n'}
      <W>Pass: 4/5 · Fail: 1 · Duration: 31.5s</W>{'\n'}
      <D>Report: ./results/report.html</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'}{'\n'}
      {'  '}driver: <K>new</K> <W>PlaywrightDriver</W>(page),{'\n'}
      {'}'});{'\n\n'}
      <K>const</K> <W>cases</W> = [{'\n'}
      {'  '}{'{'} id: <S>'signup'</S>, goal: <S>'Create account'</S>, startUrl: <S>'/signup'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'login'</S>, goal: <S>'Login with credentials'</S>, startUrl: <S>'/login'</S> {'},'}{'\n'}
      {'  '}{'{'} id: <S>'billing'</S>, goal: <S>'Update payment method'</S>, startUrl: <S>'/billing'</S> {'},'}{'\n'}
      ];{'\n\n'}
      <K>const</K> <W>results</W> = <K>await</K> agent.<W>runBatch</W>(cases, {'{'}{'\n'}
      {'  '}concurrency: <Y>4</Y>,{'\n'}
      {'}'});{'\n\n'}
      results.forEach(r ={'>'} console.log(r.id, r.success));
    </>,
  },
  {
    key: 'showcase', label: 'Showcase', icon: '📸',
    title: 'Generate product demos automatically.',
    desc: 'Walk through your app step-by-step. Each step is captured with highlighted elements, assembled into an interactive HTML player or animated GIF.',
    bullets: ['Interactive HTML demo player', 'Animated GIF export', 'Element highlighting per step', 'Zero manual screenshot work'],
    cli: () => <>
      <P>$</P> bad showcase \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--steps</F> <S>'Navigate signup, Fill form, Submit, Dashboard'</S> \{'\n'}
      {'  '}<F>--format</F> demo{'\n\n'}
      <D>Capturing 4 steps...</D>{'\n'}
      <P>✓</P> <W>Step 1</W> Navigate signup <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 2</W> Fill form <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 3</W> Submit <D>(screenshot + highlight)</D>{'\n'}
      <P>✓</P> <W>Step 4</W> Dashboard <D>(screenshot + highlight)</D>{'\n\n'}
      <P>✓ Demo generated</P>{'\n'}
      <D>  → showcase-demo.html (interactive player)</D>{'\n'}
      <D>  → showcase.gif (animated)</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>runShowcase</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver/showcase'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n\n'}
      <K>const</K> <W>demo</W> = <K>await</K> <W>runShowcase</W>(page, {'{'}{'\n'}
      {'  '}steps: [{'\n'}
      {'    '}{'{'} action: <S>'navigate'</S>, url: <S>'/signup'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'fill'</S>, selector: <S>'form'</S>,{'\n'}
      {'      '}values: {'{'} email: <S>'test@test.com'</S> {'}'} {'},'}{'\n'}
      {'    '}{'{'} action: <S>'click'</S>, selector: <S>'button[type=submit]'</S> {'},'}{'\n'}
      {'    '}{'{'} action: <S>'wait'</S>, selector: <S>'.dashboard'</S> {'},'}{'\n'}
      {'  '}],{'\n'}
      {'  '}format: <S>'demo'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(demo.htmlPath); <D>{'// showcase-demo.html'}</D>{'\n'}
      console.log(demo.gifPath);  <D>{'// showcase.gif'}</D>
    </>,
  },
  {
    key: 'audit', label: 'Design Audit', icon: '📐',
    title: 'Audit your UI for design consistency.',
    desc: 'Crawl your site and extract live design tokens — fonts, colors, spacing. Get a health score with actionable findings on typography, contrast, and layout.',
    bullets: ['Extracts tokens from live pages', 'WCAG contrast compliance', 'Multi-page crawling', 'JSON token export'],
    cli: () => <>
      <P>$</P> bad design-audit \{'\n'}
      {'  '}<F>--url</F> <S>https://your-app.com</S> \{'\n'}
      {'  '}<F>--extract-tokens</F> \{'\n'}
      {'  '}<F>--pages</F> <S>'/, /pricing, /docs'</S>{'\n\n'}
      <D>Auditing 3 pages at 1440×900...</D>{'\n\n'}
      <W>Health Score: </W><P>82</P><W>/100</W>{'\n\n'}
      {'  '}<Y>⚠</Y> <W>Typography: 3 inconsistent font sizes</W>{'\n'}
      {'  '}<Y>⚠</Y> <W>Spacing: 12px/16px mixed in cards</W>{'\n'}
      {'  '}<P>✓</P> <W>Colors: Consistent palette</W>{'\n'}
      {'  '}<P>✓</P> <W>Contrast: WCAG AA compliant</W>{'\n\n'}
      <D>Tokens → design-tokens.json</D>{'\n'}
      <D>Screenshots → ./audit-results/</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'}{'\n'}
      {'  '}driver: <K>new</K> <W>PlaywrightDriver</W>(page),{'\n'}
      {'}'});{'\n\n'}
      <K>const</K> <W>audit</W> = <K>await</K> agent.<W>designAudit</W>({'{'}{'\n'}
      {'  '}url: <S>'https://your-app.com'</S>,{'\n'}
      {'  '}pages: [<S>'/'</S>, <S>'/pricing'</S>, <S>'/docs'</S>],{'\n'}
      {'  '}extractTokens: <Y>true</Y>,{'\n'}
      {'}'});{'\n\n'}
      console.log(audit.score);    <D>{'// 82'}</D>{'\n'}
      console.log(audit.findings); <D>{'// [{type, severity, msg}]'}</D>{'\n'}
      console.log(audit.tokens);   <D>{'// {colors, fonts, spacing}'}</D>
    </>,
  },
  {
    key: 'diff', label: 'Visual Diff', icon: '🔍',
    title: 'Catch regressions before users do.',
    desc: 'Compare staging against baseline screenshots pixel-by-pixel. Detect layout shifts, color changes, and missing elements with configurable thresholds.',
    bullets: ['Pixel-level diff images', 'Configurable threshold', 'Layout shift detection', 'CI integration for PR checks'],
    cli: () => <>
      <P>$</P> bad visual-diff \{'\n'}
      {'  '}<F>--baseline</F> <S>./screenshots/v1</S> \{'\n'}
      {'  '}<F>--current</F> <S>https://staging.your-app.com</S> \{'\n'}
      {'  '}<F>--threshold</F> <Y>0.02</Y>{'\n\n'}
      <D>Comparing 8 pages against baseline...</D>{'\n\n'}
      <P>✓</P> <W>/</W>          <D>0.00% diff</D>{'\n'}
      <P>✓</P> <W>/pricing</W>   <D>0.01% diff</D>{'\n'}
      <Y>⚠</Y> <W>/dashboard</W> <D>4.21% — layout shift detected</D>{'\n'}
      <P>✓</P> <W>/settings</W>  <D>0.00% diff</D>{'\n\n'}
      <W>1 regression detected</W>{'\n'}
      <D>Diff images → ./visual-diff/</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'}{'\n'}
      {'  '}driver: <K>new</K> <W>PlaywrightDriver</W>(page),{'\n'}
      {'}'});{'\n\n'}
      <K>const</K> <W>diff</W> = <K>await</K> agent.<W>visualDiff</W>({'{'}{'\n'}
      {'  '}baseline: <S>'./screenshots/v1'</S>,{'\n'}
      {'  '}currentUrl: <S>'https://staging.your-app.com'</S>,{'\n'}
      {'  '}threshold: <Y>0.02</Y>,{'\n'}
      {'}'});{'\n\n'}
      console.log(diff.regressions); <D>{'// [{path, diffPercent}]'}</D>
    </>,
  },
  {
    key: 'scrape', label: 'Scrape', icon: '🕸',
    title: 'Extract structured data from any site.',
    desc: 'Point the agent at a URL with a natural language extraction query. It crawls pages, understands content semantically, and returns structured JSON.',
    bullets: ['Depth-controlled crawling', 'Natural language queries', 'Code block detection', 'Structured JSON output'],
    cli: () => <>
      <P>$</P> bad scrape \{'\n'}
      {'  '}<F>--url</F> <S>https://docs.example.com</S> \{'\n'}
      {'  '}<F>--depth</F> <Y>3</Y> \{'\n'}
      {'  '}<F>--extract</F> <S>"all API endpoints and code examples"</S> \{'\n'}
      {'  '}<F>--output</F> <S>api-reference.json</S>{'\n\n'}
      <D>Crawling docs.example.com (depth: 3)...</D>{'\n'}
      <D>  Discovered 47 pages</D>{'\n'}
      <D>  Extracted 128 code blocks</D>{'\n'}
      <D>  Found 34 API endpoints</D>{'\n\n'}
      <P>✓ Saved to api-reference.json</P>{'\n'}
      <D>  47 pages · 128 code blocks · 34 endpoints</D>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<W>BrowserAgent</W>, <W>PlaywrightDriver</W>{' }'}{'\n'}
      <K>from</K> <S>'@tangle-network/browser-agent-driver'</S>;{'\n'}
      <K>import</K> {'{ '}<W>chromium</W>{' }'} <K>from</K> <S>'playwright'</S>;{'\n\n'}
      <K>const</K> <W>browser</W> = <K>await</K> chromium.launch();{'\n'}
      <K>const</K> <W>page</W> = <K>await</K> browser.newPage();{'\n'}
      <K>const</K> <W>agent</W> = <K>new</K> <W>BrowserAgent</W>({'{'}{'\n'}
      {'  '}driver: <K>new</K> <W>PlaywrightDriver</W>(page),{'\n'}
      {'}'});{'\n\n'}
      <K>const</K> <W>data</W> = <K>await</K> agent.<W>scrape</W>({'{'}{'\n'}
      {'  '}url: <S>'https://docs.example.com'</S>,{'\n'}
      {'  '}depth: <Y>3</Y>,{'\n'}
      {'  '}extract: <S>'all API endpoints and code examples'</S>,{'\n'}
      {'}'});{'\n\n'}
      console.log(data.pages.length);      <D>{'// 47'}</D>{'\n'}
      console.log(data.codeBlocks.length); <D>{'// 128'}</D>{'\n'}
      console.log(data.endpoints.length);  <D>{'// 34'}</D>
    </>,
  },
];

export default function BrowserAgentShowcase() {
  const [mode, setMode] = useState<'cli' | 'sdk'>('cli');
  const [activeKey, setActiveKey] = useState(examples[0].key);
  const current = examples.find(e => e.key === activeKey) ?? examples[0];
  const Content = mode === 'cli' ? current.cli : current.sdk;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 0, borderRadius: 20, border: '2px solid rgb(42,43,57)', overflow: 'hidden', background: '#0a0a0a' }}>

      {/* Left panel */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
        {/* Tab list */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {examples.map(ex => (
            <button
              key={ex.key}
              type="button"
              onClick={() => setActiveKey(ex.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                borderLeft: activeKey === ex.key ? '3px solid #6172f3' : '3px solid transparent',
                background: activeKey === ex.key ? 'rgba(97,114,243,0.08)' : 'transparent',
                color: activeKey === ex.key ? 'white' : 'rgba(255,255,255,0.4)',
                fontFamily: sat,
                fontSize: 14,
                fontWeight: activeKey === ex.key ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{ex.icon}</span>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: '20px 20px 24px', flex: 1 }}>
          <h3 style={{ fontFamily: sat, fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 10 }}>
            {current.title}
          </h3>
          <p style={{ fontFamily: sat, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
            {current.desc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {current.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#6172f3', fontSize: 11, lineHeight: '18px', flexShrink: 0, fontFamily: mono }}>→</span>
                <span style={{ fontFamily: sat, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: '18px' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — terminal */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Terminal chrome */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', gap: 6, marginRight: 16, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,95,87,0.7)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(254,188,46,0.7)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(74,222,128,0.7)' }} />
          </div>

          {/* CLI / SDK toggle */}
          <div style={{ display: 'inline-flex', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', padding: 3, background: 'rgba(255,255,255,0.02)' }}>
            {(['cli', 'sdk'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  padding: '5px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 600,
                  background: mode === m ? 'rgba(97,114,243,0.2)' : 'transparent',
                  color: mode === m ? '#818cf8' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'cli' ? '$ CLI' : '{ } SDK'}
              </button>
            ))}
          </div>

          <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
            {mode === 'cli' ? 'bad' : 'browser-agent-driver'}
          </span>
        </div>

        {/* Code */}
        <pre style={{
          padding: '20px 24px',
          fontFamily: mono,
          fontSize: 15,
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.8)',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
          minHeight: 380,
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
