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
  const results = await Promise.all(files.map((name) =>
    fleet.exec(name, `node --test --test-reporter=tap test/${name}.test.js`),
  ));
  for (const [index, result] of results.entries()) {
    console.log(`${files[index]}: ${result.exitCode === 0 ? "pass" : "FAIL"}`);
    for (const line of result.stdout.split("\n")) {
      if (line.startsWith("not ok ")) console.log(line);
    }
  }
  console.log(`${Math.round(performance.now() - started)} ms for all five`);
} finally {
  await fleet.delete();
}
