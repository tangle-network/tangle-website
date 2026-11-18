import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Claude Code harness, DeepSeek V4.1 Flash. The Platform refuses any charge past $2; this script stops everyone at $0.20.
const ideas = ["a lookup table", "a streaming parser", "fewer allocations",
  "worker threads", "WebAssembly", "a hand written tokenizer"];
const fleet = await client.fleets.create({
  agents: ideas.map((idea) => ({
    task: `Make bench/parse.js faster with ${idea}. Report the speedup.`,
  })),
  placement: "dedicated",
  defaults: {
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "claude-code", model: { model: "deepseek/deepseek-v4.1-flash" } },
  },
  budgetUsd: 2,
});

const softCapUsd = 0.2;
async function checkSpend() {
  const { spentUsd } = await fleet.spend();
  if (spentUsd < softCapUsd) return;
  clearInterval(watch);
  const { interrupted } = await fleet.cancel();
  console.log(`$${spentUsd.toFixed(2)} spent, ${interrupted} agents stopped`);
}
const watch = setInterval(() => void checkSpend().catch(console.error), 5_000);

try {
  const results = await fleet.runAll();
  // status: completed, cancelled or budget_exhausted
  for (const r of results) console.log(r.agentId, r.status, r.costUsd);
} finally {
  clearInterval(watch);
  await fleet.delete();
}
