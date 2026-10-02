import meilisearch from '../../../public/benchmarks/inputs/meilisearch-apps.tasks.json' with { type: 'json' };
import typesense from '../../../public/benchmarks/inputs/typesense-apps.tasks.json' with { type: 'json' };
import rubric from '../../../public/benchmarks/inputs/app-grade-rubric.json' with { type: 'json' };
import type { BoardRecord } from './board-record';
import documentation from './task-documentation.json' with { type: 'json' };

const sources = [meilisearch, typesense];
const documentationSources: Record<string, { boardDigest: string; tasks: Array<{ name: string; sources: Array<{ href: string; label: string }> }> }> = documentation;
const titles: Readonly<Record<string, string>> = {
  'Curation studio with search-rule demotion and hiding': 'Storefront search curation',
  'Typesense Pinned Search Results': 'Pinned product results',
  'Typesense Collection Duplicator': 'Catalog duplication',
  'meilisearch-federated-pagination': 'Federated search with numbered pages',
  'typesense-synonym-sets': 'Product search with shared synonyms',
  'posts-union-filter-search': 'Post search across topic and audience filters',
};

export function taskPromptsFor(board: BoardRecord) {
  const source = sources.find((source) => source.suite === board.suite.id);
  if (!source) return [];
  const docs = documentationSources[board.suite.id];
  if (docs && docs.boardDigest !== board.digest) {
    throw new Error(`benchmark ${board.suite.id}: documentation sources do not match this report`);
  }
  if (source.boardDigest !== board.digest || source.tasks.length !== board.tasks.length) {
    throw new Error(`benchmark ${board.suite.id}: task inputs do not match this report`);
  }
  return board.tasks.map((task) => {
    const matches = source.tasks.filter((sourceTask) => sourceTask.label === task.label);
    const prompt = matches[0];
    if (matches.length !== 1 || prompt.digest !== task.digest) {
      throw new Error(`benchmark ${board.suite.id}: task input ${task.label} does not match its recorded identity`);
    }
    return { ...prompt, name: titles[prompt.name] ?? prompt.name, sources: docs?.tasks.find((task) => task.name === prompt.name)?.sources ?? [] };
  });
}

export function gradingSourceFor(commit: string) {
  return commit === rubric.graderCommit ? '/benchmarks/inputs/app-grade-rubric.json' : null;
}
