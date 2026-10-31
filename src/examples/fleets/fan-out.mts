import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// One reviewer per package, all at once. Findings arrive as each agent ends.
const packages = ["api", "web", "worker", "cli", "shared"];
const fleet = await client.fleets.create({
  agents: packages.map((name) => ({
    agentId: name,
    task: `Review packages/${name} for unhandled promise rejections. ` +
      "Answer file:line per finding, or none.",
  })),
  placement: "dedicated",
  defaults: {
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "codex" },
  },
  budgetUsd: 3,
});
try {
  const findings: Record<string, string> = {};
  for await (const event of fleet.run()) {
    if (event.type === "agent.started") console.log("started", event.agentId);
    if (event.type === "agent.finished") {
      const { agentId, result, status } = event.result;
      findings[agentId] = result?.response ?? status;
    }
    if (event.type === "fleet.finished") console.log(event.durationMs, event.spend);
  }
  console.table(findings);
} finally {
  await fleet.delete();
}
