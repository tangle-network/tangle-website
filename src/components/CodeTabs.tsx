import { useState, type ReactNode } from 'react';

// Syntax highlighting helpers — matching sandbox landing exactly
const K = ({ children }: { children: ReactNode }) => <span style={{ color: '#c084fc' }}>{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span style={{ color: '#a78bfa' }}>{children}</span>;
const C = ({ children }: { children: ReactNode }) => <span style={{ color: 'rgba(255,255,255,0.3)' }}>{children}</span>;
const F = ({ children }: { children: ReactNode }) => <span style={{ color: '#60a5fa' }}>{children}</span>;
const N = ({ children }: { children: ReactNode }) => <span style={{ color: '#fcd34d' }}>{children}</span>;
const V = ({ children }: { children: ReactNode }) => <span style={{ color: '#e2e8f0' }}>{children}</span>;
const SH = ({ children }: { children: ReactNode }) => <span style={{ color: '#4ade80' }}>{children}</span>;

const mono = "'SF Mono', 'Fira Code', 'Cascadia Code', 'Menlo', ui-monospace, monospace";

interface Tab {
  key: string;
  label: string;
  icon: string;
  code: () => ReactNode;
}

// ==================== BROWSER AGENT TABS ====================

function BAGoal() {
  return <>
    <SH>$</SH> bad run \{'\n'}
    {'  '}<K>--goal</K> <S>"Sign up, create project, verify dashboard"</S> \{'\n'}
    {'  '}<K>--url</K> <S>https://your-app.com</S> \{'\n'}
    {'  '}<K>--model</K> claude-sonnet-4-20250514 <K>--vision</K>{'\n\n'}
    <C>agent-driver v0.10.0</C>{'\n'}
    <C>Model: anthropic/claude-sonnet-4-20250514 | Vision: true</C>{'\n\n'}
    {'  '}<V>▶ Sign up, create project, verify dashboard</V>{'\n'}
    <C>{'    '}turn 1: navigate → /signup</C>{'\n'}
    <C>{'    '}turn 2: type → email field</C>{'\n'}
    <C>{'    '}turn 3: click → "Create Account"</C>{'\n'}
    <C>{'    '}turn 4: navigate → /dashboard</C>{'\n'}
    {'  '}<SH>✓ Goal achieved</SH> <C>(4 turns, 9.2s)</C>
  </>;
}

function BATestSuite() {
  return <>
    <C>// cases.json</C>{'\n'}
    <V>[</V>{'\n'}
    {'  '}<V>{'{'}</V>{'\n'}
    {'    '}<S>"id"</S>: <S>"signup"</S>,{'\n'}
    {'    '}<S>"goal"</S>: <S>"Create account and verify email"</S>,{'\n'}
    {'    '}<S>"startUrl"</S>: <S>"https://app.com/signup"</S>{'\n'}
    {'  '}<V>{'}'}</V>,{'\n'}
    {'  '}<V>{'{'}</V>{'\n'}
    {'    '}<S>"id"</S>: <S>"dashboard"</S>,{'\n'}
    {'    '}<S>"goal"</S>: <S>"Verify dashboard loads with data"</S>,{'\n'}
    {'    '}<S>"startUrl"</S>: <S>"https://app.com/dashboard"</S>{'\n'}
    {'  '}<V>{'}'}</V>{'\n'}
    <V>]</V>{'\n\n'}
    <SH>$</SH> bad run <K>--cases</K> cases.json <K>--concurrency</K> <N>4</N>{'\n\n'}
    <SH>✓</SH> <V>signup</V> <C>(3 turns, 8.1s)</C>{'\n'}
    <SH>✓</SH> <V>dashboard</V> <C>(2 turns, 4.3s)</C>{'\n'}
    <C>Pass rate: 100% | 2 tests | 12.4s</C>
  </>;
}

function BASDK() {
  return <>
    <K>import</K> {'{ '}<F>BrowserAgent</F>, <F>PlaywrightDriver</F>{' }'}{'\n'}
    <K>from</K> <S>'@tangle-network/agent-browser-driver'</S>;{'\n\n'}
    <K>const</K> <V>driver</V> = <K>new</K> <F>PlaywrightDriver</F>(page);{'\n'}
    <K>const</K> <V>agent</V> = <K>new</K> <F>BrowserAgent</F>({'{'}{'\n'}
    {'  '}driver,{'\n'}
    {'  '}config: {'{'} model: <S>'claude-sonnet-4-20250514'</S>, vision: <N>true</N> {'}'}{'\n'}
    {'}'});{'\n\n'}
    <K>const</K> <V>result</V> = <K>await</K> agent.<F>run</F>({'{'}{'\n'}
    {'  '}goal: <S>'Sign up, create a project, verify preview'</S>,{'\n'}
    {'  '}startUrl: <S>'https://your-app.com'</S>,{'\n'}
    {'  '}maxTurns: <N>30</N>,{'\n'}
    {'}'});{'\n\n'}
    console.<F>log</F>(result.success); <C>{'// true'}</C>{'\n'}
    console.<F>log</F>(result.screenshots); <C>{'// [...paths]'}</C>
  </>;
}

function BADesignAudit() {
  return <>
    <SH>$</SH> bad design-audit \{'\n'}
    {'  '}<K>--url</K> <S>https://your-app.com</S> \{'\n'}
    {'  '}<K>--extract-tokens</K> \{'\n'}
    {'  '}<K>--model</K> claude-sonnet-4-20250514{'\n\n'}
    <C>Auditing https://your-app.com...</C>{'\n'}
    <C>Viewport: 1440×900 | Pages: 5</C>{'\n\n'}
    <V>Health Score: </V><SH>82</SH><V>/100</V>{'\n\n'}
    <V>Findings:</V>{'\n'}
    {'  '}<N>⚠</N> <V>Typography: 3 inconsistent font sizes</V>{'\n'}
    {'  '}<N>⚠</N> <V>Spacing: 12px/16px mixed in cards</V>{'\n'}
    {'  '}<SH>✓</SH> <V>Colors: Consistent palette</V>{'\n'}
    {'  '}<SH>✓</SH> <V>Contrast: WCAG AA compliant</V>{'\n\n'}
    <C>Tokens saved to ./design-tokens.json</C>{'\n'}
    <C>Screenshots saved to ./audit-results/</C>
  </>;
}

// ==================== SANDBOX TABS ====================

function SBCreate() {
  return <>
    <K>import</K> {'{ '}<F>Sandbox</F>{' }'} <K>from</K> <S>"@tangle-network/sandbox"</S>{'\n\n'}
    <K>const</K> <V>sandbox</V> = <K>new</K> <F>Sandbox</F>({'{'} apiKey: <S>"sk_sandbox_..."</S> {'}'});{'\n\n'}
    <C>{'// Create a sandbox with any Docker image'}</C>{'\n'}
    <K>const</K> <V>box</V> = <K>await</K> sandbox.<F>create</F>({'{'}{'\n'}
    {'  '}image: <S>"node:20"</S>,{'\n'}
    {'  '}env: {'{'} <V>NODE_ENV</V>: <S>"production"</S> {'},'}{'\n'}
    {'}'});{'\n\n'}
    <C>{'// Execute commands directly'}</C>{'\n'}
    <K>const</K> <V>result</V> = <K>await</K> box.<F>exec</F>(<S>"npm install && npm test"</S>);{'\n'}
    console.<F>log</F>(result.stdout);{'\n'}
    console.<F>log</F>(result.exitCode); <C>{'// 0'}</C>
  </>;
}

function SBAgent() {
  return <>
    <C>{'// Run an AI agent inside the sandbox'}</C>{'\n'}
    <K>const</K> <V>response</V> = <K>await</K> box.<F>prompt</F>({'\n'}
    {'  '}<S>"Find and fix the failing tests in this repo"</S>{'\n'}
    );{'\n\n'}
    <C>{'// Multi-turn task — agent works until done'}</C>{'\n'}
    <K>const</K> <V>task</V> = <K>await</K> box.<F>task</F>({'\n'}
    {'  '}<S>"Create a REST API with JWT authentication"</S>,{'\n'}
    {'  '}{'{'} maxTurns: <N>20</N> {'}'}{'\n'}
    );{'\n\n'}
    console.<F>log</F>(task.response);{'\n'}
    console.<F>log</F>(<S>{"`Turns: ${task.turnsUsed}`"}</S>);
  </>;
}

function SBStream() {
  return <>
    <C>{'// Stream responses in real-time'}</C>{'\n'}
    <K>for await</K> (<K>const</K> <V>event</V> <K>of</K> box.<F>streamTask</F>({'\n'}
    {'  '}<S>"Refactor this codebase to use TypeScript"</S>{'\n'}
    )) {'{'}{'\n'}
    {'  '}<K>switch</K> (event.type) {'{'}{'\n'}
    {'    '}<K>case</K> <S>"tool_call"</S>:{'\n'}
    {'      '}console.<F>log</F>(<S>{"`Using: ${event.data.name}`"}</S>);{'\n'}
    {'      '}<K>break</K>;{'\n'}
    {'    '}<K>case</K> <S>"message.updated"</S>:{'\n'}
    {'      '}process.stdout.<F>write</F>(event.data.content);{'\n'}
    {'      '}<K>break</K>;{'\n'}
    {'    '}<K>case</K> <S>"task.complete"</S>:{'\n'}
    {'      '}console.<F>log</F>(<S>"Done!"</S>);{'\n'}
    {'  '}{'}'}{'\n'}
    {'}'}
  </>;
}

function SBCLI() {
  return <>
    <C>{'# Install the CLI'}</C>{'\n'}
    <SH>$</SH> npm install -g @tangle-network/sandbox{'\n\n'}
    <C>{'# Authenticate'}</C>{'\n'}
    <SH>$</SH> tangle auth login --api-key sk_...{'\n\n'}
    <C>{'# Create and connect'}</C>{'\n'}
    <SH>$</SH> tangle sandbox create --name my-box --image node:20 --ssh{'\n'}
    <SH>$</SH> tangle ssh sbx_a8f3c2d1{'\n\n'}
    <C>{'# Run AI agent tasks'}</C>{'\n'}
    <SH>$</SH> tangle agent task sbx_a8f3c2d1 <S>"Fix the failing tests"</S>{'\n\n'}
    <C>{'# Manage lifecycle'}</C>{'\n'}
    <SH>$</SH> tangle sandbox list{'\n'}
    <SH>$</SH> tangle sandbox stop sbx_a8f3c2d1
  </>;
}

// ==================== TAB COMPONENT ====================

const tabSets: Record<string, Tab[]> = {
  browser: [
    { key: 'goal', label: 'Single Task', icon: '▶', code: BAGoal },
    { key: 'suite', label: 'Test Suite', icon: '⚡', code: BATestSuite },
    { key: 'sdk', label: 'SDK', icon: '{ }', code: BASDK },
    { key: 'audit', label: 'Design Audit', icon: '📐', code: BADesignAudit },
  ],
  sandbox: [
    { key: 'create', label: 'Create', icon: '▶', code: SBCreate },
    { key: 'agent', label: 'AI Agent', icon: '🤖', code: SBAgent },
    { key: 'stream', label: 'Stream', icon: '⚡', code: SBStream },
    { key: 'cli', label: 'CLI', icon: '💻', code: SBCLI },
  ],
};

export default function CodeTabs({ variant = 'browser' }: { variant?: 'browser' | 'sandbox' }) {
  const tabs = tabSets[variant];
  const [active, setActive] = useState(tabs[0].key);
  const ActiveCode = tabs.find(t => t.key === active)?.code ?? tabs[0].code;

  return (
    <div style={{
      overflow: 'hidden',
      borderRadius: 12,
      border: '1px solid rgba(142, 89, 255, 0.2)',
      background: '#0a0a0a',
    }}>
      {/* Header with dots + tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        padding: '8px 12px',
      }}>
        {/* Window dots */}
        <div style={{ display: 'flex', gap: 6, marginRight: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,95,87,0.8)' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(254,188,46,0.8)' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(142,89,255,0.8)' }} />
        </div>

        {/* Tab buttons */}
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 6,
              padding: '6px 12px',
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: active === tab.key ? 'rgba(142,89,255,0.15)' : 'transparent',
              color: active === tab.key ? '#c084fc' : 'rgba(255,255,255,0.4)',
            }}
          >
            <span style={{ fontSize: 11 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        {/* Copy button */}
        <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)', cursor: 'pointer', marginLeft: 'auto' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </div>

      {/* Code content */}
      <pre style={{
        overflowX: 'auto',
        padding: 20,
        fontFamily: mono,
        fontSize: 13,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.8)',
        margin: 0,
        whiteSpace: 'pre-wrap',
      }}>
        <code>
          <ActiveCode />
        </code>
      </pre>
    </div>
  );
}
