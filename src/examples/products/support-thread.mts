import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// One hosted instance per customer. A thread keeps its history between calls,
// between processes, and across your deploys.
const instance = await client.instances.ensure({
  key: "customer:4821",
  profile: {
    version: "support-v1",
    backend: {
      type: "opencode",
      model: { model: "glm-5.3" },
      profile: {
        name: "support",
        prompt: { systemPrompt: "You are the support agent for a bike shop. Answer in one sentence." },
      },
    },
  },
  create: { resources: { cpuCores: 1, memoryMB: 2048, diskGB: 10 } },
});

async function ask(turnId: string, text: string) {
  let turn = await instance.turn(text, { thread: "orders", turnId });
  while (turn.state === "running") {
    await new Promise((wait) => setTimeout(wait, 3_000));
    turn = await instance.turn(text, { thread: "orders", turnId });
  }
  return turn.state === "completed" ? turn.text : turn.state;
}

console.log(await ask("turn-1", "Order 4821, the red Marin bike, arrived without pedals."));
console.log(await ask("turn-2", "Remind me: which order was that and what was missing?"));
