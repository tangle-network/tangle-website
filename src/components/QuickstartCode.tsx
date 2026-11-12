import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button, SegmentedControl, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@tangle-network/ui/primitives';
import { useEffect, useId, useMemo, useState } from 'react';
import ExampleResult from './ExampleResult';
import type { RunMeta } from './RunReplay';
import './quickstart-code.css';

export interface Idea { id: string; title: string; code: string; run?: RunMeta; install?: string }
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }

export const Install = ({ command, label }: { command: string; label: string }) => (
  <div className="qs-install" role="group" aria-label={label}><code><span aria-hidden="true">$ </span>{command}</code><CopyButton key={command} text={command} label="Copy command" /></div>
);

function Workspace({ subject, idea }: { subject: Subject; idea: Idea }) {
  const [pane, setPane] = useState(idea.run ? 'result' : 'code');
  const [wrap, setWrap] = useState(false);
  const env = [...new Set(Array.from(idea.code.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)\b(?!\s*\?\?)/g), ([, name]) => name))];
  const command = `${idea.install ?? subject.install} && ${env.map((name) => `${name}=<${name.slice(name.lastIndexOf('_') + 1).toLowerCase()}>`).join(' ')} npx tsx ${idea.id}.mts`;
  return <div className={`qs-workspace${wrap ? ' qs-wrap' : ''}`} data-pane={pane} data-recorded={!!idea.run}>
    {idea.run && <div className="qs-phone-panes"><SegmentedControl aria-label="View" value={pane} onValueChange={setPane} options={[{ value: 'code', label: 'Code' }, { value: 'result', label: 'Recorded result' }]} /></div>}
    <div className="qs-columns">
      <section className="qs-source" aria-label="Complete example source">
        <div className="qs-file-tools"><span>{idea.id}.mts</span><Button size="lg" variant="outline" aria-pressed={wrap} onClick={() => setWrap(!wrap)}>Wrap lines</Button><CopyButton text={idea.code} label="Copy file" /></div>
        <div className="qs-code" tabIndex={0}><CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="rounded-none border-0" /></div>
        {!idea.run && <p className="qs-unrecorded">Run this file with your own key. No recorded result is available.</p>}
      </section>
      {idea.run && <ExampleResult key={idea.run.url} meta={idea.run} />}
    </div>
    <Install command={command} label="Install and run" />
  </div>;
}

export default function QuickstartCode({ subjects }: { subjects: Subject[] }) {
  const uid = useId();
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const [picked, setPicked] = useState('sandboxes/fix-a-test');
  useEffect(() => {
    const read = () => { const value = new URL(window.location.href).searchParams.get('example'); if (tasks.some((task) => task.key === value)) setPicked(value!); };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [tasks]);
  const task = tasks.find((item) => item.key === picked) ?? tasks[0];
  const choose = (value: string) => {
    setPicked(value);
    const url = new URL(window.location.href); url.searchParams.set('example', value);
    window.history.replaceState(window.history.state, '', url);
  };
  if (!task) return null;
  return <div className="qs-editor">
    <div className="qs-task-picker"><label id={`${uid}-task`} htmlFor={`${uid}-select`}>Choose a task</label>
      <Select value={task.key} onValueChange={choose}><SelectTrigger id={`${uid}-select`} size="lg" aria-labelledby={`${uid}-task`}><SelectValue /></SelectTrigger>
        <SelectContent>{subjects.map((subject) => <SelectGroup key={subject.id}><SelectLabel>{subject.label}</SelectLabel>{subject.ideas.map((idea) => <SelectItem key={idea.id} value={`${subject.id}/${idea.id}`}>{idea.title}</SelectItem>)}</SelectGroup>)}</SelectContent>
      </Select>
    </div>
    <Workspace key={task.key} subject={task.subject} idea={task.idea} />
  </div>;
}
