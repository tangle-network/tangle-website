import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

const box = await client.create({ backend: { type: "claude-code" } });
try {
  const run = await box.prompt("Build a small to-do list web app in plain Node, no dependencies. Start it on port 3000 and keep it running after you finish.");
  if (!run.success) throw new Error(run.error);

  const link = await box.previewLinks.create(3000);
  const { url } = await box.previewLinks.waitUntilReady(link.previewId);
  console.log(url);

  const page = await fetch(url);
  console.log(page.status, (await page.text()).match(/<title>(.*?)<\/title>/)?.[1]);
} finally {
  await box.delete();
}
