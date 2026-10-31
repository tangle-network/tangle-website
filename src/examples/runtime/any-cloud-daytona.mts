import { createDaytonaProvider } from "@tangle-network/agent-provider-daytona";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const sh = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// The Daytona adapter runs this command in the sandbox and nothing else: it
// does not install claude-code, read the profile's harness or report cost. The
// snapshot needs the claude CLI installed and logged in.
const provider = createDaytonaProvider({
  turnCommand: ({ prompt }) => `cd sandbox-demo && claude -p ${sh(prompt ?? "")}`,
});

// The client wants a profile; this adapter ignores it.
const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "repo-reader", harness: "claude-code" } },
});

const box = await client.create({ environment: "claude-code" }); // the Daytona snapshot
try {
  // Cloning is a command here: the git create option does not clone.
  await box.exec("git clone https://github.com/tangle-network/sandbox-demo");
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task, { timeoutMs: 300_000 })) {
    if (event.type === "result") console.log(event.data.finalText || event.data.stderr);
  }
} finally {
  await box.delete();
}
