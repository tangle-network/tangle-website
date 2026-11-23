import { createBoatProvider } from "@tangle-network/agent-provider-boat";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const provider = createBoatProvider({
  apiKey: process.env.BOAT_API_KEY!,
  router: { key: process.env.TANGLE_API_KEY! },
});

const client = providerAsSandboxClient(provider);
const model = process.env.TANGLE_MODEL;
if (!model) throw new Error("Set TANGLE_MODEL to a model your Router key can use.");

const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
  backend: {
    profile: { name: "repo-reader", harness: "claude-code", model: { default: model } },
  },
});
try {
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task)) {
    if (event.type === "result") console.log(event.data.finalText);
  }
} finally {
  await box.delete();
}
