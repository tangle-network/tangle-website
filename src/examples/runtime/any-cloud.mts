import { createTangleProvider } from "@tangle-network/agent-provider-tangle";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";
import { Sandbox } from "@tangle-network/sandbox";

// Any AgentEnvironmentProvider fits here; this one runs on Tangle.
const provider = createTangleProvider({
  client: new Sandbox({
    apiKey: process.env.TANGLE_API_KEY!,
    baseUrl: "https://sandbox.tangle.tools",
  }),
});

// The harness is a profile field: "claude-code", "codex", "opencode", "pi".
const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "repo-reader", harness: "claude-code" } },
});

const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
});
try {
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task)) {
    if (event.type === "result") console.log(event.data.finalText);
    if (event.type === "done") console.log(`$${Number(event.data.totalCostUsd).toFixed(4)}`);
  }
} finally {
  await box.delete();
}
