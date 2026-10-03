export const interactiveHarnesses = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'codex', label: 'Codex' },
  { id: 'pi', label: 'Pi' },
  { id: 'opencode', label: 'OpenCode' },
];

export const interactiveExample = {
  filename: 'native-agent.mts',
  language: 'typescript',
  install: 'npm install @tangle-network/sandbox @tangle-network/agent-interface',
  docsUrl: 'https://docs.tangle.tools/sandbox/sdk-reference',
  code: `import { Sandbox, type AgentProfile } from '@tangle-network/sandbox';
import {
  agentInteractiveSessionRunRef,
  canonicalAgentProfileDigest,
} from '@tangle-network/agent-interface';

const tangle = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: 'https://sandbox.tangle.tools',
});
const workspace = await tangle.create({
  environment: 'universal',
  maxLifetimeSeconds: 900,
});

const sessionId = crypto.randomUUID();
const profile: AgentProfile = { harness: 'claude-code' };
const request = {
  profile,
  requestedProfileDigest: canonicalAgentProfileDigest(profile),
  initialPrompt: 'How should we run agents inside our product? ' +
    'Read https://docs.tangle.tools/sandbox/sdk-reference, ' +
    'https://docs.tangle.tools/infrastructure/harnesses and ' +
    'https://docs.tangle.tools/platform/authentication. ' +
    'Write a concise brief with source URLs to ' +
    '/workspace/research/brief.md.',
  cwd: '/workspace',
};
const run = agentInteractiveSessionRunRef({
  provider: 'tangle-sandbox',
  environmentId: workspace.id,
  sessionId,
  executionId: crypto.randomUUID(),
}, request);

const agent = workspace.session(sessionId).interactive();
const started = await agent.start({ ...request, run });
await agent.attach({
  control: started.control,
  cols: 100,
  rows: 28,
  handlers: { onData: (bytes: Uint8Array) => process.stdout.write(bytes) },
});`,
};

export const researchWorkflowExample = {
  filename: 'agent-research.yaml',
  language: 'yaml',
  install: 'tangle workflows create agent-research.yaml',
  docsUrl: 'https://sandbox.tangle.tools/docs/workflows',
  code: `# Webhook: {"question":"How should we run agents inside our product?"}
name: agent-research
on:
  webhook: {}
do:
  - id: docs
    needs: []
    agent.run:
      profile:
        name: docs-researcher
        prompt: { systemPrompt: "Read the documentation and cite source URLs." }
      prompt: >-
        Answer: \${trigger.question}
        Read https://docs.tangle.tools/sandbox/sdk-reference,
        https://docs.tangle.tools/infrastructure/harnesses and
        https://docs.tangle.tools/platform/authentication.
  - id: compare
    needs: []
    agent.run:
      profile:
        name: architecture-reviewer
        prompt: { systemPrompt: "Compare documented approaches and tradeoffs." }
      prompt: >-
        Compare one-off execution, persistent sessions and fleets
        for this question: \${trigger.question}
        Use https://docs.tangle.tools/sandbox/sdk-reference.
  - id: brief
    needs: [docs, compare]
    agent.run:
      profile:
        name: research-editor
        prompt: { systemPrompt: "Write a concise brief with source URLs." }
      prompt: |
        Question: \${trigger.question}
        Documentation: \${steps.docs.text}
        Comparison: \${steps.compare.text}
        Write /workspace/research/brief.md and return the brief.
  - decision:
      title: Approve this research brief
      prompt: "\${steps.brief.text}"
      options: [approve, reject]`,
};
