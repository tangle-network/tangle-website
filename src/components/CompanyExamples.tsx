import { ExampleEditor, type ExampleSubject } from '@tangle-network/ui/marketing';
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@tangle-network/ui/primitives';
import { Fragment, useEffect, useRef, useState } from 'react';
import './company-examples.css';

interface Props { subjects: ExampleSubject[]; initial: string }

const outputInks = {
  'ce-add': /^(?:\+(?!\+\+).*|ok \d+\b.*|# pass \d+|# fail 0|\d+ tests passed)$/gm,
  'ce-remove': /^(?:-(?!--).*|not ok \d+\b.*|# fail [1-9]\d*)$/gm,
  'ce-hunk': /^@@.*$/gm,
};

// Color the existing selectable text. The original +/- patch and TAP markers stay readable everywhere.
function highlightOutput(root: HTMLFieldSetElement) {
  const logs = root.querySelectorAll('.qs-event-output[open]');
  for (const [name, pattern] of Object.entries(outputInks)) {
    const ink = new Highlight();
    for (const log of logs) {
      const pre = log.querySelector('pre');
      if (!pre || !/^(?:diff --git |TAP version )/m.test(pre.textContent ?? '')) continue;
      for (const node of [pre.firstChild, log.querySelector('summary')?.firstChild]) {
        if (!(node instanceof Text)) continue;
        for (const line of node.data.matchAll(pattern)) {
          const range = new Range();
          range.setStart(node, line.index);
          range.setEnd(node, line.index + line[0].length);
          ink.add(range);
        }
      }
    }
    CSS.highlights.set(name, ink);
  }
}

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
    description: 'Keep your agent profile and switch the provider that runs it on Tangle, E2B or Daytona.',
    link: 'Provider guide', path: 'sandbox/other-providers',
  },
};

function Picker({ label, value, options, choose }: {
  label: string; value: string; options: { id: string; label: string; group?: string }[]; choose: (value: string) => void;
}) {
  const groups = [...new Set(options.map(item => item.group))];
  const current = options.find(item => item.id === value);
  const [open, setOpen] = useState(false);
  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild
      // A touch release can land on a menu item when Radix opens the menu on pointer-down.
      onPointerDownCapture={event => { if (event.button === 0 && !event.ctrlKey) event.stopPropagation(); }}
      onClick={() => setOpen(value => !value)}><Button variant="outline" aria-label={`${label}, ${current?.label}`}>
      <span>{current?.label}</span><span aria-hidden="true">▾</span>
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" sideOffset={4} className="ce-menu" aria-label={label}>
      <DropdownMenuRadioGroup value={value}>{groups.map(group => <Fragment key={group ?? 'options'}>
        {group && <DropdownMenuLabel>{group}</DropdownMenuLabel>}
        {options.filter(item => item.group === group).map(item =>
          <DropdownMenuRadioItem className="ce-option" value={item.id} key={item.id} onSelect={() => choose(item.id)}>{item.label}</DropdownMenuRadioItem>)}
      </Fragment>)}</DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export default function CompanyExamples({ subjects, initial }: Props) {
  const editor = useRef<HTMLFieldSetElement>(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState(initial);
  const [interaction, setInteraction] = useState(0);
  const [topic, file] = selection.split('/');
  const subject = subjects.find(item => item.id === topic) ?? subjects[0];
  const intro = introductions[subject.id];
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
  const groups = [...new Set(ordered.map(groupFor))];
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

  useEffect(() => {
    const root = editor.current;
    if (!root || !('highlights' in CSS)) return;
    const highlight = () => highlightOutput(root);
    root.addEventListener('toggle', highlight, true);
    return () => {
      root.removeEventListener('toggle', highlight, true);
      for (const name of Object.keys(outputInks)) CSS.highlights.delete(name);
    };
  }, [selection, interaction]);

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
  return <fieldset ref={editor} className="company-examples" aria-label="Code examples" aria-busy={!ready} disabled={!ready}>
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
