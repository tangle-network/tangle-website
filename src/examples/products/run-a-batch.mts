import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// A queue of tasks, one call. The Platform provisions, runs, retries and cleans up.
const tickets = [
  "Customer says the export button does nothing in Safari.",
  "Invoice PDF shows the wrong currency symbol for CHF.",
  "Password reset email arrives twice.",
  "Dashboard is slow with more than 500 projects.",
];
const batch = await client.runBatch({
  tasks: tickets.map((ticket, i) => ({
    id: `ticket-${i + 1}`,
    message: `Classify this bug report as frontend, backend or email, and name its severity 1-3: ${ticket}`,
  })),
  backends: [{ id: "glm", type: "opencode", model: { model: "glm-5.3" } }],
});
for (const r of batch.results) console.log(r.taskId, r.success ? r.resultSummary : r.error);
console.log(`${batch.totalSuccess}/${batch.totalTasks} done, ${batch.totalRetries} retries`);
