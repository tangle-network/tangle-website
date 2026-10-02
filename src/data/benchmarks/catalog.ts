import type { BoardRecord } from './board-record';

// Reader-facing descriptions are separate from the runner's immutable results.
const descriptions: Record<string, { title: string; description: string; category: string }> = {
  'meilisearch-apps': {
    title: 'Meilisearch apps',
    description: 'Build storefront search, curation tools, and admin apps using the Meilisearch search engine.',
    category: 'App development',
  },
  'typesense-apps': {
    title: 'Typesense apps',
    description: 'Build product search, filters, and catalog tools using the Typesense search engine.',
    category: 'App development',
  },
};

export function benchmarkDescription(board: BoardRecord) {
  return descriptions[board.suite.id] ?? {
    title: board.suite.name,
    description: board.suite.description,
    category: 'Other benchmarks',
  };
}
