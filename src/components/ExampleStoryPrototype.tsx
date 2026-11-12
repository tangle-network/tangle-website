import { useEffect, useState, type ComponentProps } from 'react';
import ExampleStory from './ExampleStory';
import QuickstartCode, { type Subject } from './QuickstartCode';

const variants = { paired: 'Code and result', change: 'Tests and patch', sequence: 'Continuous story' } as const;
type Variant = keyof typeof variants;

export default function ExampleStoryPrototype({ subjects, story }: { subjects: Subject[]; story: Omit<ComponentProps<typeof ExampleStory>, 'variant'> }) {
  const [variant, setVariant] = useState<Variant | null>(null);
  useEffect(() => {
    const read = () => {
      const key = new URL(window.location.href).searchParams.get('variant');
      setVariant(key && Object.hasOwn(variants, key) ? key as Variant : null);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  if (!variant) return <QuickstartCode subjects={subjects} />;
  return <div className="es-prototype">
    <h2 id="example-story-title">Fix failing tests.</h2>
    <ExampleStory {...story} variant={variant} />
    <nav className="es-prototype-tools" aria-label="Prototype comparison">
      {Object.entries(variants).map(([key, label]) => <a key={key} href={`?variant=${key}#quickstart-title`} aria-current={variant === key ? 'page' : undefined}>{label}</a>)}
    </nav>
  </div>;
}
