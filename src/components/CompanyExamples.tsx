import { ExampleEditor, type ExampleSubject } from '@tangle-network/ui/marketing';
import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@tangle-network/ui/primitives';
import { Fragment, useEffect, useState } from 'react';
import './company-examples.css';

interface Props { subjects: ExampleSubject[]; initial: string }

function Picker({ label, value, options, choose }: {
  label: string; value: string; options: { id: string; label: string; group?: string }[]; choose: (value: string) => void;
}) {
  const groups = [...new Set(options.map(item => item.group))];
  return <div>
    <Select value={value} onValueChange={choose}>
      <SelectTrigger size="touch" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{groups.map(group => <SelectGroup key={group ?? 'options'}>
        {group && <SelectLabel>{group}</SelectLabel>}
        {options.filter(item => item.group === group).map(item =>
          <SelectItem className="ce-option" value={item.id} key={item.id}>{item.label}</SelectItem>)}
      </SelectGroup>)}</SelectContent>
    </Select>
  </div>;
}

export default function CompanyExamples({ subjects, initial }: Props) {
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [topic, file] = selection.split('/');
  const subject = subjects.find(item => item.id === topic) ?? subjects[0];
  const idea = subject.ideas.find(item => item.id === file) ?? subject.ideas[0];
  const initialFile = subject.ideas.find(item => `${subject.id}/${item.id}` === initial);
  const ordered = initialFile ? [initialFile, ...subject.ideas.filter(item => item !== initialFile)] : subject.ideas;
  const hasGuides = ordered.some(item => !item.run);
  const ideas = hasGuides ? [...ordered.filter(item => item.run), ...ordered.filter(item => !item.run)] : ordered;
  const groupFor = (item: typeof idea) => item.run ? 'Recorded runs' : 'SDK examples';
  // Keep a directly linked example in the short list, including when it belongs farther down.
  const shortlist = ideas.slice(0, 5);
  if (!shortlist.includes(idea)) shortlist[shortlist.length - 1] = idea;
  const files = expanded ? ideas : shortlist;

  useEffect(() => {
    const read = () => {
      const value = new URL(window.location.href).searchParams.get('example');
      const valid = subjects.some(s => s.ideas.some(i => `${s.id}/${i.id}` === value));
      setSelection(valid && value ? value : initial);
      setExpanded(false);
    };
    read();
    setReady(true);
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [initial, subjects]);

  function choose(key: string) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('example') === key) return;
    url.searchParams.set('example', key);
    window.history.pushState(window.history.state, '', url);
    setSelection(key);
  }
  function chooseSubject(id: string) {
    const next = subjects.find(item => item.id === id);
    if (!next) return;
    setExpanded(false);
    choose(initial.startsWith(id + '/') ? initial : `${id}/${next.ideas[0].id}`);
  }
  return <fieldset className="company-examples" aria-label="Code examples" aria-busy={!ready} disabled={!ready}>
    <nav className="ce-topics" aria-label="Example topics">
      {subjects.map(item => <Button variant="ghost" size="sm" type="button" key={item.id} aria-pressed={item.id === subject.id} onClick={() => chooseSubject(item.id)}>{item.label}</Button>)}
    </nav>
    <div className="ce-pickers">
      <Picker label="Topic" value={subject.id} options={subjects} choose={chooseSubject} />
      <Picker label="Example" value={idea.id} options={ideas.map(item => ({ id: item.id, label: item.title, group: hasGuides ? groupFor(item) : undefined }))}
        choose={id => choose(`${subject.id}/${id}`)} />
    </div>
    <div className="ce-workbench">
      <nav className="ce-files" aria-label={`${subject.label} examples`}>
        {files.map((item, index) => <Fragment key={item.id}>
          {hasGuides && (!index || groupFor(files[index - 1]) !== groupFor(item)) &&
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
        {ideas.length > shortlist.length && <Button className="ce-more" variant="ghost" size="sm" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show ${ideas.length - shortlist.length} more`}
        </Button>}
      </nav>
      <ExampleEditor showReceipt={false} key={selection} subjects={[{ ...subject, ideas: [idea] }]} initial={selection} />
    </div>
  </fieldset>;
}
