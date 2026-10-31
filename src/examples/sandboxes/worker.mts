import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Start:   npx tsx worker.mts
// Collect: npx tsx worker.mts <sandboxId> <executionId>  (any process, any time)
const [sandboxId, executionId] = process.argv.slice(2);
const sessionId = "upgrade-deps";

if (!sandboxId) {
  const box = await client.create({
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "codex" },
    maxLifetimeSeconds: 8 * 3600,
  });
  const run = await box.dispatchPrompt(
    "Upgrade each dependency one at a time. Run the tests after each " +
      "upgrade and revert any that breaks them.",
    { sessionId },
  );
  console.log(`npx tsx worker.mts ${box.id} ${run.executionId}`);
} else {
  const box = await client.get(sandboxId);
  if (!box) throw new Error(`Sandbox ${sandboxId} is gone.`);
  const result = await box.session(sessionId).result({ executionId });
  console.log(result.status, result.response);
  await box.delete();
}
