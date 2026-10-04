export const examples = {
  sandbox: {
    filename: 'build-app.mts',
    language: 'typescript',
    install: 'npm install @tangle-network/sandbox',
    docsUrl: 'https://sandbox.tangle.tools/docs/sdk/typescript',
    code: `import { Sandbox } from '@tangle-network/sandbox';

const tangle = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: 'https://sandbox.tangle.tools',
});

const workspace = await tangle.create({
  environment: 'universal',
  maxLifetimeSeconds: 1800,
});

await workspace.prompt(
  'Build Fieldnotes, a notes app with add/delete notes ' +
  'and a light/dark theme toggle. ' +
  'Start the app on 0.0.0.0:3000 and leave it running.',
);

const preview = await workspace.previewLinks.create(3000);
await workspace.previewLinks.waitUntilReady(preview.previewId);
console.log(preview.url);`,
  },
  research: {
    filename: 'research.mts',
    language: 'typescript',
    install: 'npm install @tangle-network/sandbox',
    docsUrl: 'https://sandbox.tangle.tools/docs/agents/fleet',
    code: `import { Sandbox } from '@tangle-network/sandbox';

const tangle = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: 'https://sandbox.tangle.tools',
});
const topics = ['Energy storage', 'Grid capacity', 'Power demand'];

const fleet = await tangle.fleets.create({
  defaults: { environment: 'universal', maxLifetimeSeconds: 900 },
  machines: topics.map((topic, index) => ({
    machineId: 'research-' + index,
    env: { RESEARCH_TOPIC: topic },
  })),
});

const reports = await fleet.dispatchPrompt(
  'Research the topic in RESEARCH_TOPIC. Compare recent primary ' +
  'sources, cite their URLs, and identify the open questions.',
);
console.log(reports);
await fleet.delete();`,
  },
  browser: {
    filename: 'browser.mts',
    language: 'typescript',
    install: 'npm install @tangle-network/sandbox',
    docsUrl: 'https://sandbox.tangle.tools/docs/agents/mcp',
    code: `import { Sandbox } from '@tangle-network/sandbox';

const tangle = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: 'https://sandbox.tangle.tools',
});

const desktop = await tangle.create({
  environment: 'universal',
  capabilities: ['computer_use'],
  maxLifetimeSeconds: 900,
});

const result = await desktop.prompt(
  'Use the browser to explore https://docs.tangle.tools. ' +
  'Find the sandbox quickstart and follow its navigation. ' +
  'Report any broken links with their URLs and screenshots.',
);
console.log(result);
await desktop.delete();`,
  },
  workflows: {
    filename: 'research-brief.yaml',
    language: 'yaml',
    install: 'tangle workflows create research-brief.yaml',
    docsUrl: 'https://sandbox.tangle.tools/docs/workflows',
    code: `name: research-brief
on:
  webhook: {}
do:
  - id: market
    needs: []
    agent.run:
      profile:
        name: market-researcher
        prompt: { systemPrompt: "Use primary sources and cite URLs." }
      prompt: "Research market demand for \${trigger.brief}."
  - id: technical
    needs: []
    agent.run:
      profile:
        name: technical-reviewer
        prompt: { systemPrompt: "Check feasibility using primary sources." }
      prompt: "Review technical requirements for \${trigger.brief}."
  - id: company
    needs: []
    agent.run:
      profile:
        name: company-analyst
        prompt: { systemPrompt: "Research companies and cite public sources." }
      prompt: "Analyze relevant companies for \${trigger.brief}."
  - id: brief
    needs: [market, technical, company]
    agent.run:
      topology: { inference: {} }
      profile:
        name: research-editor
        prompt: { systemPrompt: "Write a brief with citations and open questions." }
      prompt: |
        Request: \${trigger.brief}
        Market: \${steps.market.text}
        Technical: \${steps.technical.text}
        Companies: \${steps.company.text}
  - decision:
      title: Approve this research brief
      prompt: "\${steps.brief.text}"
      options: [approve, reject]`,
  },
  models: {
    filename: 'models.mts',
    language: 'typescript',
    install: 'npm install openai',
    docsUrl: 'https://docs.tangle.tools/gateway',
    code: `import { OpenAI } from 'openai';

const models = new OpenAI({
  apiKey: process.env.TANGLE_API_KEY!,
  baseURL: 'https://router.tangle.tools/v1',
});

const reply = await models.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [{
    role: 'user',
    content: 'Design a customer onboarding workflow. ' +
      'Include the handoffs that need human approval.',
  }],
});

console.log(reply.choices[0].message.content);`,
  },
};
