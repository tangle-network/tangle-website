import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// The agent installs and drives a real browser inside its own machine.
const box = await client.create({
  backend: { type: "claude-code" },
  resources: { cpuCores: 2, memoryMB: 4096 },
  // The default allowlist, plus the browser download and the one site it reads.
  egressPolicy: {
    mode: "strict",
    includeImplicitDomains: true,
    allowDomains: ["cdn.playwright.dev", "playwright.download.prss.microsoft.com", "news.ycombinator.com"],
  },
});
try {
  const run = await box.prompt(
    "Install Playwright with Chromium. Open https://news.ycombinator.com, " +
      "save a full page screenshot to /home/agent/front.png, and write the five " +
      "top story titles to /home/agent/top.json as a JSON array of strings.",
  );
  if (!run.success) throw new Error(run.error);

  console.log(JSON.parse(await box.read("/home/agent/top.json")));
  await box.fs.download("/home/agent/front.png", "front.png");
} finally {
  await box.delete();
}
