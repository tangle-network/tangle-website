import { createDaytonaProvider } from "@tangle-network/agent-provider-daytona";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

// Daytona hosts the sandbox; the model still goes through the Tangle Router on your key.
const provider = createDaytonaProvider({ router: { key: process.env.TANGLE_API_KEY! } });

// The same profile as on Tangle: "claude-code", "codex", "opencode" or "pi".
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
  }
} finally {
  await box.delete();
}
