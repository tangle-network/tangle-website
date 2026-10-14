import { harnessSupportsModel } from '@tangle-network/agent-interface/harness-capabilities';
import { sdkQuickstartExamples } from './sandboxQuickstartExamples';

// TypeScript only: the Python SDK is not published, and an example that cannot
// be installed is worse than none.
export const quickstartLanguages = [
  { id: 'typescript', label: 'TypeScript', syntax: 'ts', install: 'npm install @tangle-network/sandbox' },
] as const;

// The harness ids are the Sandbox backend types; model ids are provider-qualified Router ids.
export const agentHarnesses = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'codex', label: 'Codex' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'pi', label: 'Pi' },
] as const;

export const agentModels = [
  { id: 'anthropic/claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'anthropic/claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  { id: 'openai/gpt-5.5', label: 'GPT-5.5' },
  { id: 'zai/glm-5.3', label: 'GLM-5.3' },
] as const;

export type AgentHarness = (typeof agentHarnesses)[number]['id'];
export type AgentModel = (typeof agentModels)[number]['id'];

// The pairs that completed a run through the Sandbox API on 2026-10-05.
// Claude Code takes Anthropic models and Codex OpenAI models; OpenCode and Pi
// call the Router, but Pi failed with the Anthropic and GPT-5.6 Luna models, so
// only its passing pairs are offered.
const runnableModels: Record<AgentHarness, readonly AgentModel[]> = {
  'claude-code': ['anthropic/claude-sonnet-5-5', 'anthropic/claude-opus-5-5'],
  codex: ['openai/gpt-5.6-luna', 'openai/gpt-5.5'],
  opencode: [
    'anthropic/claude-sonnet-5-5', 'anthropic/claude-opus-5-5', 'openai/gpt-5.6-luna', 'openai/gpt-5.5',
    'zai/glm-5.3',
  ],
  pi: ['openai/gpt-5.5', 'zai/glm-5.3'],
};

/** The models offered for a harness: a measured passing pair that the shared harness capability table also allows. */
export const modelsForHarness = (harness: AgentHarness) =>
  agentModels.filter((model) => runnableModels[harness].includes(model.id) && harnessSupportsModel(harness, model.id));

export const defaultAgent = { harness: 'claude-code', model: 'anthropic/claude-sonnet-5-5' } as const;

interface QuickstartCode { snippet: string; fullCode: string }
interface QuickstartExample {
  id: string;
  label: string;
  summary: string;
  /** The example takes its harness and model from the agent selectors. */
  selectsAgent?: boolean;
  typescript: QuickstartCode;
}

// The page shows the whole file, so what a reader copies is what they read.
const shown = (code: string): QuickstartCode => ({ snippet: code, fullCode: code });

const AGENT_EXAMPLE = 'fix-failing-test';
const agentSource = sdkQuickstartExamples.find((example) => example.id === AGENT_EXAMPLE);
if (!agentSource) throw new Error(`missing quickstart example ${AGENT_EXAMPLE}`);
const DEFAULT_BACKEND = 'backend: { type: "claude-code" },';
if (!agentSource.code.includes(DEFAULT_BACKEND)) throw new Error(`${AGENT_EXAMPLE} no longer names its backend`);

/** "Fix a failing test" for one harness and model. */
export const agentExample = (harness: AgentHarness, model: AgentModel) => ({
  typescript: shown(
    agentSource.code.replace(DEFAULT_BACKEND, `backend: { type: "${harness}", modelId: "${model}" },`),
  ),
});

export const quickstartExamples: QuickstartExample[] = sdkQuickstartExamples.map((example) => ({
  id: example.id,
  label: example.title,
  summary: example.summary,
  selectsAgent: example.id === AGENT_EXAMPLE,
  typescript:
    example.id === AGENT_EXAMPLE
      ? agentExample(defaultAgent.harness, defaultAgent.model).typescript
      : shown(example.code),
}));
