import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Every turn is traced. Intelligence reads the trace and reports what the agent did.
const box = await client.create({
  git: { url: "https://github.com/tangle-network/sandbox-demo" },
  backend: { type: "claude-code" },
});
try {
  const run = await box.prompt("The test tagged timezone fails. Fix the cause.");
  console.log(run.success, run.toolInvocations?.length, "tool calls");

  const job = await client.intelligence.createReport({
    subject: { type: "sandbox", id: box.id },
    mode: "deterministic",
  });
  const report = await client.intelligence.waitForReport(job.jobId, { timeoutMs: 180_000 });
  console.log(report.status, report.billing.costUsd);
  console.log(JSON.stringify(report.result, null, 2));
} finally {
  await box.delete();
}
