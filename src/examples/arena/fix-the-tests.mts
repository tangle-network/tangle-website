import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// One task, one model, one repository, one sandbox per harness, all at once.
const task = "`npm test` fails. Find the cause and fix it.";
const harnesses = ["claude-code", "codex", "opencode", "pi", "kimi-code", "hermes", "openclaw", "nanoclaw", "prime"] as const;

async function attempt(harness: (typeof harnesses)[number]) {
  const box = await client.create({
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: harness },
  });
  try {
    const before = await box.exec("npm test");
    const run = await box.prompt(task, { model: "zai/glm-5.3", timeoutMs: 600_000 });
    // The test suite decides, not the agent's own report.
    const after = await box.exec("npm test");
    const diff = await box.exec("git diff");
    return { harness, before: before.exitCode, after: after.exitCode, costUsd: run.costUsd, diff: diff.stdout };
  } finally {
    await box.delete();
  }
}

const results = await Promise.allSettled(harnesses.map(attempt));
results.forEach((result, i) => console.log(harnesses[i], result.status === "fulfilled"
  ? `tests ${result.value.after === 0 ? "pass" : "fail"}, $${result.value.costUsd}` : `error: ${result.reason}`));
