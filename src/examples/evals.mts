import { Sandbox } from "@tangle-network/sandbox";
import { defineAgentEval, type Scenario } from "@tangle-network/agent-eval/contract";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Two cases, a fresh sandbox per case, and the test suite as the judge.
const evalKit = defineAgentEval<Scenario & { task: string }, number>({
  scenarios: [
    { id: "cli-flag", kind: "fix", task: "The test tagged cli-flag fails." },
    { id: "null-guard", kind: "fix", task: "The test tagged null-guard fails." },
  ],
  baselineSurface: "Fix the cause.",
  agent: async (surface, scenario) => {
    const box = await client.create({
      git: { url: "https://github.com/your-org/your-repo" },
      backend: { type: "claude-code" },
    });
    try {
      await box.prompt(`${scenario.task} ${String(surface)}`);
      return (await box.exec("npm test")).exitCode;
    } finally {
      await box.delete();
    }
  },
  judge: {
    name: "suite",
    dimensions: [{ key: "pass", description: "npm test exits 0 after the turn" }],
    score: ({ artifact }) => {
      const pass = artifact === 0 ? 1 : 0;
      return { dimensions: { pass }, composite: pass, notes: "" };
    },
  },
  expectUsage: "off", // the sandbox meters each turn itself
});

const baseline = await evalKit.evaluate();
const candidate = await evalKit.evaluate({
  surface: "Fix the cause. Change only what the failing test needs.",
});
console.log("baseline", baseline.aggregates.byJudge.suite?.mean);
console.log("candidate", candidate.aggregates.byJudge.suite?.mean);
