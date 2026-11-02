import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Stopped: the disk stays and is all you pay for. Resumed: every file is there.
const box = await client.create();
try {
  await box.exec("echo 'first draft' > notes.md");
  await box.stop();
  await box.resume();
  const { stdout } = await box.exec("cat notes.md");
  console.log(stdout.trim());
} finally {
  await box.delete();
}
