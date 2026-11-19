const { TANGLE_API_KEY, TANGLE_MODEL } = process.env;
if (!TANGLE_API_KEY || !TANGLE_MODEL) throw new Error("Set your Router key and a model available to it.");

const response = await fetch("https://router.tangle.tools/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TANGLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: TANGLE_MODEL,
    require_model: true,
    messages: [{ role: "user", content: "What is a sandbox snapshot? Answer in one sentence." }],
    max_tokens: 160,
  }),
});
if (!response.ok) throw new Error(`Router returned HTTP ${response.status}: ${await response.text()}`);

const completion = await response.json();
console.log(completion.choices[0].message.content);
