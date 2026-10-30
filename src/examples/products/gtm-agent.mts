import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// npx tsx gtm-agent.mts stripe.com
const company = process.argv[2] ?? "tangle.tools";

// No sandbox to manage: the Platform picks where the run executes and says why.
const run = await client.run({
  profile: {
    name: "gtm-research",
    prompt: {
      systemPrompt: "Research a company before outreach. Quote a page for each claim.",
    },
  },
  prompt: `Read ${company}. Give three facts a seller should know and one opener.`,
  http: { hosts: [company, `www.${company}`] },
  model: "glm-5.3",
});
console.log(run.placement?.chosen, run.placement?.reason);
console.log(run.text);
console.log(`$${run.costUsd ?? 0}`);
