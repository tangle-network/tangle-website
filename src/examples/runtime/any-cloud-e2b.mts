import { createE2BProvider } from "@tangle-network/agent-provider-e2b";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";

const sh = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// The E2B adapter runs this command in the sandbox and nothing else: it does not
// install claude-code, read the profile's harness or report cost. The template
// needs the claude CLI installed and logged in.
const provider = createE2BProvider({
  turnCommand: ({ prompt }) => `cd sandbox-demo && claude -p ${sh(prompt ?? "")}`,
});

// The client wants a profile; this adapter ignores it.
const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "repo-reader", harness: "claude-code" } },
});

const box = await client.create({ environment: "claude-code" }); // the E2B template
try {
  await box.exec("git clone https://github.com/tangle-network/sandbox-demo"); // a command, not the git option
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task, { timeoutMs: 300_000 })) {
    if (event.type === "result") console.log(event.data.finalText || event.data.stderr);
  }
} finally {
  await box.delete();
}
