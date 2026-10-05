import { useEffect, useState } from 'react';
import { Chip } from '@tangle-network/ui/primitives';

interface Topic {
  id: string;
  label: string;
}

/**
 * Single-select topic filter for the blog index. The rows and series cards
 * stay static Astro markup; this island only toggles their `hidden` state
 * from each element's space-separated `data-topics`.
 */
export default function TopicFilter({ topics }: { topics: Topic[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-post-row], [data-series-card]');
    for (const target of targets) {
      const tags = (target.dataset.topics ?? '').split(' ');
      target.hidden = active !== null && !tags.includes(active);
    }
  }, [active]);

  return (
    <div className="topic-filter" role="group" aria-label="Filter by topic">
      <Chip size="md" selected={active === null} onSelectedChange={() => setActive(null)}>
        All
      </Chip>
      {topics.map((topic) => (
        <Chip
          key={topic.id}
          size="md"
          selected={active === topic.id}
          onSelectedChange={(on) => setActive(on ? topic.id : null)}
        >
          {topic.label}
        </Chip>
      ))}
    </div>
  );
}
