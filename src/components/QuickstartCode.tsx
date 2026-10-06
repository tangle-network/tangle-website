import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { useMemo, useState } from 'react';
import {
  agentExample, agentHarnesses, defaultAgent, modelsForHarness, quickstartExamples, quickstartLanguages,
  type AgentHarness, type AgentModel,
} from '../data/sandboxQuickstart';
import './quickstart-code.css';

// Adapted from products/sandbox/web/src/pages/Landing.tsx's CodeWindow.
export default function QuickstartCode() {
  const [selected, setSelected] = useState(quickstartExamples[0]);
  const [language, setLanguage] = useState<(typeof quickstartLanguages)[number]>(quickstartLanguages[0]);
  const [harness, setHarness] = useState<AgentHarness>(defaultAgent.harness);
  const [model, setModel] = useState<AgentModel>(defaultAgent.model);
  const models = modelsForHarness(harness);
  const example = useMemo(
    () => (selected.selectsAgent ? agentExample(harness, model) : selected),
    [selected, harness, model],
  );
  const code = example[language.id];

  const chooseHarness = (next: AgentHarness) => {
    setHarness(next);
    const allowed = modelsForHarness(next);
    if (!allowed.some((item) => item.id === model)) setModel(allowed[0].id);
  };

  return (
    <div className="quickstart-editor">
      <nav className="quickstart-scenarios" aria-label="Code examples">
        {quickstartExamples.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected.id === item.id}
            onClick={() => setSelected(item)}>{item.label}</button>
        ))}
      </nav>
      <div className="quickstart-editor-main">
        <div className="quickstart-toolbar">
          <span className="quickstart-filename">{selected.id}.{language.id === 'python' ? 'py' : 'ts'}</span>
          <select className="quickstart-mobile-scenario" aria-label="Code example" value={selected.id}
            onChange={(event) => {
              const next = quickstartExamples.find((item) => item.id === event.target.value);
              if (next) setSelected(next);
            }}>
            {quickstartExamples.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
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
              <CopyButton key={`${selected.id}-${language.id}-${harness}-${model}`} text={code.fullCode} />
            </div>
          </div>
        </div>
        {selected.selectsAgent && (
          <div className="quickstart-agent" role="group" aria-label="Agent">
            <label>
              <span>Harness</span>
              <select value={harness} onChange={(event) => chooseHarness(event.target.value as AgentHarness)}>
                {agentHarnesses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Model</span>
              <select value={model} onChange={(event) => setModel(event.target.value as AgentModel)}>
                {models.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
        )}
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
