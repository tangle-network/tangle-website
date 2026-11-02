import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// The agent edits. You read what changed, run the tests, and commit.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
  backend: { type: "codex" },
});
try {
  const run = await box.prompt("The test tagged null-guard fails. Fix the cause.");
  if (!run.success) throw new Error(run.error);

  console.log((await box.exec("git status --short")).stdout.trim());
  const tests = await box.exec("npm test -- --test-name-pattern=null-guard");
  if (tests.exitCode !== 0) throw new Error("The test still fails.");

  await box.exec('git -c user.name=Codex -c user.email=codex@tangle.tools commit -am "fix: guard a null request body"');
  console.log((await box.exec("git log --oneline -1")).stdout.trim());
} finally {
  await box.delete();
}
