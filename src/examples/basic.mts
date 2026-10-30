import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

const box = await client.create({
  git: { url: "https://github.com/your-org/your-repo" },
  backend: { type: "claude-code" }, // or "codex", "opencode", "pi"
});
try {
  const run = await box.prompt("`npm test` fails. Find the cause and fix it.");
  if (!run.success) throw new Error(run.error);

  // A finished turn is not a finished task: check the result yourself.
  const tests = await box.exec("npm test");
  console.log(tests.exitCode === 0 ? "tests pass" : "tests still fail");
  console.log((await box.exec("git diff --stat")).stdout);
  console.log(run.usage, run.costUsd); // metered per turn
} finally {
  await box.delete();
}
