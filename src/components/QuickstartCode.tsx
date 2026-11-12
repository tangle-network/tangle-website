import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@tangle-network/ui/primitives';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  const source = useRef<HTMLElement>(null);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    if (!idea.run || !source.current) return;
    const index = idea.code.split('\n').findIndex((line) => /\bawait (?:box|fleet)\.(?:prompt|run|exec|runCode)\(/.test(line));
    const row = source.current.querySelectorAll<HTMLElement>('pre > code > span')[index];
    const pre = source.current.querySelector('pre');
    if (row && pre) source.current.scrollTop += row.getBoundingClientRect().top - source.current.getBoundingClientRect().top - parseFloat(getComputedStyle(pre).paddingTop);
  }, [idea]);
  return <div className="qs-main">
    <div className="qs-actions">
      <span className="qs-file">{idea.id}.mts</span>
      <CopyButton text={idea.code} aria-label="Copy file" />
      {idea.run && <Button size="sm" title="Play example" aria-expanded={runKey > 0} aria-controls={`${uid}-result`} onClick={() => setRunKey((key) => key + 1)}>{runKey ? 'Run again' : 'Run'}</Button>}
    </div>
    <section className="qs-code" ref={source} aria-label={`${idea.id}.mts source`}>
      <CodeBlock code={idea.code} language="ts" label="" showLineNumbers className="rounded-none border-0" />
    </section>
    <div id={`${uid}-result`}>{runKey > 0 && idea.run && <ExampleResult key={runKey} meta={idea.run} />}</div>
  </div>;
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
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
  const chooseSubject = (id: string) => {
    const subject = subjects.find((item) => item.id === id);
    if (subject && subject.id !== task.subject.id && subject.ideas[0]) choose(`${subject.id}/${subject.ideas[0].id}`);
  };
  return <Tabs className="qs-editor" ref={root} value={task.subject.id} onValueChange={chooseSubject}>
    <TabsList className="qs-cols" variant="underline" aria-label="Subjects">
      {subjects.map((subject) => <TabsTrigger key={subject.id} value={subject.id} variant="underline">{subject.label}</TabsTrigger>)}
    </TabsList>
    {subjects.map((subject) => <TabsContent key={subject.id} value={subject.id} className="qs-body">
      <nav className="qs-rows" aria-label={`${subject.label} examples`}>
        {subject.ideas.map((idea) => <Button key={idea.id} size="sm" variant="ghost" aria-pressed={idea === task.idea} onClick={() => choose(`${subject.id}/${idea.id}`)}>{idea.title}</Button>)}
      </nav>
      {subject === task.subject && <Workspace key={task.key} idea={task.idea} />}
    </TabsContent>)}
  </Tabs>;
}
