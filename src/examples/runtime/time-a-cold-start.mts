import { createTangleProvider } from "@tangle-network/agent-provider-tangle";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";
import { Sandbox } from "@tangle-network/sandbox";

// Swap the provider and these three numbers compare clouds like for like.
const provider = createTangleProvider({
  client: new Sandbox({
    apiKey: process.env.TANGLE_API_KEY!,
    baseUrl: "https://sandbox.tangle.tools",
  }),
});
const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "timer", harness: "claude-code" } },
});

const ms = (from: number) => `${Math.round(performance.now() - from)} ms`;
const t0 = performance.now();
const box = await client.create();
console.log("create", ms(t0));
try {
  const t1 = performance.now();
  await box.exec("true");
  console.log("first command", ms(t1));
} finally {
  const t2 = performance.now();
  await box.delete();
  console.log("delete", ms(t2));
}
