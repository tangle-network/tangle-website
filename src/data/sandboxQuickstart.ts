import { sdkQuickstartExamples } from './sandboxQuickstartExamples';

// TypeScript only: the Python SDK is not published, and an example that cannot
// be installed is worse than none.
export const quickstartLanguages = [
  { id: 'typescript', label: 'TypeScript', syntax: 'ts', install: 'npm install @tangle-network/sandbox' },
] as const;

interface QuickstartCode { snippet: string; fullCode: string }
interface QuickstartExample {
  id: string;
  label: string;
  summary: string;
  typescript: QuickstartCode;
}

// The page shows the whole file, so what a reader copies is what they read.
const shown = (code: string): QuickstartCode => ({ snippet: code.trimEnd(), fullCode: code });

export const quickstartExamples: QuickstartExample[] = sdkQuickstartExamples.map((example) => ({
  id: example.id,
  label: example.title,
  summary: example.summary,
  typescript: shown(example.code),
}));
