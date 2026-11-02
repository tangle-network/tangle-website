import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// A snapshot is the whole disk. Revert to it and the damage is gone.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
});
try {
  const clean = await box.snapshot({ tags: ["clean"] });

  await box.exec("rm -rf packages test");
  console.log("after", (await box.exec("ls")).stdout.trim().split("\n"));

  await box.revertToSnapshot(clean.snapshotId);
  console.log("reverted", (await box.exec("ls")).stdout.trim().split("\n"));
  console.log((await box.exec("npm test 2>&1 | grep -c '^ok'")).stdout.trim(), "tests pass again");
} finally {
  await box.delete();
}
