export interface BlogSeriesDetails {
  title: string
  description: string
  premise: string
  decision: string
  path?: string
  startHere: {
    title: string
    slug: string
  }
}

export const blogSeriesDetails: Record<string, BlogSeriesDetails> = {
  'agent-intent-infrastructure': {
    title: 'Agent Intent Infrastructure',
    description: 'Guides to service discovery, sandboxed execution, model routing, x402 payments, and evidence for teams integrating AI agent services.',
    premise: 'Learn how software discovers a Tangle service, runs a bounded task, pays per request, and keeps evidence. A Blueprint is a reusable service definition, a Job is one callable unit, and an operator runs that Job.',
    decision: 'For teams integrating external agent services, this series separates discovery, execution, payment, and evidence so each boundary can be designed and tested on its own.',
    startHere: { title: 'How AI Agents Discover Products', slug: 'how-ai-agents-discover-products' },
  },
  'agent-runtime-infrastructure': {
    title: 'Agent Runtime Infrastructure',
    description: 'How agent settings become running workers with enforceable budgets, checked outputs, observable events, and durable run records.',
    premise: 'An agent runtime is the software that gives a model its tools, files, limits, and record of work. Follow those settings into isolated workers, then see how the runtime handles budgets, failures, output checks, and traces.',
    decision: 'For teams maintaining agent runtimes, this series shows how to deliver settings faithfully, remove conflicting execution paths, reject impossible budgets, and preserve useful evidence when a worker fails.',
    path: 'Start with the settings contract and one shared execution path. Then add worker visibility, isolated environments, measured budget limits, failure-safe output checks, and a trace format that another tool can read.',
    startHere: { title: 'AI Agent Profile: Make Settings Deliverable', slug: 'agent-profile-materialization-contracts' },
  },
  'blueprint-agent': {
    title: 'Blueprint Agent',
    description: 'How browser coding workspaces and code-verified quests can measure working integrations for developer programs and hackathons.',
    premise: 'Explore a browser-based coding workspace where an agent works inside an isolated Sandbox—a disposable environment where it writes and runs code—and completes small quests checked by builds, tests, browser behavior, runtime state, or deployment evidence.',
    decision: 'For developer-relations, partner, and hackathon teams, the series asks when a working artifact is better proof of learning than clicks or self-reported completion. Builds and tests show code behavior, wallet evidence shows account and network state, and a deployment check shows that a versioned URL responded; none alone proves the whole submission correct.',
    path: 'Build the evidence foundation first, then apply it to developer onboarding, individual quests, hackathon judging, and a reusable browser workbench.',
    startHere: { title: 'AI Coding Assistant With Deployment Evidence', slug: 'ai-coding-assistant-deployment-evidence' },
  },
  'blueprint-sdk': {
    title: 'Blueprint SDK Guide: Run Rust Services on Tangle',
    description: 'A practical Rust guide to packaging, testing, deploying, monitoring, and rolling back operator-run Tangle services.',
    premise: 'Tangle is a network where independent operators run services. The Blueprint SDK is a Rust toolkit for packaging, testing, and operating those services: a Blueprint is a reusable service definition, a Job is one callable unit of work, and a Service is one live configured instance run by an operator.',
    decision: 'For Rust teams deciding whether a local service should be run by independent Tangle operators, this guide shows how to define and run a job, test the deployment, and collect monitoring and rollback evidence; it does not prove the service’s business logic is correct.',
    startHere: { title: 'Blueprint SDK Deployment: Run an Operator Job', slug: 'blueprint-sdk-deployment-guide' },
  },
  'browser-agent': {
    title: 'Browser Agent',
    description: 'Evidence-based browser testing for QA, product, and wallet teams using natural-language goals, screenshots, and safe stops.',
    premise: 'A browser agent drives real Chromium from a natural-language goal and returns its observations, actions, screenshots, and result. A fixture is the controlled test data prepared before a run; provider state is the wallet’s current account, network, and connection.',
    decision: 'For QA, product, and wallet teams, this series shows how to turn English goals into release checks while stopping before irreversible actions such as signing or sending a transaction.',
    path: 'After the evidence-trace foundation, move through a multi-page end-to-end journey, translate an English goal into exact checks, then test DeFi, MetaMask, and bounded recovery.',
    startHere: { title: 'AI Browser Testing With Evidence Traces', slug: 'ai-browser-testing-evidence-traces' },
  },
  'building-an-ai-tax-agent': {
    title: 'Building an AI Tax Agent',
    description: 'A proposed source-linked tax preparation workflow for calculations, draft forms, open questions, and human review before filing.',
    premise: 'This proposed preparation workflow turns source documents into linked facts, draft forms, and workpapers—the calculations and records supporting a return—inside a review packet that a person inspects before filing.',
    decision: 'For taxpayers, tax professionals, and software builders, the articles apply Tangle’s isolated-workspace and evidence pattern as a teaching design. They are not tax advice, do not claim Tangle files returns, and do not describe autonomous filing.',
    path: 'Begin with the general preparation workflow, then add electronic-filing controls, crypto reconciliation, source-linked workpapers, approval, foreign-corporation and S-corporation cases, founder records, and multiple K-1 forms.',
    startHere: { title: 'AI Tax Preparation for Complex Returns', slug: 'ai-tax-preparation-complex-returns' },
  },
  'code-auditor': {
    title: 'Code Auditor',
    description: 'Agent-assisted code audit guides for turning scanner alerts into reproducible findings with reachability and impact evidence.',
    premise: 'This series describes agent-assisted code review in which scanner alerts enter an isolated workspace for reachability, impact, and reproduction tests. An alert is a candidate; a finding is a claim another reviewer can reproduce.',
    decision: 'For security and release teams, the articles show what evidence supports escalating a risk, rejecting a false positive, or continuing an investigation.',
    startHere: { title: 'AI Code Audit: From Scanner Alert to Reproducible Evidence', slug: 'ai-code-audit-sandboxed-agents' },
  },
  'tangle-protocol': {
    title: 'Tangle Protocol',
    description: 'How Tangle coordinates operator-run services across provider selection, payment, privacy, staking, lifecycle, and result checks.',
    premise: 'Tangle coordinates services run by independent operators. A Blueprint is the service template, a Service is one configured instance, and a Job is one unit of work; the actual computation runs off-chain.',
    decision: 'For builders and buyers, this series separates provider selection, payment, privacy, staking, service lifecycle, and result checking so the protocol is not mistaken for proof of correctness.',
    startHere: { title: 'Decentralized Compute Protocol: How Tangle Runs Services', slug: 'decentralized-compute-protocol-blueprints' },
  },
  'tangle-re-introduction': {
    title: 'Tangle Re-Introduction',
    description: 'A first-principles guide to Tangle Blueprints, Services, Jobs, operators, verification, deployment, inference, and sandboxes.',
    premise: 'Start from first principles: Tangle coordinates operator-run services defined as Blueprints, deployed as Services, and called through Jobs. The series moves from that architecture to verification, deployment, inference, sandboxes, and hardware-isolation evidence.',
    decision: 'For new builders and buyers, the sequence helps decide whether an operator-run service fits the workload, what each verification claim means, and what a first deployment must disclose.',
    startHere: { title: 'Why Decentralized AI Infrastructure?', slug: 'why-ai-infrastructure-needs-decentralization' },
  },
  'the-instrument-problem': {
    title: 'The Instrument Problem',
    description: 'How to keep coding-agent benchmarks, behavioral signals, winner selection, and cost reports aligned with the decision they support.',
    premise: 'An agent evaluation is a repeatable test used to compare systems or decide whether a change should ship. This series examines four ways that an otherwise precise result can answer the wrong question: an incomplete benchmark, a weak behavioral signal, a ranking rule that disagrees with release policy, and a cost total that omits workers.',
    decision: 'For teams evaluating coding agents, the evidence helps decide what each number can support, which failures require another measurement, and whether the release decision uses the same outcome the test actually counted.',
    path: 'Begin with the boundary of a real coding-agent benchmark. Then test a behavioral signal against chance, align the winner with the release rule, and count every model-calling role before comparing cost.',
    startHere: { title: 'AI Coding Agent Benchmark: What CodeTraceBench Measures', slug: 'codetracebench-benchmark-measured-wrong-capability' },
  },
  'the-self-improving-stack': {
    title: 'The Self-Improving Stack',
    description: 'How agent teams improve prompts, skills, runtimes, traces, evaluations, and models without letting weak evidence ship.',
    premise: 'Map the parts an agent team can change—prompts, skills, runtime, traces, evaluations, model training, and release rules—and the evidence required before promoting a candidate change.',
    decision: 'For teams improving agents, the series helps choose the right layer, protect fresh test cases from the search process, and keep a human release decision at the end.',
    startHere: { title: 'The Self-Improving Stack: How AI Agents Get Better', slug: 'the-self-improving-stack' },
  },
  'when-structure-pays': {
    title: 'When Structure Pays',
    description: 'Measured comparisons of one agent, repeated candidates, and supervised workers, including quality, token cost, elapsed time, and uncertainty.',
    premise: 'An agent system can spend extra computation in two ways: generate several candidates and choose among them, or add a parent process that delegates to workers. These articles compare both choices against a simpler one-agent baseline.',
    decision: 'For teams choosing an agent design, the series shows when a shared checker makes extra samples useful, when coordination adds cost without a measured gain, and what another experiment must record before the result can generalize.',
    path: 'Start with best-of-five sampling, where every candidate faces the same deterministic check. Then examine a paired supervisor-versus-solo replay that records quality, tokens, elapsed time, missing data, and uncertainty.',
    startHere: { title: 'When Does Best-of-Five Sampling Pay for AI Code Generation?', slug: 'when-best-of-five-sampling-pays' },
  },
  'x402-production-runway': {
    title: 'x402 Production Runway',
    description: 'A production guide to x402 payment flows, typed Tangle jobs, pricing, quotes, operators, monitoring, and failure recovery.',
    premise: 'x402 turns an HTTP 402 payment challenge into signed payment terms and a retried request. On Tangle, a Blueprint is the typed service contract: each paid request becomes one Job declared by it, facilitators verify and settle payment, and operators execute the work.',
    decision: 'For pay-per-request service teams, this series covers pricing, quotes, monitoring, deployment, and safe recovery when payment, facilitator, operator, or result state is uncertain.',
    path: 'Follow the payment lifecycle: map an HTTP payment to a Job; choose a facilitator and price; design quotes, monitoring, distribution, and protected execution; then deploy, recover failures, and assess product fit.',
    startHere: { title: 'x402 Payments Blueprint: Turn HTTP into a Job', slug: 'blueprint-sdk-x402-payments-runnable-jobs' },
  },
}

export function blogSeriesSlug(series: string) {
  return series
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getBlogSeriesDetails(series: string) {
  return blogSeriesDetails[blogSeriesSlug(series)]
}
