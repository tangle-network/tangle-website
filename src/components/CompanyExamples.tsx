import { ExampleEditor, type ExampleSubject } from '@tangle-network/ui/marketing';
import { useEffect, useState } from 'react';
import './company-examples.css';

interface Props { subjects: ExampleSubject[]; initial: string }

export default function CompanyExamples({ subjects, initial }: Props) {
  const [selection, setSelection] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [topic, file] = selection.split('/');
  const subject = subjects.find(item => item.id === topic) ?? subjects[0];
  const idea = subject.ideas.find(item => item.id === file) ?? subject.ideas[0];
  const initialFile = subject.ideas.find(item => `${subject.id}/${item.id}` === initial);
  const ideas = initialFile ? [initialFile, ...subject.ideas.filter(item => item !== initialFile)] : subject.ideas;
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
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [initial, subjects]);

  function choose(key: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('example', key);
    window.history.replaceState(window.history.state, '', url);
    setSelection(key);
  }
  function chooseSubject(id: string) {
    const next = subjects.find(item => item.id === id);
    if (!next) return;
    setExpanded(false);
    choose(initial.startsWith(id + '/') ? initial : `${id}/${next.ideas[0].id}`);
  }
  const filename = `${idea.id}.mts`;
  return <div className="company-examples">
    <nav className="ce-topics" aria-label="Example topics">
      {subjects.map(item => <button type="button" key={item.id} aria-pressed={item.id === subject.id} onClick={() => chooseSubject(item.id)}>{item.label}</button>)}
    </nav>
    <div className="ce-pickers">
      <label>Topic<select value={subject.id} onChange={event => chooseSubject(event.target.value)}>
        {subjects.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
      </select></label>
      <label>Example<select value={idea.id} onChange={event => choose(`${subject.id}/${event.target.value}`)}>
        {ideas.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>
    </div>
    <div className="ce-workbench">
      <nav className="ce-files" aria-label={`${subject.label} examples`}>
        {files.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === idea.id}
          onKeyDown={event => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            const next = files[(index + (event.key === 'ArrowDown' ? 1 : -1) + files.length) % files.length];
            choose(`${subject.id}/${next.id}`);
            event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-file="${next.id}"]`)?.focus();
          }}
          data-file={item.id} onClick={() => choose(`${subject.id}/${item.id}`)}>{item.title}
          {item.id === idea.id && <code aria-hidden="true">{filename}</code>}
        </button>)}
        {ideas.length > shortlist.length && <button className="ce-more" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show ${ideas.length - shortlist.length} more`}
        </button>}
      </nav>
      <ExampleEditor key={selection} subjects={[{ ...subject, ideas: [idea] }]} initial={selection} />
    </div>
  </div>;
}
