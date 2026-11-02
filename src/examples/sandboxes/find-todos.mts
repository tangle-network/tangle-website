import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Search the whole workspace without an agent. Matches stream back as they are found.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
});
try {
  for await (const hit of box.search("TODO", { glob: "**/*.js" })) {
    console.log(`${hit.path}:${hit.line}  ${hit.text.trim()}`);
  }
} finally {
  await box.delete();
}
