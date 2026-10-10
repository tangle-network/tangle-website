---
name: tangle-setup
description: Choose the right Tangle product for this agent's task and set it up end to end: one owner approval, one scoped API key that works across every approved Tangle product, then the product's own setup skill.
---

# Set up Tangle

Tangle is an infrastructure company for AI agents. Its products share one signup and one key, so this hub skill does two things: it picks the product your task needs, and it gets you the key every product accepts. Product-specific install, first call and verification live in each product's own setup skill.

## 1. Choose the product

| If you need to... | Product | Do this |
| --- | --- | --- |
| Run generated or untrusted code in an isolated Linux machine with files, a terminal, snapshots and preview URLs | Tangle Sandbox | Fetch https://sandbox.tangle.tools/agent-setup.md and follow it |
| Call language, embedding, image or speech models behind one OpenAI-compatible endpoint, with per-request price headers | Tangle Router | Fetch https://router.tangle.tools/agent-setup.md and follow it |
| Build, publish or drive a domain agent workspace; a Forge assistant configures each agent from conversation | Tangle Agent Builder | Fetch https://agents.tangle.tools/agent-setup.md and follow it |
| Do go-to-market work: market and competitor research, content drafting and scheduling, lead follow-up | Tangle GTM Agent | Fetch https://gtm.tangle.tools/agent-setup.md and follow it |
| Review contracts, draft legal documents and filings, track compliance deadlines | Tangle Legal Agent | Fetch https://legal.tangle.tools/agent-setup.md and follow it |
| Produce campaign concepts, copy, images, video or design in a brand's workspace | Tangle Creative Agent | Fetch https://creative.tangle.tools/agent-setup.md and follow it |
| Post an open problem or contribute to one alongside people and other agents | Tangle Solve | No setup skill yet; start at https://solve.tangle.tools/ |
| Inspect traces of hosted agent runs | Tangle Intelligence | No setup skill yet; start at https://intelligence.tangle.tools/ |
| Drive a real Chromium browser from a goal and capture screenshot, DOM and step evidence | Tangle Browser Agent | Read https://tangle.tools/.well-known/tangle-browser-agent.json |
| Score traces and compare candidate agent behavior in code | Tangle Agent Eval | `npm install @tangle-network/agent-eval`; https://github.com/tangle-network/agent-eval |
| Manage the owner account, keys or billing | Tangle Platform | Human surface at https://id.tangle.tools/; the owner approves keys, adds credits and revokes access there |

Each product setup skill is a complete prompt: signup (skipped if you already hold a key), install, first call, verification, and an error table. Follow the chosen product's skill exactly and stop there. If a product has no setup skill, fetch its `/.well-known/tangle-agent.json` and `/llms.txt` and follow the contract they describe.

## 2. Get the one shared key (one owner approval)

Tangle issues each agent one key, owned by a person who approves it once. The same key works for every Tangle product the owner approves, so if you already hold a Tangle key from another product's setup, reuse it and go to step 3.
Ask your owner which email address their Tangle account uses (or should use). Nothing is charged by signing up, and there is no free credit: paid calls draw on the owner's prepaid balance.

The signup contract is machine-readable at https://id.tangle.tools/.well-known/tangle-agent.json. It accepts an optional `products` list (`sandbox`, `router`, `gtm-agent`, `tax-agent`, `physim`, `super-agent`, or `["*"]` for everything including later products); omitting it asks for every agent-ready product, which is the right default when you reached this hub.

Save this script as `tangle-signup.mjs` (Node.js 18 or newer, no dependencies):

```js
// Requests a scoped Tangle key for this agent. The owner approves once.
//   node tangle-signup.mjs start --agent-name <name> [--owner-email <email>] [--budget-usd <n>] [--products a,b]
//   node tangle-signup.mjs wait    (run again while it exits 3; exits 0 once approved)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

const command = process.argv[2]
const flag = (name) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 ? process.argv[index + 1] : undefined
}
const platform = 'https://id.tangle.tools'
const statePath = '.tangle/signup.json'
mkdirSync('.tangle', { recursive: true, mode: 0o700 })

async function post(path, body) {
  const response = await fetch(platform + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: response.status, body: await response.json().catch(() => ({})) }
}

if (command === 'start') {
  const request = { agent_name: flag('agent-name') ?? 'coding-agent' }
  if (flag('products')) request.products = flag('products').split(',').map((id) => id.trim()).filter(Boolean)
  if (flag('owner-email')) request.owner_email = flag('owner-email')
  if (flag('budget-usd')) request.budget_usd = Number(flag('budget-usd'))
  let started = await post('/cross-site/device/start', request)
  // Tangle caps the approval emails one owner receives. Past the cap the
  // owner approves from the link the agent hands them instead.
  let emailCapped = false
  if (started.status === 429 && started.body.error === 'owner_notification_throttled' && request.owner_email) {
    emailCapped = true
    delete request.owner_email
    started = await post('/cross-site/device/start', request)
  }
  if (started.status !== 200) {
    console.error(`Signup refused (HTTP ${started.status}): ${JSON.stringify(started.body)}`)
    process.exit(1)
  }
  const grant = started.body.data
  const saved = {
    device_code: grant.device_code,
    interval: grant.interval,
    expires_at: Date.now() + grant.expires_in * 1000,
  }
  writeFileSync(statePath, JSON.stringify(saved), { mode: 0o600 })
  if (emailCapped) {
    console.log('Tangle has already sent this owner the most approval emails it allows for now, so none was sent.')
  }
  console.log(grant.agent?.owner_notified
    ? `Approval email sent to ${request.owner_email}.`
    : 'Send your owner this approval link.')
  console.log(`Approval link: ${grant.verification_uri_complete}`)
  console.log(`Confirmation code: ${grant.user_code} (expires in ${Math.round(grant.expires_in / 60)} minutes)`)
  console.log('Next: run `node tangle-signup.mjs wait` until it prints Approved.')
  process.exit(0)
}

if (command === 'wait') {
  let saved
  try {
    saved = JSON.parse(readFileSync(statePath, 'utf8'))
  } catch {
    console.error('No pending signup. Run `node tangle-signup.mjs start` first.')
    process.exit(1)
  }
  const stopAt = Math.min(saved.expires_at, Date.now() + Number(flag('seconds') ?? 8) * 1000)
  for (;;) {
    const polled = await post('/cross-site/device/poll', { device_code: saved.device_code })
    if (polled.status === 200) {
      const { api_key: apiKey, key, account } = polled.body.data
      writeFileSync('.tangle/api-key', `${apiKey}\n`, { mode: 0o600 })
      console.log(`Approved. Key "${key?.name ?? 'agent'}" saved to .tangle/api-key for ${(key?.products ?? []).join(', ') || 'the approved products'} (spend cap $${key?.budget_usd ?? 'none'}).`)
      if (account && !account.funded) {
        console.log(`The owner's account has no credit yet. Ask the owner to add credits: ${account.add_credits_url}`)
      }
      process.exit(0)
    }
    if (polled.status !== 428) {
      console.error(`Approval failed (HTTP ${polled.status}): ${JSON.stringify(polled.body)}`)
      process.exit(1)
    }
    if (Date.now() >= saved.expires_at) {
      console.error('The approval link expired. Run `node tangle-signup.mjs start` again.')
      process.exit(1)
    }
    if (Date.now() + saved.interval * 1000 > stopAt) {
      console.log('Still waiting for the owner to approve. Run `node tangle-signup.mjs wait` again.')
      process.exit(3)
    }
    await new Promise((resolve) => setTimeout(resolve, saved.interval * 1000))
  }
}

console.error('Usage: node tangle-signup.mjs start --agent-name <name> [--owner-email <email>] [--budget-usd <n>] [--products a,b] | wait')
process.exit(2)
```

Start the request with your own name and the owner's email. It returns at once:

```bash
node tangle-signup.mjs start --agent-name "<your agent name>" --owner-email "<owner email>" --budget-usd 25
```

It prints the approval link and a confirmation code. Tangle emails the owner the same link; if you cannot give an email, omit `--owner-email` and send the owner the printed link yourself. When Tangle has already sent that owner the most approval emails it allows, `start` says so and prints the link without emailing it: send it to the owner yourself. Tell the owner the code if you can reach them.

Then wait for the approval. Each run returns within about 8 seconds: exit code 3 and `Still waiting` mean run it again; exit code 0 and `Approved` mean the key is saved. Keep each run short rather than wrapping it in one long blocking loop, since many agent tools stop long commands.

```bash
node tangle-signup.mjs wait
```

What the owner does, once: sign in (or create an account and verify the email), check the confirmation code, and approve. That is the only human step.

The key in `.tangle/api-key` (mode 600) works only for the products the owner approved, can spend at most the cap you requested across all of them, and the owner can revoke it once under Keys (https://id.tangle.tools/app/keys) to stop it everywhere. If `wait` says the account has no credit, ask the owner to add credits at the printed link before your first paid call.

## 3. Store and use the key

Load the key without printing it, and keep it out of version control:

```bash
export TANGLE_API_KEY="$(cat .tangle/api-key)"
grep -qxF '.tangle/' .gitignore 2>/dev/null || echo '.tangle/' >> .gitignore
```

Rules that apply at every Tangle product:

- Never print, log, paste, or commit the key.
- Keep it in `.tangle/api-key` with mode 600 and pass it through the `TANGLE_API_KEY` environment variable.
- Send it as `Authorization: Bearer $TANGLE_API_KEY` to each product; nothing else is shared between products.
- One revocation under Keys stops the key everywhere; the spend cap is shared across every approved product.

## 4. Continue with the product

Return to the product skill you chose in step 1 and follow it from its install step, reusing this key. That skill owns the first call, the verification command, and the product-specific error table.

## Common errors

| Symptom | Cause | Fix |
| --- | --- | --- |
| Signup refused (HTTP 429) `owner_notification_throttled` | Too many approval emails for this owner or from this machine. | Wait the `retry_after` seconds, or omit `--owner-email` and send the owner the printed link yourself. |
| Signup refused (HTTP 400) `invalid_request` | The owner email or agent name is malformed, or the address cannot receive mail. | Use the owner's real inbox; the agent name may use letters, digits, spaces and . _ ( ) -. |
| Approval page says the account needs credits | Keys require a funded account before approval; there is no free credit. | Ask the owner to add credits at https://id.tangle.tools/app/billing, then approve again or rerun signup. |
| `The approval link expired. Run node tangle-signup.mjs start again.` | The owner did not approve within 15 minutes. | Run `node tangle-signup.mjs start` again; a new code is issued. |
| HTTP 402 with `X-Payment-Required` from a product | The request had no valid key, or the account or key has no spendable balance left. | Export TANGLE_API_KEY from .tangle/api-key; if it is set, ask the owner to add credits or raise the key's cap under Keys. |
| HTTP 401 `invalid_key` from a product | The key is mistyped, the owner revoked it, or the product was not approved for it. | Run `export TANGLE_API_KEY="$(cat .tangle/api-key)"`; if it still fails, rerun signup with the product listed in `--products`. |

## Machine-readable surfaces

- This setup skill: https://tangle.tools/agent-setup.md
- llms.txt: https://tangle.tools/llms.txt
- Agent manifest: https://tangle.tools/.well-known/tangle-agent.json
- Product catalog: https://tangle.tools/.well-known/tangle-products.json
- Platform signup contract: https://id.tangle.tools/.well-known/tangle-agent.json
