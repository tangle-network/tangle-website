// The recorded stdout of one production run of the matching src/examples
// file. A run spends model tokens, so it is recorded by hand on a credited
// key and pasted here with its date, id, duration and cost. Until a file has
// a recording the strip shows only the command that runs it; nothing is invented.
export interface ExampleOutput {
  id: 'basic' | 'fleets' | 'evals' | 'products';
  recordedAt: string;
  sandboxOrFleetId: string;
  durationS: number;
  usd: number;
  lines: string[];
}

export const exampleOutputs: ExampleOutput[] = [];
