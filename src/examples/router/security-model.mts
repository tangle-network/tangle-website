const apiKey = process.env.TANGLE_API_KEY;
const modelId = process.env.TANGLE_MODEL;
if (!apiKey) throw new Error("Set TANGLE_API_KEY to your capped Router key.");

const baseUrl = "https://router.tangle.tools/v1";
const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
const catalog = await fetch(`${baseUrl}/models/user?availability=available`, {
  headers, signal: AbortSignal.timeout(15_000),
});
if (!catalog.ok) throw new Error(`Catalog HTTP ${catalog.status}: ${await catalog.text()}`);
type Model = {
  id: string; routeable?: boolean; availability: { status: string };
  pricing: { prompt: string; completion: string };
  seller?: { uncensored?: boolean; cybersecurity?: boolean };
};
const { data, pricing_policy } = await catalog.json() as { data: Model[]; pricing_policy: unknown };
const models = data.filter((m) => m.routeable === true && m.availability.status === "available"
  && (m.id.startsWith("abliterated/") || m.seller?.uncensored || m.seller?.cybersecurity));
console.table(models.map((m) => ({
  model: m.id, listedInputUsdPerToken: m.pricing.prompt, listedOutputUsdPerToken: m.pricing.completion,
})));
console.log("Pricing policy", pricing_policy);
const model = models.find((m) => m.id === modelId);
if (!model) throw new Error("Set TANGLE_MODEL to an available security model listed for your key.");

const reply = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST", headers, signal: AbortSignal.timeout(90_000),
  body: JSON.stringify({
    model: model.id, require_model: true, max_tokens: 1024,
    messages: [{ role: "user", content: "Give a short checklist for reviewing a file-download API for path traversal. Include a safe validation pattern." }],
  }),
});
if (!reply.ok) throw new Error(`Inference HTTP ${reply.status}: ${await reply.text()}`);
const result = await reply.json();
if (reply.headers.get("X-Tangle-Served-Model") !== model.id) throw new Error("Model identity mismatch.");
const choice = result.choices?.[0];
if (choice?.finish_reason !== "stop" || !choice.message?.content) throw new Error("Incomplete answer.");
console.log(model.id, result.usage, choice.message.content);
