import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Each tool call shows up as the agent makes it. The answer arrives last.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
  backend: { type: "claude-code" },
});
try {
  const seen = new Set<string>();
  for await (const { type, data } of box.streamPrompt("The test tagged timezone fails. Fix the cause.")) {
    const part = data.part as { id: string; type: string; tool?: string; state?: { input?: unknown } } | undefined;
    if (type === "message.part.updated" && part?.type === "tool" && !seen.has(part.id)) {
      seen.add(part.id);
      console.log(`${seen.size}.`, part.tool, JSON.stringify(part.state?.input ?? "").slice(0, 70));
    }
    if (type === "result") console.log("\n" + data.finalText);
  }
} finally {
  await box.delete();
}
