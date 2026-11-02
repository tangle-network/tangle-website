import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Each child starts as a copy of the parent, files and memory included.
const parent = await client.create();
try {
  await parent.exec("echo 'shared setup' > base.txt");
  const [a, b] = await parent.branch(2);
  try {
    await a.exec("echo 'child a' >> base.txt");
    await b.exec("echo 'child b' >> base.txt");
    for (const child of [a, b]) {
      const { stdout } = await child.exec("cat base.txt");
      console.log(child.id, stdout.trim().split("\n"));
    }
  } finally {
    await Promise.all([a.delete(), b.delete()]);
  }
} finally {
  await parent.delete();
}
