import { Sandbox } from "@tangle-network/sandbox";
import { createChatClient, llmJudge } from "@tangle-network/agent-eval/contract";

const apiKey = process.env.TANGLE_API_KEY!;
const client = new Sandbox({ apiKey, baseUrl: "https://sandbox.tangle.tools" });

// A model judge on the Router reads the answer and every tool call.
const judge = llmJudge("trace-review", "Score this agent run against its task.", {
  chat: createChatClient({
    transport: "openai-compatible",
    baseUrl: "https://router.tangle.tools/v1",
    apiKey,
    defaultModel: "glm-5.3",
  }),
  dimensions: [
    { key: "grounded", description: "Every file and line it names exists" },
    { key: "economical", description: "No tool call repeats earlier work" },
  ],
});

const task = "List each place the API validates a request body, as file:line.";
const box = await client.create({
  git: { url: "https://github.com/your-org/your-repo" },
  backend: { type: "claude-code" },
});
try {
  const run = await box.prompt(task);
  const score = await judge.score({
    artifact: { task, answer: run.response, tools: run.toolInvocations },
    scenario: { id: "body-validation", kind: "trace" },
    signal: AbortSignal.timeout(120_000),
  });
  console.log(run.traceId, score.dimensions, score.notes);
} finally {
  await box.delete();
}
