import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button } from '@tangle-network/ui/primitives';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ExampleResult from './ExampleResult';
import type { RunMeta } from './RunReplay';
import './quickstart-code.css';

export interface Idea { id: string; title: string; code: string; run?: RunMeta; install?: string }
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }

export const Install = ({ command, label }: { command: string; label: string }) => (
  <div className="qs-install" role="group" aria-label={label}><code><span aria-hidden="true">$ </span>{command}</code><CopyButton key={command} text={command} aria-label="Copy command" /></div>
);

function Workspace({ idea }: { idea: Idea }) {
  const uid = useId();
  const [runKey, setRunKey] = useState(0);
  return <div className="qs-main">
    <div className="qs-actions">
      <span className="qs-file">{idea.id}.mts</span>
      <CopyButton text={idea.code} aria-label="Copy file" />
      {idea.run && <Button size="sm" title="Play example" aria-expanded={runKey > 0} aria-controls={`${uid}-result`} onClick={() => setRunKey((key) => key + 1)}>{runKey ? 'Run again' : 'Run'}</Button>}
    </div>
    <section className="qs-code" aria-label={`${idea.id}.mts source`}>
      <CodeBlock code={idea.code} language="ts" label="" showLineNumbers className="rounded-none border-0" />
    </section>
    <div id={`${uid}-result`}>{runKey > 0 && idea.run && <ExampleResult key={runKey} meta={idea.run} />}</div>
  </div>;
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const [picked, setPicked] = useState('sandboxes/fix-a-test');
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('[aria-selected="true"], [aria-pressed="true"]').forEach((item) => {
      const parent = item.parentElement;
      if (!parent || parent.scrollWidth <= parent.clientWidth) return;
      const box = parent.getBoundingClientRect(), tab = item.getBoundingClientRect();
      parent.scrollLeft += tab.left < box.left ? tab.left - box.left : Math.max(0, tab.right - box.right);
    });
  }, [picked]);
  useEffect(() => {
    const read = () => { const value = new URL(window.location.href).searchParams.get('example'); setPicked(tasks.some((task) => task.key === value) ? value! : 'sandboxes/fix-a-test'); };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [tasks]);
  const task = tasks.find((item) => item.key === picked) ?? tasks[0];
  if (!task) return null;
  const choose = (value: string) => {
    setPicked(value);
    const url = new URL(window.location.href); url.searchParams.set('example', value);
    window.history.replaceState(window.history.state, '', url);
  };
  const chooseSubject = (index: number) => {
    const subject = subjects[index];
    if (subject.id !== task.subject.id && subject.ideas[0]) choose(`${subject.id}/${subject.ideas[0].id}`);
  };
  const moveSubject = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = subjects.indexOf(task.subject);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? subjects.length - 1 : (current + (event.key === 'ArrowLeft' ? -1 : 1) + subjects.length) % subjects.length;
    chooseSubject(next); document.getElementById(`${uid}-subject-${subjects[next].id}`)?.focus();
  };
  return <div className="qs-editor" ref={root}>
    <div className="qs-cols" role="tablist" aria-label="Subjects" onKeyDown={moveSubject}>
      {subjects.map((subject, index) => <button key={subject.id} id={`${uid}-subject-${subject.id}`} type="button" role="tab" aria-selected={subject === task.subject} aria-controls={`${uid}-panel`} tabIndex={subject === task.subject ? 0 : -1} onClick={() => chooseSubject(index)}>{subject.label}</button>)}
    </div>
    <div className="qs-body" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-subject-${task.subject.id}`}>
      <nav className="qs-rows" aria-label={`${task.subject.label} examples`}>
        {task.subject.ideas.map((idea) => <button key={idea.id} type="button" aria-pressed={idea === task.idea} onClick={() => choose(`${task.subject.id}/${idea.id}`)}>{idea.title}</button>)}
      </nav>
      <Workspace key={task.key} idea={task.idea} />
    </div>
  </div>;
}
