import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Four agents, each with its own task, under one budget the Platform enforces.
const fleet = await client.fleets.create({
  agents: [
    { agentId: "tests", task: "List the three slowest tests and why." },
    { agentId: "todos", task: "Find every TODO and group them by file." },
    { agentId: "deps", task: "Say what each dependency is used for." },
    { agentId: "entry", task: "Name the entry point and the modules it loads." },
  ],
  placement: { agentsPerSandbox: 4 },
  defaults: {
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "opencode", model: { model: "glm-5.3" } },
    maxLifetimeSeconds: 900,
  },
  budgetUsd: 1, // a charge past this is refused, mid-turn included
});
try {
  const results = await fleet.runAll();
  for (const r of results) console.log(r.agentId, r.status, r.result?.response);
  console.log(await fleet.spend()); // { capUsd, spentUsd, remainingUsd, ... }
} finally {
  await fleet.delete();
}
