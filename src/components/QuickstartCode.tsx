import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { useState } from 'react';
import { quickstartExamples, quickstartLanguages } from '../data/sandboxQuickstart';
import './quickstart-code.css';

// Adapted from products/sandbox/web/src/pages/Landing.tsx's CodeWindow.
export default function QuickstartCode() {
  const [selected, setSelected] = useState(quickstartExamples[0]);
  const [language, setLanguage] = useState<(typeof quickstartLanguages)[number]>(quickstartLanguages[0]);
  const code = selected[language.id];

  return (
    <div className="quickstart-editor" data-theme="light">
      <nav className="quickstart-scenarios" aria-label="Code examples">
        {quickstartExamples.map((example) => (
          <button key={example.id} type="button" aria-pressed={selected.id === example.id}
            onClick={() => setSelected(example)}>{example.label}</button>
        ))}
      </nav>
      <div className="quickstart-editor-main">
        <div className="quickstart-toolbar">
          <span className="quickstart-filename">{selected.id}.{language.id === 'python' ? 'py' : 'ts'}</span>
          <select className="quickstart-mobile-scenario" aria-label="Code example" value={selected.id}
            onChange={(event) => {
              const example = quickstartExamples.find((item) => item.id === event.target.value);
              if (example) setSelected(example);
            }}>
            {quickstartExamples.map((example) => <option key={example.id} value={example.id}>{example.label}</option>)}
          </select>
          <div className="quickstart-toolbar-actions">
            <div className="quickstart-languages" role="group" aria-label="Code language">
              {quickstartLanguages.map((item) => (
                <button key={item.id} type="button" aria-label={item.label} aria-pressed={language.id === item.id}
                  onClick={() => setLanguage(item)}>
                  <span className="language-full">{item.label}</span>
                  <span className="language-short" aria-hidden="true">{item.id === 'typescript' ? 'TS' : item.label}</span>
                </button>
              ))}
            </div>
            <div className="quickstart-copy-control" role="group" aria-label="Copy full example" title="Copy full example with setup">
              <CopyButton key={`${selected.id}-${language.id}`} text={code.fullCode} />
            </div>
          </div>
        </div>
        <section key={`${selected.id}-${language.id}`} className="quickstart-source" aria-label={`${selected.label} in ${language.label}`} tabIndex={0}>
          <CodeBlock code={code.snippet} language={language.id} label="" showLineNumbers className="quickstart-shared-code rounded-none border-0" />
        </section>
        <div className="quickstart-install" role="group" aria-label="Install command">
          <code>{language.install}</code>
          <div className="quickstart-copy-control"><CopyButton key={language.id} text={language.install} /></div>
        </div>
      </div>
    </div>
  );
}
