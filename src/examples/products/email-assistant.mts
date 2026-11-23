import { createHostedAgent } from "@tangle-network/agent-app/hosted-agent";

// https://github.com/tangle-network/agent-app/tree/main/examples/hosted-agent
const { TANGLE_API_KEY, OWNER_ADDRESS, CONNECTION_ID, EMAIL_ADDRESS, TANGLE_MODEL } = process.env;
if (!TANGLE_API_KEY || !OWNER_ADDRESS || !CONNECTION_ID || !EMAIL_ADDRESS || !TANGLE_MODEL) {
  throw new Error("Supply your Tangle key, owner, email connection, mailbox and model.");
}

const assistant = createHostedAgent({
  apiKey: TANGLE_API_KEY,
  owner: OWNER_ADDRESS,
  sandboxUrl: "https://sandbox.tangle.tools",
  harness: "opencode",
  profile: {
    name: "Fieldnotes",
    model: { default: TANGLE_MODEL },
    prompt: { systemPrompt: "Keep project notes in /workspace/memory.md and consult them when answering." },
  },
});

const line = await assistant.attachLine(CONNECTION_ID, {
  transport: "email",
  mode: "personal",
  address: EMAIL_ADDRESS,
});
console.log(line);
