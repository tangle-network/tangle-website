import { ExampleEditor, type ExampleSubject } from '@tangle-network/ui/marketing';
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@tangle-network/ui/primitives';
import { Fragment, useEffect, useState } from 'react';
import './company-examples.css';

interface Props { subjects: ExampleSubject[]; initial: string }

function Picker({ label, value, options, choose }: {
  label: string; value: string; options: { id: string; label: string; group?: string }[]; choose: (value: string) => void;
}) {
  const groups = [...new Set(options.map(item => item.group))];
  const current = options.find(item => item.id === value);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" aria-label={`${label}, ${current?.label}`}>
      <span>{current?.label}</span><span aria-hidden="true">▾</span>
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="ce-menu" aria-label={label}>
      <DropdownMenuRadioGroup value={value}>{groups.map(group => <Fragment key={group ?? 'options'}>
        {group && <DropdownMenuLabel>{group}</DropdownMenuLabel>}
        {options.filter(item => item.group === group).map(item =>
          <DropdownMenuRadioItem className="ce-option" value={item.id} key={item.id} onSelect={() => choose(item.id)}>{item.label}</DropdownMenuRadioItem>)}
      </Fragment>)}</DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export default function CompanyExamples({ subjects, initial }: Props) {
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState(initial);
  const [interaction, setInteraction] = useState(0);
  const [topic, file] = selection.split('/');
  const subject = subjects.find(item => item.id === topic) ?? subjects[0];
  const idea = subject.ideas.find(item => item.id === file) ?? subject.ideas[0];
  const initialFile = subject.ideas.find(item => `${subject.id}/${item.id}` === initial);
  const ordered = initialFile ? [initialFile, ...subject.ideas.filter(item => item !== initialFile)] : subject.ideas;
  const groupFor = (item: typeof idea) => {
    if (subject.id === 'products') return item.id === 'email-assistant' ? 'Agent App SDK' : 'Sandbox app patterns';
    if (subject.id === 'router') return item.run ? 'Recorded runs' : 'API examples';
    if (subject.id === 'runtime') return item.run ? 'Recorded runs' : 'SDK examples';
    if (subject.id !== 'sandboxes') return undefined;
    if (['stop-and-resume', 'branch-into-two', 'snapshot-and-revert'].includes(item.id)) return 'Machine lifecycle';
    if (['run-code', 'python-csv', 'host-a-page', 'worker'].includes(item.id)) return 'Commands and services';
    return 'Coding agents';
  };
  const groups = subject.id === 'products' ? ['Agent App SDK', 'Sandbox app patterns'] : [...new Set(ordered.map(groupFor))];
  const files = groups.flatMap(group => ordered.filter(item => groupFor(item) === group));

  useEffect(() => {
    const read = () => {
      const value = new URL(window.location.href).searchParams.get('example');
      const valid = subjects.some(s => s.ideas.some(i => `${s.id}/${i.id}` === value));
      setSelection(valid && value ? value : initial);
      setInteraction(0);
    };
    read();
    setReady(true);
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [initial, subjects]);

  function choose(key: string) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('example') !== key) {
      url.searchParams.set('example', key);
      window.history.pushState(window.history.state, '', url);
    }
    setInteraction(count => count + 1);
    setSelection(key);
  }
  function chooseSubject(id: string) {
    const next = subjects.find(item => item.id === id);
    if (!next) return;
    choose(initial.startsWith(id + '/') ? initial : `${id}/${next.ideas[0].id}`);
  }
  return <fieldset className="company-examples" aria-label="Code examples" aria-busy={!ready} disabled={!ready}>
    <nav className="ce-topics" aria-label="Example topics">
      {subjects.map(item => <Button variant="ghost" size="sm" type="button" key={item.id} aria-pressed={item.id === subject.id} onClick={() => chooseSubject(item.id)}>{item.label}</Button>)}
    </nav>
    <div className="ce-pickers">
      <Picker label="Topic" value={subject.id} options={subjects} choose={chooseSubject} />
      <Picker label="Example" value={idea.id} options={files.map(item => ({ id: item.id, label: item.title, group: groupFor(item) }))}
        choose={id => choose(`${subject.id}/${id}`)} />
    </div>
    <div className="ce-workbench dark" data-theme="website">
      <nav className="ce-files" aria-label={`${subject.label} examples`}>
        {files.map((item, index) => <Fragment key={item.id}>
          {groupFor(item) && (!index || groupFor(files[index - 1]) !== groupFor(item)) &&
            <span className="ce-file-group">{groupFor(item)}</span>}
          <Button variant="ghost" size="sm" type="button" aria-pressed={item.id === idea.id}
          onKeyDown={event => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            const next = files[(index + (event.key === 'ArrowDown' ? 1 : -1) + files.length) % files.length];
            choose(`${subject.id}/${next.id}`);
            event.currentTarget.closest('nav')?.querySelector<HTMLButtonElement>(`[data-file="${next.id}"]`)?.focus();
          }}
          data-file={item.id} onClick={() => choose(`${subject.id}/${item.id}`)}>{item.title}</Button>
        </Fragment>)}
      </nav>
      <ExampleEditor key={`${selection}:${interaction}`} playOnSelect={interaction > 0}
        showReceipt={false} subjects={[{ ...subject, ideas: [idea] }]} initial={selection} />
    </div>
  </fieldset>;
}
