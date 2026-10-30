import { Sandbox } from "@tangle-network/sandbox";

// One key. The Router serves the model; the sandbox runs what it wrote.
const apiKey = process.env.TANGLE_API_KEY!;
const client = new Sandbox({ apiKey, baseUrl: "https://sandbox.tangle.tools" });

export async function answer(question: string) {
  const reply = await fetch("https://router.tangle.tools/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "glm-5.3",
      messages: [{ role: "user", content: `Reply with one bash command, nothing else: ${question}` }],
    }),
  });
  const { model, choices } = await reply.json();
  const command: string = choices[0].message.content.trim();

  const box = await client.create({ git: { url: "https://github.com/your-org/your-repo" } });
  try {
    const { stdout } = await box.exec(command);
    return { servedModel: model, command, stdout };
  } finally {
    await box.delete();
  }
}

console.log(await answer("How many TypeScript files are under src?"));
