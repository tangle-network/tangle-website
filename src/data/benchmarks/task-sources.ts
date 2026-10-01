import meilisearch from '../../../public/benchmarks/inputs/meilisearch-apps.tasks.json' with { type: 'json' };
import typesense from '../../../public/benchmarks/inputs/typesense-apps.tasks.json' with { type: 'json' };
import rubric from '../../../public/benchmarks/inputs/app-grade-rubric.json' with { type: 'json' };
import type { BoardRecord } from './board-record';

const sources = [meilisearch, typesense];
const titles: Readonly<Record<string, string>> = {
  'meilisearch-federated-pagination': 'Federated search with numbered pages',
  'typesense-synonym-sets': 'Product search with shared synonyms',
  'posts-union-filter-search': 'Post search across topic and audience filters',
};

export function taskPromptsFor(board: BoardRecord) {
  const source = sources.find((source) => source.suite === board.suite.id);
  if (!source) return [];
  if (source.boardDigest !== board.digest || source.tasks.length !== board.tasks.length) {
    throw new Error(`benchmark ${board.suite.id}: task inputs do not match this report`);
  }
  return board.tasks.map((task) => {
    const matches = source.tasks.filter((sourceTask) => sourceTask.label === task.label);
    const prompt = matches[0];
    if (matches.length !== 1 || prompt.digest !== task.digest) {
      throw new Error(`benchmark ${board.suite.id}: task input ${task.label} does not match its recorded identity`);
    }
    return { ...prompt, name: titles[prompt.name] ?? prompt.name };
  });
}

export function gradingSourceFor(commit: string) {
  return commit === rubric.graderCommit ? '/benchmarks/inputs/app-grade-rubric.json' : null;
}
