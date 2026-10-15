# Tangle website: product direction

Proposed direction, 2026-10-15. The single strategy entrypoint for this website; execution is tracked in [#297](https://github.com/tangle-network/tangle-website/issues/297). This is not an approved site-wide rebrand, a production-readiness claim, or a mandate to narrow Tangle to GTM. [Brand guidelines](https://github.com/tangle-network/brand/blob/main/docs/brand-guidelines.md) remain the visual authority; their current hierarchy and this proposal must be reconciled explicitly before rollout.

## Why this page exists

The website should help a visitor understand what Tangle makes possible, find relevant work, and choose a credible next step. The architecture is supporting explanation, not a requirement that a buyer learn our repository map. Recent founder feedback asks for a serious research-and-technology company with a customer-facing offer and a more cohesive product experience. More polished adjectives cannot compensate for an unclear offer or an unfinished workflow.

## Company thesis and customer promise

Tangle builds agent infrastructure, agent applications and research methods. The proposed company framing is **applied AI research and engineering**: investigate how agents can do harder work, build reusable systems that run them, and deploy specific useful capabilities with customers.

Research, infrastructure and customer work reinforce one another when results actually transfer. The transfer is work to demonstrate, not an automatic learning loop. Discovery retains its broad scientific and engineering ambition; not every research pursuit needs an immediate sales justification. Intelligence remains an optional product whose managed value must be demonstrated, not the center of every company diagram.

Candidate headline: **“AI systems. Built for real work.”**
Candidate explanation: “We build the infrastructure and agent applications that turn advances in AI into useful work.”
For a deployment page, a separate proposed offer: “Work with Tangle to take one valuable agent workflow from a working prototype to a supported deployment.” Use only when capacity, scope and support are available.

The current “Run agents. Make them better.” headline remains a valid control. Compare a complete page and buyer path before replacing it. Do not test isolated slogans while keeping a confusing page underneath.

## Who engages with us, and what they receive

| Entry path | Candidate buyer/user | First concrete value | Commercial or adoption step |
|---|---|---|---|
| Build on Tangle | Technical founder or engineer already building agents | A useful workload running on the supported Sandbox/Router path, with accessible results and operational controls | Start from a maintained example; evaluate the existing service and usage terms |
| Use an agent | Founder or domain operator with recurring work | A specific work product or supported action from an existing product agent | Show the product's real first-use path, price and support boundaries |
| Deploy with Tangle | Technical or operational owner with a valuable workflow and access to its systems | A scoped deployment using shared Tangle technology, with agreed operating limits and a responsible owner | Scope the job, agree acceptance and commercial terms, then deliver; do not imply an unlimited free pilot |
| Research with Tangle | Researcher, technical team or sponsor with a hard question | A preserved result, experiment, system or useful negative finding that can be inspected independently | Inspect published work or discuss a specific research collaboration; no guaranteed breakthrough |

These are entry paths, not four new companies, repositories or software layers. Prioritize according to actual readiness and buyer pull. Self-service infrastructure must not be hidden behind a sales call. Customer deployment must not be described as self-service until it is.

## Industry language

Lead with a workflow and its evidence, not a wall of industry icons. Existing work makes developer tools, business operations, hospitality, professional work, creative production and technical research plausible areas to discuss. A repository or prototype does not establish a production-ready industry solution.

Examples for scoping, not proof claims: a supported developer environment; a sourced market brief and authorized follow-up; staff/vendor coordination; document or tax preparation for professional review; a film preproduction artifact; a physical-system design or reproducible experiment. State whether each displayed example is a product, pilot, internal demonstration or research result. Do not imply filing, professional certification, guest-facing autonomy, safety validation or customer deployment without the relevant evidence.

Start with a small number of strong example pages. Each names the user, incoming work, deliverable/action, systems involved, what a human owns, current limits, and the next step. Expand coverage when examples warrant it; do not turn every repo into a landing page launch.

## Proposed page structure

**Home:** one clear company statement; concrete examples of work; how platform, applications and research fit together; selected evidence; a relevant next step. Let the best artifact carry visual weight. Avoid an architecture diagram that implies all work must flow through Intelligence.

**Platform:** Sandbox and Router entry paths, supported developer capabilities and examples. Runtime, Eval, SDK, Knowledge and Integrations explain extensibility without appearing as equal unrelated products. Keep current service status and pricing with their owners.

**Solutions / Deployments:** a few workflow-led examples and the delivery model. Explain discovery/scoping, integration, evaluation, operation and support. This is proposed navigation wording, not an approved service launch.

**Research:** accessible questions, methods, results, figures and limitations. Separate measured improvement, novelty and outside adoption. Link reproducible material where permitted. Internal judges, activity volume and accumulated traces are not substitute results.

**Company / trust:** what the team builds, public technical work, accurate operational/security information and how to engage. No borrowed customer logos, simulated endorsements, invented scale or unsupported compliance badges.

**Developers:** documentation, examples and actual product start links remain easy to reach. Not every visitor needs to see the whole product taxonomy.

## Copy and design corrections to evaluate

| Current source or pattern | Better direction |
|---|---|
| `src/pages/index.astro` opens with Sandbox execution and its workbench CTA | Keep a direct developer path; add a legible explanation for an operator or deployment buyer rather than replacing all entry paths with sales |
| Sandbox diagram converges on an Intelligence node | Show optional inspection/improvement paths or one actual workflow; do not visually assert a mandatory product dependency |
| “any coding harness” | Say “supported coding harnesses” and link the actual support surface; extensibility is not universal current compatibility |
| “Inference” card versus Router product naming | Use Router as the product name and inference/model access as its job, subject to explicit terminology alignment |
| Generic capability list | Show an actual deliverable, a relevant limitation and the action a customer can take |
| “Autonomous” as a blanket adjective | Specify the work, its authority and its escalation path; retain useful supported autonomy rather than reducing everything to draft-only |

These are proposals grounded in source inspection. They are not claims that the live page was changed or that every listed behavior was tested.

## What to learn from the references

[Wonderful](https://www.wonderful.ai/) connects platform, [deployment teams](https://www.wonderful.ai/deployment) and an enterprise offer. Borrow the accountable delivery explanation, not claims of global coverage or its visual identity.

[Sierra](https://sierra.ai/product) connects customer-experience use cases to a platform and partner; its [agent-engineer account](https://sierra.ai/blog/meet-the-ai-agent-engineer) describes customer work returning reusable components. Borrow the concrete buyer story and repeatable engineering, not a forced customer-service pivot.

[OpenAI's forward-deployed engineering role](https://openai.com/careers/forward-deployed-engineer-%28fde%29-sf-san-francisco/) joins discovery, system design, rollout and research/product feedback. Tangle can pursue a similar relationship between applied work and its own stack without claiming a frontier-model lab, enterprise staffing footprint or equivalent customer proof.

All competitor statements above describe their published positioning, not an independent operational audit. Customer procurement and Tangle's actual repeatable advantage remain to be demonstrated.

## Review and delivery

Compare substantially different compositions on the same content, then choose one direction with an accountable design owner. Use the existing shared system, not a new theme package. Build one end-to-end visitor journey and one product workflow before rolling changes across apps. The [shared refresh brief](https://github.com/tangle-network/brand/blob/docs/product-design-reset-20261015/docs/design-refresh.md) is a proposal pending review, not a published dependency.

The first review checks comprehension, hierarchy, reading comfort, distinctive Tangle identity, mobile composition and trustworthy action/state feedback. Current public-page text and repository sources were inspected; live browser capture was blocked, so pixel-level and authenticated-product review are still required. No numerical design score is claimed.

For each change, retain the previous copy, why the revision is better and what evidence supports it. Check actual page rendering and CTA destinations before claiming delivery. Use the repository's existing applicable checks, not a new evaluation framework. Keep ongoing defects and implementation status in #297; do not grow this document into a work tracker.
