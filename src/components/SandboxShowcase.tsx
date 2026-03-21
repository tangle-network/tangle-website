import { useState } from 'react';

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sat = "'Satoshi Variable', 'Satoshi', sans-serif";

const P = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#4ade80' }}>{children}</span>;
const F = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#6172f3' }}>{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#a78bfa' }}>{children}</span>;
const D = ({ children }: { children: React.ReactNode }) => <span style={{ color: 'rgba(255,255,255,0.3)' }}>{children}</span>;
const W = ({ children }: { children: React.ReactNode }) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{children}</span>;
const K = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#c084fc' }}>{children}</span>;
const N = ({ children }: { children: React.ReactNode }) => <span style={{ color: '#fcd34d' }}>{children}</span>;

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
    key: 'create', label: 'Create & Execute', icon: '▶',
    title: 'From zero to running in seconds.',
    desc: 'Create an isolated container from any Docker image, execute shell commands, and get structured results. Full root access, custom environment variables, optional SSH.',
    bullets: ['Any Docker image works', 'Full root access', 'Structured stdout/stderr/exit code', 'Sub-200ms exec latency'],
    cli: () => <>
      <P>$</P> tangle sandbox create \{'\n'}
      {'  '}<F>--name</F> <S>my-project</S> \{'\n'}
      {'  '}<F>--image</F> <S>node:20</S> \{'\n'}
      {'  '}<F>--ssh</F>{'\n\n'}
      <D>sandbox-sdk v0.4.0</D>{'\n'}
      <D>Provisioning sandbox...</D>{'\n'}
      <P>  ✓ Sandbox created</P> <D>sbx_a8f3c2d1  ·  region: us-east  ·  2.8s</D>{'\n\n'}
      <P>$</P> tangle sandbox exec sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"npm install && npm test"</S>{'\n\n'}
      <D>  added 847 packages in 12s</D>{'\n'}
      <D>  Tests: 42 passed, 0 failed</D>{'\n'}
      <P>  ✓ exit code 0</P>
    </>,
    sdk: () => <>
      <K>import</K> {'{ '}<F>Sandbox</F>{' }'} <K>from</K> <S>"@tangle-network/sandbox"</S>;{'\n\n'}
      <K>const</K> <W>client</W> = <K>new</K> <F>Sandbox</F>({'{'}{'\n'}
      {'  '}apiKey: process.env.<W>TANGLE_API_KEY</W>,{'\n'}
      {'}'});{'\n\n'}
      <D>{'// Create a sandbox with any Docker image'}</D>{'\n'}
      <K>const</K> <W>box</W> = <K>await</K> client.<F>create</F>({'{'}{'\n'}
      {'  '}name: <S>"my-project"</S>,{'\n'}
      {'  '}image: <S>"node:20"</S>,{'\n'}
      {'  '}sshEnabled: <N>true</N>,{'\n'}
      {'  '}env: {'{'} <W>NODE_ENV</W>: <S>"production"</S> {'},'}{'\n'}
      {'}'});{'\n\n'}
      <K>await</K> box.<F>waitForRunning</F>();{'\n\n'}
      <D>{'// Execute commands directly'}</D>{'\n'}
      <K>const</K> <W>result</W> = <K>await</K> box.<F>exec</F>(<S>"npm install && npm test"</S>);{'\n'}
      console.log(result.exitCode); <D>{'// 0'}</D>{'\n'}
      console.log(result.stdout);   <D>{'// "Tests: 42 passed..."'}</D>
    </>,
  },
  {
    key: 'agent', label: 'AI Agent Task', icon: '🤖',
    title: 'Your agent gets a full computer.',
    desc: 'Send prompts or multi-turn tasks to an AI agent running inside the sandbox. The agent can read files, run commands, install packages, and iterate until the task is done.',
    bullets: ['Claude Code, Codex, OpenCode backends', 'Multi-turn autonomous execution', 'Full tool access inside sandbox', 'Bring your own API key'],
    cli: () => <>
      <P>$</P> tangle agent task sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"Fix the failing tests and commit the changes"</S>{'\n\n'}
      <D>Agent: opencode (claude-sonnet-4)</D>{'\n'}
      <D>  turn 1: reading test output...</D>{'\n'}
      <D>  turn 2: editing src/auth.ts...</D>{'\n'}
      <D>  turn 3: running npm test...</D>{'\n'}
      <D>  turn 4: committing changes...</D>{'\n\n'}
      <P>  ✓ Task complete</P> <D>(4 turns, 38s)</D>{'\n\n'}
      <P>$</P> tangle agent task sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"Create a REST API with JWT auth"</S> \{'\n'}
      {'  '}<F>--max-turns</F> <N>20</N>{'\n\n'}
      <P>  ✓ Task complete</P> <D>(12 turns, 1m 42s)</D>
    </>,
    sdk: () => <>
      <D>{'// Single prompt — one response'}</D>{'\n'}
      <K>const</K> <W>response</W> = <K>await</K> box.<F>prompt</F>({'\n'}
      {'  '}<S>"Find and fix the failing tests"</S>{'\n'}
      );{'\n'}
      console.log(response.response);{'\n\n'}
      <D>{'// Multi-turn task — agent works until done'}</D>{'\n'}
      <K>const</K> <W>task</W> = <K>await</K> box.<F>task</F>({'\n'}
      {'  '}<S>"Create a REST API with JWT authentication"</S>,{'\n'}
      {'  '}{'{'} maxTurns: <N>20</N> {'}'}{'\n'}
      );{'\n\n'}
      console.log(task.turnsUsed);  <D>{'// 12'}</D>{'\n'}
      console.log(task.response);{'\n\n'}
      <D>{'// Use a specific backend'}</D>{'\n'}
      <K>await</K> box.<F>prompt</F>(<S>"Audit this repo"</S>, {'{'}{'\n'}
      {'  '}backend: {'{'} type: <S>"claude-code"</S> {'}'},{'\n'}
      {'}'});
    </>,
  },
  {
    key: 'files', label: 'File System', icon: '📁',
    title: 'Read, write, search, commit.',
    desc: 'Read and write files, search code with ripgrep, manage git repos. Install tools and language runtimes on the fly via mise.',
    bullets: ['Read, write, search files', 'Git status, commit, push', 'Install tools via mise', 'Code search with ripgrep'],
    cli: () => <>
      <P>$</P> tangle sandbox exec sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"cat src/index.ts"</S>{'\n\n'}
      <D>  export const app = new Hono();</D>{'\n'}
      <D>  app.get("/", (c) ={'>'} c.text("Hello"));</D>{'\n\n'}
      <P>$</P> tangle sandbox exec sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"pip install torch && python train.py"</S>{'\n\n'}
      <D>  Installing torch...</D>{'\n'}
      <D>  Epoch 1/10  loss: 0.834</D>{'\n'}
      <D>  Epoch 2/10  loss: 0.412</D>{'\n\n'}
      <P>$</P> tangle sandbox ssh sbx_a8f3c2d1{'\n'}
      <P>root@sbx</P><D>:</D><S>~#</S> git status{'\n'}
      <D>  modified: src/auth.ts</D>{'\n'}
      <D>  modified: tests/auth.test.ts</D>
    </>,
    sdk: () => <>
      <D>{'// Read and write files'}</D>{'\n'}
      <K>const</K> <W>content</W> = <K>await</K> box.<F>read</F>(<S>"src/index.ts"</S>);{'\n'}
      <K>await</K> box.<F>write</F>(<S>"src/fix.ts"</S>, <S>"export const fix = () ={'>'} {'{}'}"</S>);{'\n\n'}
      <D>{'// Code search with ripgrep'}</D>{'\n'}
      <K>for await</K> (<K>const</K> <W>match</W> <K>of</K> box.<F>search</F>(<S>"TODO:"</S>, {'{'}{'\n'}
      {'  '}glob: <S>"**/*.ts"</S>{'\n'}
      {'}'})) {'{'}{'\n'}
      {'  '}console.log(<S>{"`${match.path}:${match.line}`"}</S>);{'\n'}
      {'}'}{'\n\n'}
      <D>{'// Git operations'}</D>{'\n'}
      <K>const</K> <W>status</W> = <K>await</K> box.git.<F>status</F>();{'\n'}
      <K>if</K> (status.isDirty) {'{'}{'\n'}
      {'  '}<K>await</K> box.git.<F>add</F>([<S>"."</S>]);{'\n'}
      {'  '}<K>await</K> box.git.<F>commit</F>(<S>"Fix auth bug"</S>);{'\n'}
      {'  '}<K>await</K> box.git.<F>push</F>();{'\n'}
      {'}'}{'\n\n'}
      <D>{'// Install tools on demand'}</D>{'\n'}
      <K>await</K> box.tools.<F>install</F>(<S>"python"</S>, <S>"3.12"</S>);
    </>,
  },
  {
    key: 'stream', label: 'Streaming', icon: '⚡',
    title: 'Watch your agent think, live.',
    desc: 'Watch tool calls, text generation, and task completion events as they happen. Build responsive UIs that show agent reasoning live.',
    bullets: ['SSE event stream', 'Tool call visibility', 'Text delta streaming', 'Task completion events'],
    cli: () => <>
      <P>$</P> tangle agent task sbx_a8f3c2d1 \{'\n'}
      {'  '}<S>"Refactor this codebase to TypeScript"</S> \{'\n'}
      {'  '}<F>--stream</F>{'\n\n'}
      <D>[tool_call]</D> <W>Reading package.json...</W>{'\n'}
      <D>[tool_call]</D> <W>Installing typescript devDependency...</W>{'\n'}
      <D>[message]</D>  <W>Converting src/index.js to TypeScript...</W>{'\n'}
      <D>[tool_call]</D> <W>Writing src/index.ts...</W>{'\n'}
      <D>[tool_call]</D> <W>Running tsc --noEmit...</W>{'\n'}
      <D>[message]</D>  <W>Fixed 3 type errors in auth module.</W>{'\n'}
      <D>[tool_call]</D> <W>Running npm test...</W>{'\n'}
      <D>[result]</D>   <P>All 42 tests passing.</P>{'\n\n'}
      <P>  ✓ Task complete</P> <D>(7 turns, 52s)</D>
    </>,
    sdk: () => <>
      <D>{'// Stream task events in real-time'}</D>{'\n'}
      <K>for await</K> (<K>const</K> <W>event</W> <K>of</K> box.<F>streamTask</F>({'\n'}
      {'  '}<S>"Refactor this codebase to TypeScript"</S>{'\n'}
      )) {'{'}{'\n'}
      {'  '}<K>switch</K> (event.type) {'{'}{'\n'}
      {'    '}<K>case</K> <S>"tool_call"</S>:{'\n'}
      {'      '}console.log(<S>{"`Tool: ${event.data.name}`"}</S>);{'\n'}
      {'      '}<K>break</K>;{'\n'}
      {'    '}<K>case</K> <S>"message.part.updated"</S>:{'\n'}
      {'      '}process.stdout.write(event.data.delta);{'\n'}
      {'      '}<K>break</K>;{'\n'}
      {'    '}<K>case</K> <S>"done"</S>:{'\n'}
      {'      '}console.log(<S>"Complete!"</S>);{'\n'}
      {'  '}{'}'}{'\n'}
      {'}'}{'\n\n'}
      <D>{'// Stream a single prompt'}</D>{'\n'}
      <K>for await</K> (<K>const</K> <W>event</W> <K>of</K> box.<F>streamPrompt</F>({'\n'}
      {'  '}<S>"Explain this codebase"</S>{'\n'}
      )) {'{'}{'\n'}
      {'  '}process.stdout.write(event.data.delta ?? <S>""</S>);{'\n'}
      {'}'}
    </>,
  },
  {
    key: 'snapshot', label: 'Snapshots', icon: '📸',
    title: 'Freeze time. Resume anywhere.',
    desc: 'Save the full state of a sandbox — filesystem, installed packages, running processes. Restore instantly or bring your own S3-compatible storage.',
    bullets: ['Full state checkpoint', 'Instant restore from snapshot', 'BYOS3: AWS S3, GCS, Cloudflare R2', 'Tag snapshots for organization'],
    cli: () => <>
      <P>$</P> tangle sandbox snapshot sbx_a8f3c2d1 \{'\n'}
      {'  '}<F>--name</F> <S>"pre-deploy"</S>{'\n\n'}
      <P>  ✓ Snapshot saved</P> <D>snap_7f3a2c  ·  2.1 GB  ·  0.8s</D>{'\n\n'}
      <D>{'# Later: restore from snapshot'}</D>{'\n'}
      <P>$</P> tangle sandbox create \{'\n'}
      {'  '}<F>--from-snapshot</F> <S>snap_7f3a2c</S>{'\n\n'}
      <P>  ✓ Sandbox restored</P> <D>sbx_b2c4d6  ·  1.2s</D>{'\n\n'}
      <D>{'# List snapshots'}</D>{'\n'}
      <P>$</P> tangle sandbox snapshots sbx_a8f3c2d1{'\n'}
      <D>  ID             NAME          SIZE     AGE</D>{'\n'}
      <W>  snap_7f3a2c    pre-deploy    2.1 GB   2m</W>{'\n'}
      <W>  snap_a1b2c3    stable        1.8 GB   1h</W>
    </>,
    sdk: () => <>
      <D>{'// Create a snapshot'}</D>{'\n'}
      <K>const</K> <W>snapshot</W> = <K>await</K> box.<F>snapshot</F>({'{'}{'\n'}
      {'  '}tags: [<S>"pre-deploy"</S>, <S>"stable"</S>],{'\n'}
      {'}'});{'\n'}
      console.log(snapshot.snapshotId); <D>{'// "snap_7f3a2c"'}</D>{'\n'}
      console.log(snapshot.sizeBytes);  <D>{'// 2147483648'}</D>{'\n\n'}
      <D>{'// Restore from snapshot'}</D>{'\n'}
      <K>const</K> <W>restored</W> = <K>await</K> client.<F>create</F>({'{'}{'\n'}
      {'  '}fromSnapshot: snapshot.snapshotId,{'\n'}
      {'}'});{'\n\n'}
      <D>{'// BYOS3: use your own storage'}</D>{'\n'}
      <K>const</K> <W>box</W> = <K>await</K> client.<F>create</F>({'{'}{'\n'}
      {'  '}storage: {'{'}{'\n'}
      {'    '}type: <S>"s3"</S>,{'\n'}
      {'    '}bucket: <S>"my-snapshots"</S>,{'\n'}
      {'    '}region: <S>"us-east-1"</S>,{'\n'}
      {'    '}credentials: {'{'}{'\n'}
      {'      '}accessKeyId: <S>"AKIA..."</S>,{'\n'}
      {'      '}secretAccessKey: <S>"..."</S>,{'\n'}
      {'    '}{'},'}{'\n'}
      {'  '}{'},'}{'\n'}
      {'}'});
    </>,
  },
];

export default function SandboxShowcase() {
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
          <h3 style={{ fontFamily: sat, fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.25, marginBottom: 12 }}>
            {current.title}
          </h3>
          <p style={{ fontFamily: sat, fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 16 }}>
            {current.desc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {current.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#6172f3', fontSize: 11, lineHeight: '18px', flexShrink: 0, fontFamily: mono }}>{'\u2192'}</span>
                <span style={{ fontFamily: sat, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: '22px' }}>{b}</span>
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
            {mode === 'cli' ? 'tangle sandbox' : '@tangle-network/sandbox'}
          </span>
        </div>

        {/* Code */}
        <pre style={{
          padding: '20px 24px',
          fontFamily: mono,
          fontSize: 13.5,
          lineHeight: 1.75,
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
