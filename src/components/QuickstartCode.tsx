import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button } from '@tangle-network/ui/primitives';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import RunReplay, { type RunMeta } from './RunReplay';
import './quickstart-code.css';

export interface Idea { id: string; title: string; summary: string; code: string; run?: RunMeta }
export interface Subject { id: string; label: string; install: string; ideas: Idea[]; dir?: string } // dir: the examples folder, when it is not the id

// Columns are subjects, rows are ideas; subjects with one idea each are a switcher, the summary under the tabs.
// Every cell is one whole file from src/examples, so what a reader copies is what `pnpm check:examples` compiled.
// TypeScript only: the Python SDK is not published.
function rove(count: number, current: number, pick: (index: number) => void, keys: string[]) {
  return (event: KeyboardEvent) => {
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    pick((current + (/Left|Up/.test(event.key) ? -1 : 1) + count) % count);
  };
}

function Tab({ id, panel, selected, onSelect, children }: { id: string; panel: string; selected: boolean; onSelect: () => void; children: ReactNode }) {
  return <button id={id} type="button" role="tab" aria-selected={selected} aria-controls={panel} tabIndex={selected ? 0 : -1} onClick={onSelect}>{children}</button>;
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
  const uid = useId(); // ids stay unique when the page holds more than one editor
  const [col, setCol] = useState(0);
  const [rows, setRows] = useState(() => subjects.map(() => 0));
  const [replay, setReplay] = useState<string | null>(null);
  const subject = subjects[col];
  const row = rows[col];
  const idea = subject.ideas[row];
  const cell = `${subject.id}-${idea.id}`;
  const run = `${subject.install} && npx tsx ${idea.id}.mts`;
  const playing = replay === cell && idea.run;
  const switcher = subjects.every((item) => item.ideas.length === 1); // one file per tab: no list

  const pickCol = (next: number) => { setCol(next); document.getElementById(`qs-col-${subjects[next].id}`)?.focus(); };
  const setRow = (next: number) => setRows(rows.map((value, index) => (index === col ? next : value)));
  const pickRow = (next: number) => { setRow(next); document.getElementById(`qs-row-${subject.id}-${subject.ideas[next].id}`)?.focus(); };

  return (
    <div className={`qs-editor${switcher ? ' qs-switch' : ''}`}>
      <div className="qs-cols" role="tablist" aria-label={switcher ? 'Clouds' : 'Subjects'} onKeyDown={rove(subjects.length, col, pickCol, ['ArrowLeft', 'ArrowRight'])}>
        {subjects.map((item, index) => (
          <Tab key={item.id} id={`qs-col-${item.id}`} panel={`${uid}-panel`} selected={index === col} onSelect={() => setCol(index)}>
            {item.label}<span className="qs-count">{item.ideas.length}</span>
          </Tab>
        ))}
      </div>
      {switcher && <p className="qs-note" id={`${uid}-note`}>{idea.summary}</p>}
      <div className="qs-body">
        <div className="qs-side">
          <div key={subject.id} className="qs-rows" role="tablist" aria-orientation="vertical" aria-label={`${subject.label} examples`}
            onKeyDown={rove(subject.ideas.length, row, pickRow, ['ArrowUp', 'ArrowDown'])}>
            {subject.ideas.map((item, index) => (
              <Tab key={item.id} id={`qs-row-${subject.id}-${item.id}`} panel={`${uid}-panel`} selected={index === row} onSelect={() => setRow(index)}>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </Tab>
            ))}
          </div>
          <p className="qs-key">Each file reads <code>TANGLE_API_KEY</code>. <a href="https://id.tangle.tools">Create a key <span className="ic ic-out" aria-hidden="true" /></a></p>
        </div>
        <div className={`qs-main${playing ? ' is-replaying' : ''}`} id={`${uid}-panel`} role="tabpanel" aria-labelledby={switcher ? `qs-col-${subject.id}` : `qs-row-${cell}`} aria-describedby={switcher ? `${uid}-note` : undefined}>
          <div className="qs-toolbar">
            <span className="qs-file">{subject.dir ?? subject.id}/<b>{idea.id}.mts</b></span>
            <select className="qs-pick" aria-label={`${subject.label} example`} value={row} onChange={(event) => setRow(Number(event.target.value))}>
              {subject.ideas.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}
            </select>
            {idea.run ? <Button id={`${uid}-play`} size="sm" variant={playing ? 'default' : 'outline'} className="qs-play" aria-expanded={!!playing} aria-controls={`${uid}-replay`}
              onClick={() => setReplay(playing ? null : cell)}>{playing ? 'Close' : <><span className="ic ic-play" aria-hidden="true" />Play</>}</Button> : <span className="qs-norun">No live run yet</span>}
            <div className="qs-copy"><CopyButton key={cell} text={idea.code} aria-label="Copy file" /></div>
          </div>
          {playing && <RunReplay key={`replay-${cell}`} id={`${uid}-replay`} meta={idea.run!} onClose={() => { setReplay(null); document.getElementById(`${uid}-play`)?.focus(); }} />}
          <section key={cell} className="qs-code" aria-label={`${idea.id}.mts source`} tabIndex={0}>
            <CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="qs-code-block rounded-none border-0" />
          </section>
          <div className="qs-install" role="group" aria-label="Install and run">
            <code><span aria-hidden="true">$ </span>{run}</code>
            <div className="qs-copy"><CopyButton key={run} text={run} aria-label="Copy command" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
