import { Sandbox } from "@tangle-network/sandbox";
import { defineAgentEval, type Scenario } from "@tangle-network/agent-eval/contract";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Same cases, same harness, same judge. Only the model changes.
const evalKit = defineAgentEval<Scenario & { task: string }, number>({
  scenarios: [
    { id: "cli-flag", kind: "fix", task: "The test tagged cli-flag fails." },
    { id: "null-guard", kind: "fix", task: "The test tagged null-guard fails." },
    { id: "timezone", kind: "fix", task: "The test tagged timezone fails." },
  ],
  baselineSurface: "glm-5.3",
  agent: async (model, scenario) => {
    const box = await client.create({
      git: { url: "https://github.com/tangle-network/sandbox-demo" },
      backend: { type: "opencode", model: { model: String(model) } },
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
  expectUsage: "off", // the sandbox meters each turn itself
});

for (const model of ["glm-5.3", "deepseek-v4-flash"]) {
  const result = await evalKit.evaluate({ surface: model });
  console.log(model, result.aggregates.byJudge.suite?.mean);
}
