import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// No agents: five machines, one test file each, all at once.
const files = ["cli", "dates", "format", "primes", "validate"];
const fleet = await client.fleets.create({
  machines: files.map((name) => ({ machineId: name })),
  defaults: { git: { url: "https://github.com/tangle-network/sandbox-demo" } },
});
try {
  const started = performance.now();
  const results = await Promise.all(files.map((name) => fleet.exec(name, `node --test test/${name}.test.js 2>&1 | tail -4`)));
  files.forEach((name, i) => console.log(name, results[i].exitCode === 0 ? "pass" : "FAIL", results[i].stdout.trim().split("\n").at(-1)));
  console.log(`${Math.round(performance.now() - started)} ms for all five`);
} finally {
  await fleet.delete();
}
