import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// The agent installs and drives a real browser inside its own machine.
const box = await client.create({
  backend: { type: "claude-code" },
  resources: { cpuCores: 2, memoryMB: 4096 },
});
try {
  const run = await box.prompt(
    "Install Playwright with Chromium. Open https://news.ycombinator.com, " +
      "save a full page screenshot to front.png, and write the five top " +
      "story titles to top.json as a JSON array of strings.",
  );
  if (!run.success) throw new Error(run.error);

  console.log(JSON.parse(await box.read("top.json")));
  await box.fs.download("front.png", "front.png");
} finally {
  await box.delete();
}
