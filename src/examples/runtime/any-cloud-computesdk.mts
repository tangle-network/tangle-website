import { e2b } from "@computesdk/e2b";
import { createComputeSdkProvider } from "@tangle-network/agent-provider-computesdk";
import { providerAsSandboxClient } from "@tangle-network/agent-runtime/kernel";
import { compute } from "computesdk";

const sh = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// ComputeSDK sends each sandbox to the cloud you configure. This file uses E2B.
compute.setConfig({ provider: e2b({ apiKey: process.env.E2B_API_KEY }) });

// The ComputeSDK adapter runs this command in the sandbox and nothing else: it
// does not install claude-code, read the profile's harness, report cost or pass
// on a timeout (E2B's 60 s default applies). The template needs the claude CLI
// installed and logged in.
const provider = createComputeSdkProvider({
  compute,
  mapCreateInput: () => ({ templateId: "claude-code" }), // the E2B template
  turnCommand: ({ prompt }) => `cd sandbox-demo && claude -p ${sh(prompt ?? "")}`,
});

// The client wants a profile; this adapter ignores it.
const client = providerAsSandboxClient(provider, {
  defaults: { profile: { name: "repo-reader", harness: "claude-code" } },
});

const box = await client.create();
try {
  await box.exec("git clone https://github.com/tangle-network/sandbox-demo"); // a command, not the git option
  const task = "Read this repository. In two sentences, say what it does.";
  for await (const event of box.streamPrompt(task)) {
    if (event.type === "result") console.log(event.data.finalText || event.data.stderr);
  }
} finally {
  await box.delete();
}
