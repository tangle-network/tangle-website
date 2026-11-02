import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Each turn reports its tokens and model cost; the Platform reports what the
// sandbox has cost in total. Price it and pass it on.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
  backend: { type: "opencode", model: { model: "glm-5.3" } },
});
try {
  const run = await box.prompt("What does packages/worker/src/queue.js do? Two sentences.");
  console.log(run.response);
  console.log(run.usage, `model $${run.costUsd?.toFixed(4)}`);

  const charged = await client.fleets.sandboxChargeUsd(box.id);
  const margin = 1.25;
  console.log(`sandbox so far $${charged.toFixed(4)}, invoice $${(charged * margin).toFixed(4)}`);
} finally {
  await box.delete();
}
