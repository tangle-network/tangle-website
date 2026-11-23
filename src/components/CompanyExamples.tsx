import { ExampleWorkbench, type ExampleSubject } from '@tangle-network/ui/marketing';
import {
  Button, DropdownMenu, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@tangle-network/ui/primitives';
import { useEffect, useState } from 'react';
import './company-examples.css';

interface Props { subjects: ExampleSubject[]; initial: string }

const introductions: Record<string, { title: string; description: string; link: string; path: string }> = {
  sandboxes: {
    title: 'Give each agent its own machine.',
    description: 'Run commands, edit files and inspect the changes alongside each step your agent took.',
    link: 'Sandbox SDK reference', path: 'sandbox/sdk-typescript',
  },
  router: {
    title: 'Choose a model for your request.',
    description: 'See which models are serving, then send a chat request through Tangle Router.',
    link: 'Router quickstart', path: 'gateway/getting-started',
  },
  evals: {
    title: 'Compare agents on the same task.',
    description: 'Score answers against a fixed set of cases to see whether a new model or prompt improves them.',
    link: 'Evaluation guide', path: 'sandbox/evaluation',
  },
  products: {
    title: 'Put an agent inside your app.',
    description: 'Connect an email assistant or give each customer a conversation that keeps its history.',
    link: 'Agent app examples', path: 'sandbox/examples/products',
  },
  fleets: {
    title: 'Run agents in parallel on one budget.',
    description: 'Split a test suite across machines, or give each agent a different package to review.',
    link: 'Fleet guide', path: 'sandbox/agents-fleet',
  },
  runtime: {
    title: 'Run the same agent on another cloud.',
    description: 'Keep the same agent and task. Choose a provider to see the setup.',
    link: 'Provider guide', path: 'sandbox/other-providers',
  },
};

function Picker({ label, value, options, choose }: {
  label: string; value: string; options: { id: string; label: string }[]; choose: (value: string) => void;
}) {
  const current = options.find(item => item.id === value);
  const [open, setOpen] = useState(false);
  return <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild
      // A touch release can land on a menu item when Radix opens the menu on pointer-down.
      onPointerDownCapture={event => { if (event.button === 0 && !event.ctrlKey) event.stopPropagation(); }}
      onClick={() => setOpen(value => !value)}><Button variant="outline" aria-label={`${label}, ${current?.label}`}>
      <span>{current?.label}</span><span aria-hidden="true">▾</span>
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" sideOffset={4} className="ce-menu" aria-label={label}>
      <DropdownMenuRadioGroup value={value}>
        {options.map(item => (
          <DropdownMenuRadioItem className="ce-option" value={item.id} key={item.id} onSelect={() => choose(item.id)}>
            {item.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export default function CompanyExamples({ subjects, initial }: Props) {
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState(initial);
  const [entry, setEntry] = useState({ revision: 0, play: false });
  const [topic] = selection.split('/');
  const subject = subjects.find(item => item.id === topic) ?? subjects[0];
  const intro = introductions[subject.id];
  useEffect(() => {
    const read = () => {
      const value = new URL(window.location.href).searchParams.get('example');
      const valid = subjects.some(s => s.ideas.some(i => `${s.id}/${i.id}` === value));
      setSelection(valid && value ? value : initial);
    };
    const restore = () => {
      read();
      setEntry(previous => ({ revision: previous.revision + 1, play: false }));
    };
    read();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [initial, subjects]);

  function choose(key: string) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('example') !== key) {
      url.searchParams.set('example', key);
      window.history.pushState(window.history.state, '', url);
    }
    setSelection(key);
  }
  function chooseSubject(id: string) {
    const next = subjects.find(item => item.id === id);
    if (!next) return;
    setEntry(previous => ({ revision: previous.revision + 1, play: true }));
    choose(initial.startsWith(id + '/') ? initial : `${id}/${next.ideas[0].id}`);
  }
  return <fieldset className="company-examples" aria-label="Code examples" aria-busy={!ready} disabled={!ready}>
    <header className="quickstart-heading">
      <h2 id="quickstart-title">{intro.title}</h2>
      <div>
        <p>{intro.description}</p>
        <a className="quickstart-link" href={`https://docs.tangle.tools/${intro.path}`}>{intro.link} <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <nav className="ce-topics" aria-label="Example topics">
      {subjects.map(item => <Button variant="ghost" size="sm" type="button" key={item.id} aria-pressed={item.id === subject.id} onClick={() => chooseSubject(item.id)}>{item.label}</Button>)}
    </nav>
    <div className="ce-pickers">
      <Picker label="Topic" value={subject.id} options={subjects} choose={chooseSubject} />
    </div>
    <ExampleWorkbench
      key={entry.revision}
      subjects={[subject]}
      value={selection}
      initial={initial}
      onSelect={choose}
      playOnView
      playOnSelect={entry.play}
      showReceipt={false}
    />
  </fieldset>;
}
