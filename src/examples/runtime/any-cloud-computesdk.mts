import { e2b } from "@computesdk/e2b";
import { createComputeSdkProvider } from "@tangle-network/agent-provider-computesdk";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";
import { compute } from "computesdk";

// ComputeSDK picks the cloud, E2B here; the model still goes through the Tangle Router on your key.
compute.setConfig({ provider: e2b({ apiKey: process.env.E2B_API_KEY }) });
const provider = createComputeSdkProvider({ compute, router: { key: process.env.TANGLE_API_KEY! } });

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
