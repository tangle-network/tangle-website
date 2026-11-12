import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import RunReplay, { type RunMeta } from './RunReplay';
import './quickstart-code.css';

export interface Idea { id: string; title: string; code: string; run?: RunMeta; install?: string }
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }

// Columns are subjects, rows are ideas. Every cell is one whole file from src/examples, so what a
// reader copies is what `pnpm check:examples` compiled. TypeScript only: the Python SDK is not published.
function rove(count: number, current: number, pick: (index: number) => void, keys: string[]) {
  return (event: KeyboardEvent) => {
    if (![...keys, 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    pick(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (current + (/Left|Up/.test(event.key) ? -1 : 1) + count) % count);
  };
}

export const Install = ({ command, label }: { command: string; label: string }) => (
  <div className="qs-install" role="group" aria-label={label}><code><span aria-hidden="true">$ </span>{command}</code><CopyButton key={command} text={command} aria-label="Copy command" /></div>
);

function Tab({ id, panel, selected, onSelect, children }: { id: string; panel: string; selected: boolean; onSelect: () => void; children: ReactNode }) {
  return <button id={id} type="button" role="tab" aria-selected={selected} aria-controls={panel} tabIndex={selected ? 0 : -1} onClick={onSelect}>{children}</button>;
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
  const uid = useId();
  const [col, setCol] = useState(0);
  const [rows, setRows] = useState(() => subjects.map(() => 0));
  const subject = subjects[col];
  const row = rows[col];
  const idea = subject.ideas[row];
  const cell = `${subject.id}-${idea.id}`;
  const run = `${idea.install ?? subject.install} && ${[...new Set(Array.from(idea.code.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)\b(?!\s*\?\?)/g), ([, name]) => name))].map((name) => `${name}=<${name.slice(name.lastIndexOf('_') + 1).toLowerCase()}>`).join(' ')} npx tsx ${idea.id}.mts`;

  const pickCol = (next: number) => { setCol(next); document.getElementById(`${uid}-col-${subjects[next].id}`)?.focus(); };
  const setRow = (next: number) => setRows(rows.map((value, index) => (index === col ? next : value)));
  const pickRow = (next: number) => { setRow(next); document.getElementById(`${uid}-row-${subject.id}-${subject.ideas[next].id}`)?.focus(); };

  return (
    <div className="qs-editor">
      <div className="qs-cols" role="tablist" aria-label="Subjects" onKeyDown={rove(subjects.length, col, pickCol, ['ArrowLeft', 'ArrowRight'])}>
        {subjects.map((item, index) => (
          <Tab key={item.id} id={`${uid}-col-${item.id}`} panel={`${uid}-panel`} selected={index === col} onSelect={() => setCol(index)}>{item.label}</Tab>
        ))}
      </div>
      <div className="qs-body">
        <div key={subject.id} className="qs-rows" role="tablist" aria-orientation="vertical" aria-label={`${subject.label} examples`}
          onKeyDown={rove(subject.ideas.length, row, pickRow, ['ArrowUp', 'ArrowDown'])}>
          {subject.ideas.map((item, index) => (
            <Tab key={item.id} id={`${uid}-row-${subject.id}-${item.id}`} panel={`${uid}-panel`} selected={index === row} onSelect={() => setRow(index)}>{item.title}</Tab>
          ))}
        </div>
        <div className="qs-main" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-row-${cell}`}>
          <div className="qs-actions">
            <select className="qs-pick" aria-label={`${subject.label} example`} value={row} onChange={(event) => setRow(Number(event.target.value))}>
              {subject.ideas.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}
            </select>
            <span className="qs-filename">{idea.id}.mts</span>
            <CopyButton key={cell} text={idea.code} aria-label="Copy file" />
          </div>
          <div className="qs-stage" data-recorded={!!idea.run}>
            <section className="qs-code" aria-label={`${idea.id}.mts source`} tabIndex={0}>
              <CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="qs-code-block rounded-none border-0" />
            </section>
            {idea.run && <RunReplay key={cell} meta={idea.run} />}
          </div>
          <Install command={run} label="Install and run" />
        </div>
      </div>
    </div>
  );
}
