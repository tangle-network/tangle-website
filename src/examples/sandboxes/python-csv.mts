import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// Python is installed. runCode returns what the code printed.
const box = await client.create();
try {
  await box.write("/home/agent/orders.csv", [
    "customer,amount",
    "acme,1200",
    "globex,950",
    "acme,300",
    "initech,80",
    "globex,410",
  ].join("\n"));
  const run = await box.runCode("python", `
import csv, json
from collections import defaultdict
totals = defaultdict(float)
for row in csv.DictReader(open("/home/agent/orders.csv")):
    totals[row["customer"]] += float(row["amount"])
print(json.dumps(sorted(totals.items(), key=lambda kv: -kv[1])))
`);
  console.log(run.exitCode, JSON.parse(run.stdout));
} finally {
  await box.delete();
}
