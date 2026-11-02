import { createChatClient, llmJudge } from "@tangle-network/agent-eval/contract";

// A rubric judge on the Router. No sandbox: it scores text you already have.
const judge = llmJudge("support", "Score this reply to the customer's message against the policy.", {
  chat: createChatClient({
    transport: "openai-compatible",
    baseUrl: "https://router.tangle.tools/v1",
    apiKey: process.env.TANGLE_API_KEY!,
    defaultModel: "glm-5.3",
  }),
  dimensions: [
    { key: "answers", description: "Answers the question the customer asked" },
    { key: "honest", description: "Promises nothing the policy does not allow" },
  ],
});

const message = "My order arrived broken. Can I get a refund?";
const policy = "Refund within 30 days of delivery, with a photo of the damage.";
const replies = [
  "Sorry about that. Send a photo of the damage and we refund you; it has to be within 30 days of delivery.",
  "Refunds are not possible, but here is 10% off your next order.",
  "Thanks for reaching out! We value your feedback and will look into it.",
];
for (const reply of replies) {
  const score = await judge.score({
    artifact: { message, policy, reply },
    scenario: { id: "refund", kind: "support" },
    signal: AbortSignal.timeout(60_000),
  });
  console.log(score.composite.toFixed(2), score.dimensions, reply.slice(0, 48));
}
