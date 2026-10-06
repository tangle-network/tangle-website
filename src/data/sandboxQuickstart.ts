import { harnessSupportsModel } from '@tangle-network/agent-interface/harness-capabilities';

interface TemplateParts {
  /** Lines placed above the client, such as standard-library imports. */
  imports?: string;
  /** Extra named imports from @tangle-network/sandbox (TypeScript only). */
  sdkImports?: string;
  /** Declarations the create call depends on, such as an AgentProfile. */
  preamble?: string;
  /** Create options that are the point of the example. */
  createOptions?: string;
  /** A comment line placed above the create call. */
  createComment?: string;
}

const typescript = (operation: string, { imports = '', sdkImports = '', preamble = '', createOptions = '', createComment = '' }: TemplateParts = {}) => {
  const client = `${imports}import { Sandbox${sdkImports} } from '@tangle-network/sandbox';

const tangle = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: 'https://sandbox.tangle.tools',
});`;
  const create = `${createComment ? `// ${createComment}\n` : ''}const box = await tangle.create({
  environment: 'universal', maxLifetimeSeconds: 900,
${createOptions}});
await box.waitFor('running');`;
  const setup = [client, preamble, create].filter(Boolean).join('\n\n');
  const shownImports = [imports.trim(), sdkImports ? `import { ${sdkImports.replace(/^, /, '')} } from '@tangle-network/sandbox';` : '']
    .filter(Boolean).join('\n');
  return {
    snippet: operation
      ? [shownImports, preamble, createOptions ? create : '', operation].filter(Boolean).join('\n\n')
      : setup,
    fullCode: `${setup}

${operation || 'console.log(box.id);'}

await box.delete();`,
  };
};

// The Python SDK is not publicly installable; these use the hosted HTTP API.
const python = (operation: string, { imports = '', preamble = '', createOptions = '', createComment = '' }: TemplateParts = {}) => {
  const client = `${imports}import os
import time
from contextlib import ExitStack
import httpx

with httpx.Client(
    base_url="https://sandbox.tangle.tools", timeout=180,
    headers={"Authorization": f"Bearer {os.environ['TANGLE_API_KEY']}"},
) as tangle, ExitStack() as cleanup:`;
  const create = `${createComment ? `    # ${createComment}\n` : ''}    box = tangle.post("/v1/sandboxes", json={
        "environment": "universal", "maxLifetimeSeconds": 900,
${createOptions}    }).raise_for_status().json()
    path = f"/v1/sandboxes/{box['id']}"
    cleanup.callback(lambda: tangle.delete(path).raise_for_status())
    for _ in range(60):
        if box["status"] == "running":
            break
        if box["status"] not in ("pending", "provisioning"):
            raise RuntimeError(box.get("error") or box["status"])
        time.sleep(2)
        box = tangle.get(path).raise_for_status().json()
    else:
        raise TimeoutError("Sandbox did not start")`;
  const setup = [client, preamble, create].filter(Boolean).join('\n');
  const dedent = (code: string) => code.replace(/^ {4}/gm, '');
  return {
    snippet: operation
      ? [imports.trim(), dedent(preamble), createOptions ? dedent(create) : '', dedent(operation)]
          .filter(Boolean).join('\n\n')
      : setup,
    fullCode: `${setup}

${operation || '    print(box["id"])'}`,
  };
};

// Each run streams its events, so a run longer than the blocking endpoint's
// limit still returns its result.
const pythonRunAgent = `    def run_agent(text, session_id, backend=None):
        body = {"id": "default", "sessionId": session_id, "parts": [
            {"type": "text", "text": base64.b64encode(text.encode()).decode()},
        ]}
        if backend:
            body["backend"] = backend
        with tangle.stream("POST", f"{path}/runtime/agents/run/stream", json=body) as events:
            event = None
            for line in events.raise_for_status().iter_lines():
                if line.startswith("event: "):
                    event = line[len("event: "):]
                elif line.startswith("data: ") and event == "result":
                    return json.loads(line[len("data: "):]).get("finalText")
                elif line.startswith("data: ") and event == "error":
                    raise RuntimeError(line[len("data: "):])
        raise RuntimeError("Run ended without a result")`;

export const quickstartLanguages = [
  { id: 'typescript', label: 'TypeScript', syntax: 'ts', install: 'npm install @tangle-network/sandbox' },
  { id: 'python', label: 'Python', syntax: 'python', install: 'pip install httpx' },
] as const;

// A run is a Sandbox (size, image, workspace, retention) plus a versioned
// AgentProfile (harness, model, instructions) plus a Prompt. The harness ids
// are the Sandbox backend types; model ids are provider-qualified Router ids.
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

/** The Run an agent example for one harness and model. */
export const agentExample = (harness: AgentHarness, model: AgentModel) => ({
  typescript: typescript(`// Prompt: one run of the profile in the sandbox.
const result = await box.prompt('Summarize this repository in one sentence.');
console.log(result.success ? result.response : result.error);`, {
    sdkImports: ', sandboxResourcesForSize, type AgentProfile',
    preamble: `// AgentProfile: the versioned agent. Harness, model and instructions.
const reviewer = {
  name: 'reviewer',
  version: '1.0.0',
  harness: '${harness}',
  model: { default: '${model}', reasoningEffort: 'medium' },
  prompt: { instructions: ['Read the workspace. Do not edit files.'] },
} satisfies AgentProfile;`,
    createComment: 'Sandbox: size, image, workspace and retention.',
    createOptions: `  resources: sandboxResourcesForSize('small'),
  git: { url: 'https://github.com/octocat/Hello-World.git' },
  backend: { type: reviewer.harness, profile: reviewer },
`,
  }),
  python: python(`${pythonRunAgent}

    # Prompt: one run of the profile in the sandbox.
    backend = {"type": profile["harness"], "profile": profile}
    print(run_agent("Summarize this repository in one sentence.", "quickstart", backend))`, {
    imports: 'import base64\nimport json\n',
    preamble: `    # AgentProfile: the versioned agent. Harness, model and instructions.
    profile = {
        "name": "reviewer",
        "version": "1.0.0",
        "harness": "${harness}",
        "model": {"default": "${model}", "reasoningEffort": "medium"},
        "prompt": {"instructions": ["Read the workspace. Do not edit files."]},
    }
`,
    createComment: 'Sandbox: size, image, workspace and retention.',
    createOptions: `        "resources": {"cpuCores": 2, "memoryMB": 4096, "diskGB": 20},
        "git": {"url": "https://github.com/octocat/Hello-World.git"},
        "backend": {"type": profile["harness"], "profile": profile},
`,
  }),
});

interface QuickstartCode { snippet: string; fullCode: string }
interface QuickstartExample {
  id: string;
  label: string;
  /** The example takes its harness and model from the agent selectors. */
  selectsAgent?: boolean;
  typescript: QuickstartCode;
  python: QuickstartCode;
}

export const quickstartExamples: QuickstartExample[] = [
  {
    id: 'create', label: 'Create a sandbox',
    typescript: typescript(''),
    python: python(''),
  },
  {
    id: 'run', label: 'Run code',
    typescript: typescript(`const result = await box.exec('node --version');
console.log(result.stdout);`),
    python: python(`    result = tangle.post(f"{path}/runtime/terminals/commands", json={
        "command": "node --version", "timeout": 30000,
    }).raise_for_status().json()
    print(result["result"]["stdout"])`),
  },
  {
    id: 'files', label: 'Files',
    typescript: typescript(`await box.write('/workspace/message.txt', 'Hello from Tangle');
const content = await box.read('/workspace/message.txt');
console.log(content);`),
    python: python(`    tangle.post(f"{path}/runtime/files/write", json={
        "path": "/workspace/message.txt", "content": "Hello from Tangle",
    }).raise_for_status()
    result = tangle.post(f"{path}/runtime/files/read", json={
        "path": "/workspace/message.txt", "encoding": "utf8",
    }).raise_for_status().json()
    print(result["data"]["content"])`),
  },
  {
    id: 'agent', label: 'Run an agent', selectsAgent: true,
    ...agentExample(defaultAgent.harness, defaultAgent.model),
  },
  {
    id: 'preview', label: 'App preview',
    typescript: typescript(`await box.write('/workspace/index.html', '<h1>Hello from your sandbox</h1>');
await box.process.spawnExact('python3', [
  '-m', 'http.server', '3000', '--bind', '0.0.0.0', '--directory', '/workspace',
], { timeoutMs: 900_000 });
const link = await box.previewLinks.create(3000);
const ready = await box.previewLinks.waitUntilReady(link.previewId);
console.log(ready.url);

const terminal = createInterface({ input: process.stdin, output: process.stdout });
await terminal.question('Press Enter when finished viewing the preview.');
terminal.close();`, { imports: "import { createInterface } from 'node:readline/promises';\n" }),
    python: python(`    tangle.post(f"{path}/runtime/files/write", json={
        "path": "/workspace/index.html", "content": "<h1>Hello from your sandbox</h1>",
    }).raise_for_status()
    tangle.post(f"{path}/runtime/process/spawn", json={
        "executable": "python3", "timeoutMs": 900000,
        "args": ["-m", "http.server", "3000", "--bind", "0.0.0.0", "--directory", "/workspace"],
    }).raise_for_status()
    link = tangle.post(f"{path}/runtime/preview-links", json={
        "port": 3000, "protocol": "tcp",
    }).raise_for_status().json()["previewLink"]
    for _ in range(60):
        link = tangle.get(
            f"{path}/runtime/preview-links/{link['previewId']}",
        ).raise_for_status().json()["previewLink"]
        if link["status"] == "ready":
            break
        if link["status"] in ("error", "disabled"):
            raise RuntimeError(f"Preview unavailable: {link['status']}")
        time.sleep(2)
    else:
        raise TimeoutError("Preview did not become ready")
    print(link["url"])
    input("Press Enter when finished viewing the preview.")`),
  },
  {
    id: 'resume', label: 'Pause and resume',
    typescript: typescript(`await box.write('/workspace/notes.txt', 'Continue from here.');
await box.stop();
await box.waitFor('stopped');

await box.resume();
await box.waitFor('running');
console.log(await box.read('/workspace/notes.txt'));`),
    python: python(`    tangle.post(f"{path}/runtime/files/write", json={
        "path": "/workspace/notes.txt", "content": "Continue from here.",
    }).raise_for_status()
    tangle.post(f"{path}/stop").raise_for_status()
    tangle.post(f"{path}/resume").raise_for_status()
    for _ in range(60):
        box = tangle.get(path).raise_for_status().json()
        if box["status"] == "running":
            break
        if box["status"] not in ("pending", "provisioning", "stopped"):
            raise RuntimeError(box.get("error") or box["status"])
        time.sleep(2)
    else:
        raise TimeoutError("Sandbox did not resume")
    result = tangle.post(f"{path}/runtime/files/read", json={
        "path": "/workspace/notes.txt", "encoding": "utf8",
    }).raise_for_status().json()
    print(result["data"]["content"])`),
  },
  {
    id: 'parallel', label: 'Parallel agents',
    typescript: typescript(`// Sessions can share a workspace; these tasks only inspect it.
const tasks = [
  ['tools', 'Report Node.js, Python and Git versions. Do not edit files.'],
  ['workspace', 'List workspace files and package managers. Do not edit files.'],
] as const;
const results = await Promise.all(tasks.map(([sessionId, prompt]) =>
  box.prompt(prompt, { sessionId }),
));
for (const [index, result] of results.entries()) {
  console.log(tasks[index][0], result.success ? result.response : result.error);
}`),
    python: python(`${pythonRunAgent}

    # Sessions can share a workspace; these tasks only inspect it.
    tasks = [
        ("tools", "Report Node.js, Python and Git versions. Do not edit files."),
        ("workspace", "List workspace files and package managers. Do not edit files."),
    ]
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda task: run_agent(task[1], task[0]), tasks))
    for (session_id, _), result in zip(tasks, results):
        print(session_id, result)`, { imports: 'import base64\nimport json\nfrom concurrent.futures import ThreadPoolExecutor\n' }),
  },
  {
    id: 'network', label: 'Network policy',
    typescript: typescript(`const result = await box.exec(
  \`node -e "fetch('https://docs.tangle.tools').then(r => console.log(r.status))"\`,
);
console.log(result.stdout);`, { createOptions: `  egressPolicy: {
    mode: 'strict', allowDomains: ['docs.tangle.tools'],
    includeImplicitDomains: false,
  },
` }),
    python: python(`    result = tangle.post(f"{path}/runtime/terminals/commands", json={
        "command": "node -e \\"fetch('https://docs.tangle.tools').then(r => console.log(r.status))\\"",
        "timeout": 30000,
    }).raise_for_status().json()
    print(result["result"]["stdout"])`, { createOptions: `        "egressPolicy": {
            "mode": "strict", "allowDomains": ["docs.tangle.tools"],
            "includeImplicitDomains": False,
        },
` }),
  },
];
