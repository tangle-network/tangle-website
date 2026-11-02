import { writeFile } from "node:fs/promises";
import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// One agent per language. Their files come back through the fleet.
const languages = { de: "German", fr: "French", ja: "Japanese", pt: "Portuguese", es: "Spanish" };
const fleet = await client.fleets.create({
  agents: Object.entries(languages).map(([code, name]) => ({
    agentId: code,
    task: `Translate README.md into ${name} and write it to README.${code}.md. Change nothing else.`,
  })),
  placement: "dedicated",
  defaults: {
    git: { url: "https://github.com/tangle-network/sandbox-demo" },
    backend: { type: "opencode", model: { model: "glm-5.3" } },
  },
  budgetUsd: 2,
});
try {
  await fleet.runAll();
  const files = await fleet.collectArtifacts(
    fleet.agents.map((a) => ({ machineId: a.machineId, path: `/home/agent/sandbox-demo/README.${a.agentId}.md`, label: a.agentId })),
  );
  for (const file of files) {
    await writeFile(`README.${file.label}.md`, file.content);
    console.log(file.label, file.content.split("\n")[0]);
  }
} finally {
  await fleet.delete();
}
