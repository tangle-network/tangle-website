import { Sandbox } from "@tangle-network/sandbox";
import { defineAgentEval, type Scenario } from "@tangle-network/agent-eval/contract";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Run in CI: the build fails when the new prompt scores below the shipped one.
const shipped = "Fix the cause.";
const candidate =
  process.env.CANDIDATE_PROMPT ?? "Fix the cause. Change only what the test needs.";

const evalKit = defineAgentEval<Scenario & { task: string }, number>({
  scenarios: [
    { id: "cli-flag", kind: "fix", task: "The test tagged cli-flag fails." },
    { id: "null-guard", kind: "fix", task: "The test tagged null-guard fails." },
  ],
  baselineSurface: shipped,
  agent: async (prompt, scenario) => {
    const box = await client.create({
      git: { url: "https://github.com/tangle-network/sandbox-demo" },
      backend: { type: "claude-code" },
    });
    try {
      await box.prompt(`${scenario.task} ${String(prompt)}`);
      return (await box.exec(`npm test -- --test-name-pattern=${scenario.id}`)).exitCode;
    } finally {
      await box.delete();
    }
  },
  judge: {
    name: "suite",
    dimensions: [{ key: "pass", description: "the tagged test passes after the turn" }],
    score: ({ artifact }) => {
      const pass = artifact === 0 ? 1 : 0;
      return { dimensions: { pass }, composite: pass, notes: "" };
    },
  },
  expectUsage: "off",
});

const score = async (surface: string) =>
  (await evalKit.evaluate({ surface })).aggregates.byJudge.suite?.mean ?? 0;
const before = await score(shipped);
const after = await score(candidate);
console.log({ shipped: before, candidate: after });
if (after < before) {
  console.error("Regression: the candidate passes fewer cases.");
  process.exit(1);
}
