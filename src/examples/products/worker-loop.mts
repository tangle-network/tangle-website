import { Sandbox, openaiTools } from "@tangle-network/sandbox/agent";

const apiKey = process.env.TANGLE_API_KEY!;
const client = new Sandbox({ apiKey, baseUrl: "https://sandbox.tangle.tools" });

// Your loop, any Router model, and the sandbox as its tools:
// exec, read, write, search and run code.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
});
const { tools, handleAssistantMessage } = openaiTools(box);
const messages: unknown[] = [
  {
    role: "user",
    content: "Find the slowest test. Make it faster without changing what it checks.",
  },
];
try {
  for (let step = 0; step < 40; step++) {
    const reply = await fetch("https://router.tangle.tools/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "glm-5.3", messages, tools }),
    });
    const { message } = (await reply.json()).choices[0];
    messages.push(message);
    if (!message.tool_calls?.length) {
      console.log(message.content);
      break;
    }
    messages.push(...(await handleAssistantMessage(message)));
  }
} finally {
  await box.delete();
}
