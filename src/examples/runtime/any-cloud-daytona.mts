import { createDaytonaProvider } from "@tangle-network/agent-provider-daytona";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const model = process.env.TANGLE_MODEL;
if (!model) throw new Error("Set TANGLE_MODEL to the Router model to run.");
const provider = createDaytonaProvider({ router: { key: process.env.TANGLE_API_KEY! } });

const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "repo-reader", harness: "claude-code", model: { default: model } } },
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
