import basic from '../examples/basic.ts?raw';
import evals from '../examples/evals.ts?raw';
import fleets from '../examples/fleets.ts?raw';
import products from '../examples/products.ts?raw';

// Each tab shows one file from src/examples byte for byte, so what a reader
// copies is what `pnpm check:examples` typechecked against the published SDK.
// TypeScript only: the Python SDK is not published. `cli` is the same work
// from the CLI, shown until the file has a recorded run.
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
  { id: 'basic', label: 'Basic', summary: 'one box, one task', file: 'basic.ts', code: basic, install: SANDBOX,
    cli: 'tangle sandbox create --git-url https://github.com/your-org/your-repo --backend claude-code' },
  { id: 'fleets', label: 'Fleets', summary: 'agents under a budget', file: 'fleets.ts', code: fleets, install: SANDBOX,
    cli: 'tangle fleet run "List the three slowest tests and why." --agents 4 --placement 2 --model glm-5.3 --max-spend-usd 1' },
  { id: 'evals', label: 'Evals', summary: 'score a change', file: 'evals.ts', code: evals, install: `${SANDBOX} @tangle-network/agent-eval` },
  { id: 'products', label: 'Products', summary: 'one key', file: 'products.ts', code: products, install: SANDBOX,
    cli: 'curl https://router.tangle.tools/v1/chat/completions -H "Authorization: Bearer $TANGLE_API_KEY"' },
];
