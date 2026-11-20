import { e2b } from "@computesdk/e2b";
import { createComputeSdkProvider } from "@tangle-network/agent-provider-computesdk";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";
import { compute } from "computesdk";

compute.setConfig({ provider: e2b({ apiKey: process.env.E2B_API_KEY! }) });
const provider = createComputeSdkProvider({
  compute,
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
