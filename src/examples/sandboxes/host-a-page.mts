import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Anything listening on a port gets a public URL.
const box = await client.create();
try {
  const server = await box.process.spawn(
    `node -e "require('http').createServer((q, s) => s.end('<h1>Served from a sandbox</h1>')).listen(3000)"`,
  );
  const link = await box.previewLinks.create(3000);
  const { url } = await box.previewLinks.waitUntilReady(link.previewId);
  console.log(url);

  const page = await fetch(url);
  console.log(page.status, await page.text());
  await server.kill();
} finally {
  await box.delete();
}
