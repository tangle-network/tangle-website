import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Each agent names its own model. Cheap ones for reading, a stronger one for the fix.
const fleet = await client.fleets.create({
  agents: [
    { agentId: "imports", model: "deepseek/deepseek-v4.1-flash", task: "List unused imports as file:line, or none." },
    { agentId: "docs", model: "deepseek/deepseek-v4.1-flash", task: "Write one paragraph per package into PACKAGES.md." },
    { agentId: "fix", model: "glm-5.3", task: "The test tagged timezone fails. Fix the cause; keep every other test green." },
  ],
  placement: "dedicated",
  defaults: {
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "opencode" },
  },
  budgetUsd: 2,
});
try {
  for (const r of await fleet.runAll()) {
    console.log(r.agentId, r.model, r.status, `$${(r.costUsd ?? 0).toFixed(3)}`, `${Math.round(r.durationMs / 1000)} s`);
  }
  console.log(await fleet.spend());
} finally {
  await fleet.delete();
}
