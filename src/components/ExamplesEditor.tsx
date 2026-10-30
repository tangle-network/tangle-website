import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { homeExamples, type Example } from '../data/examples';
import { exampleOutputs } from '../data/exampleOutputs';
import './examples-editor.css';

const OUTPUT_STATE = 'tangle.examples.output';
const links = [
  { label: 'SDK reference', href: 'https://docs.tangle.tools/sandbox/sdk-reference' },
  { label: 'CLI', href: 'https://www.npmjs.com/package/@tangle-network/sandbox-cli' },
  { label: 'Benchmarks', href: '/benchmarks' },
];
const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function storedOpen() {
  try { return localStorage.getItem(OUTPUT_STATE) !== 'collapsed'; } catch { return true; }
}

function storeOpen(open: boolean) {
  try { localStorage.setItem(OUTPUT_STATE, open ? 'open' : 'collapsed'); } catch { /* private window */ }
}

export default function ExamplesEditor() {
  const [selected, setSelected] = useState<Example>(homeExamples[0]);
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(storedOpen()), []);
  const output = exampleOutputs.find((item) => item.id === selected.id);

  const select = (item: Example) => {
    setSelected(item);
    document.getElementById(`ex-tab-${item.id}`)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    select(homeExamples[(homeExamples.indexOf(selected) + step + homeExamples.length) % homeExamples.length]);
  };
  const toggleOutput = () => {
    setOpen(!open);
    storeOpen(!open);
  };

  const header = output
    ? `RECORDED RUN · ${output.recordedAt} · ${output.sandboxOrFleetId} · ${output.durationS} s · $${output.usd.toFixed(2)}`
    : `$ npx tsx ${selected.file}`;
  const body = output ? output.lines.join('\n') : selected.cli ? `$ ${selected.cli}` : '';

  return (
    <div className="ex-editor">
      <div className="ex-rail">
        <span className="ex-rail-label">Examples</span>
        <div className="ex-tabs" role="tablist" aria-label="Examples" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {homeExamples.map((item) => (
            <button key={item.id} id={`ex-tab-${item.id}`} type="button" role="tab" aria-selected={selected.id === item.id}
              aria-controls="ex-panel" tabIndex={selected.id === item.id ? 0 : -1} onClick={() => select(item)}>
              <strong>{item.label}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </div>
        <nav className="ex-rail-links" aria-label="Sandbox references">
          {links.map((link) => (
            <a key={link.href} href={link.href} target={link.href.startsWith('/') ? undefined : '_blank'}
              rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}>
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="ex-main" id="ex-panel" role="tabpanel" aria-labelledby={`ex-tab-${selected.id}`}>
        <div className="ex-toolbar">
          <span className="ex-filename">{selected.file}</span>
          <div className="ex-copy" title="Copy file"><CopyButton key={selected.id} text={selected.code} aria-label="Copy file" /></div>
        </div>
        <section key={selected.id} className="ex-code" aria-label={`${selected.file} source`} tabIndex={0}>
          <CodeBlock code={selected.code.trimEnd()} language="ts" label="" showLineNumbers className="ex-code-block rounded-none border-0" />
        </section>
        <div className="ex-output">
          <button type="button" className="ex-output-head" aria-expanded={open} aria-controls="ex-output-body" onClick={toggleOutput}>
            <span>{header}</span>
            <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          </button>
          {open && body && <pre id="ex-output-body" className="ex-output-body">{body}</pre>}
        </div>
        <div className="ex-install" role="group" aria-label="Install command">
          <code>{selected.install}</code>
          <div className="ex-copy"><CopyButton key={selected.install} text={selected.install} aria-label="Copy install command" /></div>
        </div>
      </div>
    </div>
  );
}
