import { readFile } from "node:fs/promises";
import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Each customer gets one isolated sandbox. The platform keeps it,
// resumes it, and replaces it if it stops starting.
export async function review(customerId: string, turnId: string, contract: string) {
  const instance = await client.instances.ensure({
    key: `customer:${customerId}`,
    profile: {
      version: "contracts-v1",
      backend: {
        type: "opencode",
        profile: {
          name: "contract-review",
          prompt: {
            systemPrompt: "You review contracts. Cite the clause for every finding.",
          },
        },
      },
    },
    create: { resources: { cpuCores: 1, memoryMB: 2048, diskGB: 10 } },
  });
  await instance.box.write("contracts/msa.md", contract);
  const ask = "Review contracts/msa.md. List the indemnity, liability and termination risks.";
  let turn = await instance.turn(ask, { thread: "main", turnId });
  // The turn keeps running in the sandbox; asking with the same turnId settles it.
  while (turn.state === "running") {
    await new Promise((wait) => setTimeout(wait, 3_000));
    turn = await instance.turn(ask, { thread: "main", turnId });
  }
  return turn.state === "completed" ? turn.text : turn.state;
}

console.log(await review("acme", "review-1", await readFile("msa.md", "utf8")));
