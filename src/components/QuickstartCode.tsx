import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { useState } from 'react';
import { sdkQuickstartExamples } from '../data/sandboxQuickstartExamples';
import './quickstart-code.css';

// TypeScript only: the Python SDK is not published, and an example that cannot
// be installed is worse than none. The page shows each whole file, so what a
// reader copies is what they read.
const INSTALL = 'npm install @tangle-network/sandbox';

export default function QuickstartCode() {
  const [selected, setSelected] = useState(sdkQuickstartExamples[0]);

  return (
    <div className="quickstart-editor">
      <nav className="quickstart-scenarios" aria-label="Code examples">
        {sdkQuickstartExamples.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected.id === item.id} title={item.summary}
            onClick={() => setSelected(item)}>{item.title}</button>
        ))}
      </nav>
      <div className="quickstart-editor-main">
        <div className="quickstart-toolbar">
          <span className="quickstart-filename">{selected.id}.ts</span>
          <select className="quickstart-mobile-scenario" aria-label="Code example" value={selected.id}
            onChange={(event) => {
              const next = sdkQuickstartExamples.find((item) => item.id === event.target.value);
              if (next) setSelected(next);
            }}>
            {sdkQuickstartExamples.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <div className="quickstart-copy-control" role="group" aria-label="Copy file" title="Copy file">
            <CopyButton key={selected.id} text={selected.code} />
          </div>
        </div>
        <section key={selected.id} className="quickstart-source" aria-label={`${selected.title} source`} tabIndex={0}>
          <CodeBlock code={selected.code.trimEnd()} language="ts" label="" showLineNumbers className="quickstart-shared-code rounded-none border-0" />
        </section>
        <div className="quickstart-install" role="group" aria-label="Install command">
          <code>{INSTALL}</code>
          <div className="quickstart-copy-control"><CopyButton text={INSTALL} /></div>
        </div>
      </div>
    </div>
  );
}
