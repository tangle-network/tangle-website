import { createE2BProvider } from "@tangle-network/agent-provider-e2b";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const sh = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// E2B runs the command; the template must have claude installed and logged in.
const provider = createE2BProvider({
  turnCommand: ({ prompt }) => `cd sandbox-demo && claude -p ${sh(prompt ?? "")}`,
});

const client = providerAsSandboxClient(provider);

const box = await client.create({ environment: "claude-code" }); // the E2B template
try {
  await box.exec("git clone https://github.com/tangle-network/sandbox-demo");
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task, { timeoutMs: 300_000 })) {
    if (event.type === "result") console.log(event.data.finalText || event.data.stderr);
  }
} finally {
  await box.delete();
}
