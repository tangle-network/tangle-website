import { Sandbox } from "@tangle-network/sandbox";
import { defineAgentEval, type Scenario } from "@tangle-network/agent-eval/contract";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Same model, same cases, same judge. Only the coding agent changes.
const evalKit = defineAgentEval<Scenario & { task: string }, number>({
  scenarios: [
    { id: "cli-flag", kind: "fix", task: "The test tagged cli-flag fails." },
    { id: "null-guard", kind: "fix", task: "The test tagged null-guard fails." },
    { id: "timezone", kind: "fix", task: "The test tagged timezone fails." },
  ],
  baselineSurface: "claude-code",
  agent: async (harness, scenario) => {
    const box = await client.create({
      git: { url: "https://github.com/tangle-network/sandbox-demo" },
      backend: { type: harness as "claude-code" | "codex", model: { model: "glm-5.3" } },
    });
    try {
      await box.prompt(`${scenario.task} Fix the cause.`);
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

for (const harness of ["claude-code", "codex"]) {
  const result = await evalKit.evaluate({ surface: harness });
  console.log(harness, result.aggregates.byJudge.suite?.mean);
}
