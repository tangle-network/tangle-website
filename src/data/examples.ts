import basic from '../examples/basic.mts?raw';
import evals from '../examples/evals.mts?raw';
import fleets from '../examples/fleets.mts?raw';
import products from '../examples/products.mts?raw';

// Each tab shows one file from src/examples byte for byte, so what a reader
// copies is what `pnpm check:examples` typechecked against the published SDK.
// TypeScript only: the Python SDK is not published. The files are .mts so
// `npx tsx <file>` runs them as ES modules under any package.json. `cli` is
// the same work from the CLI, shown until the file has a recorded run; a tab
// carries one only when that command runs as shown on a Free key.
export interface Example {
  id: 'basic' | 'fleets' | 'evals' | 'products';
  label: string;
  summary: string;
  file: string;
  code: string;
  install: string;
  cli?: string;
}

const SANDBOX = 'npm install @tangle-network/sandbox';

export const homeExamples: Example[] = [
  { id: 'basic', label: 'Basic', summary: 'one box, one task', file: 'basic.mts', code: basic, install: SANDBOX },
  { id: 'fleets', label: 'Fleets', summary: 'agents under a budget', file: 'fleets.mts', code: fleets, install: SANDBOX,
    cli: 'tangle fleet run "List the three slowest tests and why." --agents 4 --placement 4 --model glm-5.3 --max-spend-usd 1' },
  { id: 'evals', label: 'Evals', summary: 'score a change', file: 'evals.mts', code: evals, install: `${SANDBOX} @tangle-network/agent-eval` },
  { id: 'products', label: 'Products', summary: 'one key', file: 'products.mts', code: products, install: SANDBOX },
];
