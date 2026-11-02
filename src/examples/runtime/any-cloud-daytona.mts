import { createDaytonaProvider } from "@tangle-network/agent-provider-daytona";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const sh = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// Daytona runs the command; the snapshot must have claude installed and logged in.
const provider = createDaytonaProvider({
  turnCommand: ({ prompt }) => `cd sandbox-demo && claude -p ${sh(prompt ?? "")}`,
});

const client = providerAsSandboxClient(provider);

const box = await client.create({ environment: "claude-code" }); // the Daytona snapshot
try {
  await box.exec("git clone https://github.com/tangle-network/sandbox-demo");
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task, { timeoutMs: 300_000 })) {
    if (event.type === "result") console.log(event.data.finalText || event.data.stderr);
  }
} finally {
  await box.delete();
}
