# Blog quality checklist

This is the review contract for every Tangle blog post.

It applies to new posts, rewrites, series extensions, and historical posts.

The reader is assumed to know nothing about Tangle, its products, or the implementation terms used in the article.

Search visibility is useful only when the page teaches the reader something true and helps them choose a next action.

## The publish rule

A post is publishable when all of these are true:

- It answers one clearly named reader problem.
- The first two paragraphs give the answer in plain language.
- Every Tangle-native term is defined the first time it appears.
- The article has a concrete example, scenario, or worked result.
- A how-to or product post contains a small, checked, runnable example.
- Every important number, product behavior, and comparison has a public source or is labeled as an opinion or proposal.
- The article explains at least one failure mode and when the approach is the wrong choice.
- The title, summary, links, structured data, and image metadata describe the visible page accurately.
- A reviewer has rerun the content checks and inspected the rendered page.

No fixed word count can make a weak article useful.

Use length as a warning signal, not as a search target.

## Review order

Review in this order so polish does not hide a broken article:

1. Reader problem and answer.
2. Zero-context explanation.
3. Story, example, and technical depth.
4. Product and code accuracy.
5. Evidence, limits, and sources.
6. Internal navigation and next action.
7. Search, answer-engine, and social metadata.
8. Prose, images, and final rendered-page review.

## 1. Reader and story

- [ ] The brief names one reader, one problem, and one decision.
- [ ] The title promises the same problem the body solves.
- [ ] The opening answer is 40–120 words and can stand alone in a search result or answer response.
- [ ] The opening says what the reader should do, not only what the topic is.
- [ ] The article has a visible “before” state, “after” state, or representative scenario.
- [ ] Each section changes the reader’s understanding or enables the next step.
- [ ] The conclusion gives a decision rule and one concrete next action.
- [ ] The article does not read like a list of claims, a changelog, or a sequence of social posts.
- [ ] A reader can explain the main point after reading only the headings and opening paragraph.

### Recommended article shape

Use this shape for most technical posts:

1. Direct answer.
2. The reader’s starting problem.
3. Terms in plain language.
4. The mechanism or system boundary.
5. A worked example or walkthrough.
6. What the example proves.
7. Failure modes, limits, and the cases where another tool is better.
8. The practical decision.
9. Questions that real readers asked or that query research found.

Research notes and source inventories belong after the explanation or in a linked artifact.

## 2. Zero-context writing

- [ ] The first use of “Tangle” says what it is in this article.
- [ ] The first use of each product says what it does in one plain sentence.
- [ ] The first use of each implementation term says what a reader can see or do with it.
- [ ] Acronyms are expanded before they are shortened.
- [ ] “It,” “this,” and “that” always have an obvious noun nearby.
- [ ] The article does not assume the reader has opened another post, repository, private package, or internal plan.
- [ ] A repository path is never used as a substitute for an explanation.
- [ ] The article distinguishes the public protocol, hosted product, SDK package, repository, and example application.
- [ ] Version, date, network, and environment are named when they change the claim.
- [ ] The article says what is unknown instead of turning an absent value into a success.

### Native terms that need a definition when relevant

Define these in the article when they appear:

- **Blueprint:** a reusable service definition that tells an operator which jobs exist and how to run them.
- **Operator:** the person or service that supplies the machine and runs a Blueprint.
- **Service instance:** one running copy of a service that can receive work.
- **Agent runtime:** the software that gives a model tools, state, limits, and records.
- **Sandbox:** an isolated workspace where an agent can edit files and run processes under policy.
- **Evaluation:** a repeatable test used to compare an agent against a stated outcome.
- **Knowledge:** the documents, records, or retrieved information an agent is allowed to use.
- **Trace:** a time-ordered record of messages, tool calls, files, and results from one run.
- **x402:** an HTTP payment flow where a server asks a programmatic caller to pay before retrying the request.

The definition must connect the term to the reader’s task.

## 3. Depth and useful examples

- [ ] The article explains cause and effect, not only a component list.
- [ ] At least one example starts with an input, shows the action, and ends with an observable output.
- [ ] The example includes the unhappy path: an error, rejection, timeout, bad input, or wrong result.
- [ ] The article explains why the example matters for the product decision.
- [ ] A comparison uses the same workload and criteria for every option.
- [ ] A measurement includes the denominator, conditions, date, and source.
- [ ] The article includes at least one limitation that could change the recommendation.
- [ ] A reader can reproduce the important part without access to private files or credentials.
- [ ] Tables summarize a decision that the prose has already explained; they do not replace the explanation.
- [ ] Diagrams show a real sequence, boundary, or choice rather than decorative inventory.

### Depth warnings

Flag a post for revision when any of these are true:

- Fewer than 1,000 words and no strong measured result or complete small tutorial.
- More than 2,000 words but no worked example, failure path, or reader decision.
- More than three paragraphs in a row that contain only abstract claims.
- More than one page of pseudocode without a runnable counterpart or an explanation of what is omitted.
- The article cites implementation files more often than it explains the user-visible behavior.

These are review triggers, not automatic rejection rules.

## 4. Code and product proof

Code is required when the article teaches an integration, deployment, API, SDK, CLI, or debugging workflow.

- [ ] The smallest useful code path appears in the article, not only in a linked repository.
- [ ] The snippet uses a public package, command, or API that exists at the stated version.
- [ ] Install, authentication, and one successful call are shown when setup is part of the task.
- [ ] Expected output or the observable success condition is shown.
- [ ] One safe failure or validation check is shown when the system has meaningful failure behavior.
- [ ] The snippet is short enough to read and large enough to run.
- [ ] The snippet does not contain private paths, internal review commands, generated dumps, or source-code archaeology.
- [ ] Every command was run in a clean or isolated environment, or the article says exactly what was not run.
- [ ] The source repository, package version, and date are linked when behavior can change.
- [ ] Code blocks are labeled with the correct language and contain no invented types.

### Product-specific proof

Use the row that matches the post’s subject.

| Surface | Minimum useful demonstration | Evidence to preserve |
| --- | --- | --- |
| Sandbox | Install the scoped package, create or select a workspace, run one safe task, and show the returned artifact or status | Package version, endpoint or API source, expected result, cleanup behavior |
| Blueprint SDK | Define one job, run it locally, reject one invalid input, and describe the operator deployment boundary | SDK source, generated project or public example, network and version |
| Agent runtime | Create one agent with a tool or state boundary, run one task, and show the recorded result | Public package API, model and tool configuration, run output |
| Agent evaluation | Define one case, run a baseline and candidate, and report the measured outcome with its denominator | Case data, scoring rule, run command, raw result, uncertainty |
| Agent knowledge | Load one public source, retrieve one relevant passage, and show what happens when the source is stale or missing | Source URL and date, retrieval configuration, returned passage, freshness rule |
| Browser Agent | Run one non-destructive browser task and preserve the screenshot, page state, and final check | Public URL, command or package version, evidence artifact, stopping rule |
| Router | Send one model request through the public route and show the response and usage record | Endpoint, model, auth boundary, request limits, response record |
| x402 | Show request, payment-required response, payment, retry, and paid result without implying payment proves result quality | Protocol source, network and token, amounts if measured, failure behavior |

Do not force every surface into every article.

Choose the smallest demonstration that proves the article’s claim.

## 5. Evidence and claim discipline

Classify each important statement as one of these:

- **Observed:** measured from a named run, live endpoint, or public artifact.
- **Documented:** stated by a current primary source.
- **Reasoned:** an interpretation that follows from observed or documented facts.
- **Proposed:** a design or future idea that is not shipped.

- [ ] Numbers have a denominator and measurement conditions.
- [ ] Benchmarks name the inputs, repetitions, versions, and cost or time boundary.
- [ ] Product behavior is checked against current public code or documentation.
- [ ] Comparisons include the date and say where the other option is better.
- [ ] Private repository findings are not presented as public proof.
- [ ] A source supports the exact claim beside it, rather than merely sharing a topic.
- [ ] Claims about security, reliability, or correctness name the mechanism and the limit.
- [ ] Roadmap language is clearly future tense.
- [ ] The article does not turn a successful request into proof that the result is correct.
- [ ] The final paragraph does not claim more than the evidence supports.

## 6. Search, answer, and discovery quality

Search optimization starts with a useful page.

Do not add repeated phrases, hidden text, pages for every synonym, or special markup that has no reader value.

### Page basics

- [ ] One canonical query or reader intent owns the URL.
- [ ] The query reflects what a real reader would type, not an invented product slogan.
- [ ] The title names the problem and stays readable when truncated.
- [ ] The summary is a natural answer in roughly 150–160 characters when possible.
- [ ] The first visible answer uses the query’s language without repetition.
- [ ] Headings describe reader questions or decisions.
- [ ] Important facts are visible text, not only an image or client-side interaction.
- [ ] The page has a self-referencing canonical URL, is in the sitemap, and is not marked noindex.
- [ ] Article structured data matches the visible title, author, date, summary, and image.
- [ ] Social title, summary, image, dimensions, and image type match the page.
- [ ] The image has descriptive alternative text and is not a generic robot or abstract gradient.

### Answer-engine readiness

- [ ] The opening answer can be quoted without the reader needing hidden context.
- [ ] Definitions, comparisons, steps, and limitations are explicit.
- [ ] Each claim that should be cited has a public, stable source.
- [ ] The page contains original evidence that is more useful than a generic summary.
- [ ] FAQ questions come from real query or reader evidence and have direct answers.
- [ ] The page is reachable from a relevant series, product, or guide page.
- [ ] The article does not claim that a manifest, special file, or markup guarantees citation.

### Internal links

Include contextual links to:

- the next article in the reader’s path;
- the relevant product or public manifest;
- the source, example, or measured artifact;
- the series landing page when the article belongs to a series.

Links must explain why the destination helps.

Do not add a link farm at the end of the post.

## 7. Human style and anti-slop review

- [ ] The prose uses concrete nouns and active verbs.
- [ ] Paragraphs vary in length because the reasoning requires it, not because of a template.
- [ ] Repeated “This is not X; it is Y” constructions have been removed unless the distinction is essential.
- [ ] Generic openings, motivational filler, and inflated adjectives are gone.
- [ ] The article does not use a string of one-sentence paragraphs to imitate a social thread.
- [ ] Technical repetition remains when it helps a new reader keep the model in mind.
- [ ] The author admits uncertainty and tradeoffs without hiding behind vague language.
- [ ] Product claims are specific enough that a skeptical reader could test them.
- [ ] The article sounds like a careful engineer explaining a decision to another person.
- [ ] A human editor read the complete article aloud or line by line after the automated checks.

## 8. Visual review

- [ ] The cover shows the article’s actual subject or decision.
- [ ] A technical diagram is used when a sequence or boundary is easier to see than read.
- [ ] The image has one visual idea, legible labels, and enough contrast at social-card size.
- [ ] No image contains fake UI, unreadable code, or unsupported product claims.
- [ ] The rendered page loads the expected image with the correct dimensions and media type.

## 9. Series and archive review

- [ ] Every series has a clear promise and a reader order.
- [ ] Each post can stand alone for a reader who enters from search.
- [ ] Series posts do not repeat the same definition, conclusion, or product pitch.
- [ ] A series contains a mixture of explanation, tutorial, evidence, comparison, and failure analysis.
- [ ] The final post resolves the series question instead of merely linking to the next post.
- [ ] Orphaned order numbers and missing planned posts are repaired or removed from the plan.
- [ ] Historical posts receive the same review as new posts when they make current product claims.

## Rubric

Score each dimension from 0 to 2.

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Reader outcome | No clear problem | Problem named but decision unclear | Reader can choose or act |
| Zero-context clarity | Assumes internal knowledge | Some terms explained | A new reader can follow the whole article |
| Story | Claim list or thread | Sections exist but do not build | Sections move from problem to decision |
| Depth | Abstract or padded | One useful mechanism | Mechanism, example, and limits |
| Example | None | Vague scenario | Observable input, action, output, and failure |
| Runnable proof | Missing or invented | Partial snippet | Checked minimal path with expected result |
| Product accuracy | Unsupported or stale | Source named but not checked | Public source and version checked |
| Evidence | Opinions presented as facts | Some sources or numbers | Claims classified, sourced, and bounded |
| Tradeoffs | No limits | Generic caveat | Concrete failure and “choose something else” case |
| Navigation | Orphaned page | Links exist but are generic | Links form a useful reader path |
| Search answer | Keyword-first or unclear | Metadata passes | Intent, answer, sources, and metadata align |
| Human style | Sloppy or formulaic | Readable but repetitive | Specific, varied, and natural |

### Decision thresholds

- **Publish:** at least 20/24, no zero in reader outcome, zero-context clarity, evidence, or product accuracy, and all required artifacts present.
- **Revise:** 15–19/24, or any missing example, code path, failure explanation, or public source required by the article type.
- **Rewrite:** below 15/24, or a broken central claim, source-only exposition, private-only evidence, or a title that promises a different article.

The numeric rubric is a review aid, not an SEO result.

## 10. Per-post audit record

Keep one row or JSON object per URL with these fields:

- path, title, series, series order, author, last updated date;
- reader, problem, decision, audience stage, primary intent, owning query;
- word count, heading count, paragraph count, table count, code-block count;
- runnable-code count, install or command count, worked-example status, failure-example status;
- relevant Tangle surfaces and the exact public API or command used;
- observed, documented, reasoned, and proposed claim counts;
- source URLs, source dates, internal links, external primary sources;
- rubric scores and P0/P1/P2 findings;
- Search Console baseline and follow-up period;
- answer-engine prompt set, providers, successful attempts, cited URLs, and supported claims;
- CTA clicks, product starts, signups, or qualified leads when available;
- reviewer, review date, commit, and rendered-page check result.

## 11. Measurement contract for SEO, AEO, and GEO

The question is not “what is the SEO score?”

The question is whether the right readers can find the page, understand it, and take the intended next action.

### Technical baseline

Record these for every published blog URL:

- HTTP status and redirect chain.
- Indexability and canonical target.
- Sitemap and robots inclusion.
- Title, summary, headings, Article data, social metadata, and image status.
- Internal-link count and whether the page is reachable from a relevant hub.
- Core Web Vitals or equivalent field performance when available.

### Search baseline

Use complete, non-overlapping 28-day periods from Search Console after its normal data delay.

For every URL and query family, store impressions, clicks, click-through rate, average position, country, device, and date window.

Compare the post-change period with the named pre-change period.

Keep an unchanged comparison group when the site has enough similar pages to separate an edit effect from seasonality or a site-wide change.

Do not call a change successful from one day, one query, or one page.

Wait long enough for crawling and ranking to settle, normally 28–56 days for an editorial change.

### Answer-engine baseline

Maintain a fixed prompt set per intent.

For every attempt record provider, model, prompt version, date, success or failure, response, cited URLs, and the claim each citation supports.

Count a citation only when the requested page or domain appears in the returned sources and supports the statement made about it.

Report provider failures separately from answers that did not cite the site.

Track:

- successful measured attempts;
- answers that mention Tangle;
- answers that cite a Tangle URL;
- cited Tangle URLs by page;
- supported claims per cited response;
- prompt families where the site is absent or misrepresented.

### Business outcome

Attach a clear event to each article’s next action.

Examples include a product-page click, package documentation visit, Sandbox start, Blueprint repository visit, demo request, signup, or qualified lead.

Report the event count and rate against page sessions or search clicks.

Do not use impressions or answer mentions as a substitute for a useful business outcome.

### Success report

Every monthly report should show:

1. Technical pass rate across published URLs.
2. Indexed URLs divided by published URLs.
3. Search impressions, clicks, click-through rate, and position by page and intent.
4. Answer-engine successful attempts, citation rate, cited pages, and provider failures.
5. Product or business actions attributed to content.
6. The raw period dates, denominators, missing data, and the exact changes made.

Keep these measures separate.

Do not collapse them into one composite score.

## Current baseline and interpretation

The August 3, 2026 audit covers 85 MDX posts and 13 series.

- The deterministic site audit passes all 85 posts for frontmatter, headings, image alternative text, and target-query ownership.
- The same audit reports a median heuristic SEO score of 93/100, but that score does not measure teaching depth, runnable proof, claim accuracy, or traffic.
- The reader audit reports 0 P0 rewrites, 38 P1 revisions, and 47 P2 factual or link checks.
- The content audit finds 44 posts under 1,000 words, 25 under 750 words, and 20 at or above 2,000 words.
- Only 23 posts contain actual syntax code rather than notation or pseudocode, and only 8 contain shell-style blocks.
- No fenced block contains a package-specific install or import example for `@tangle-network/sandbox`, `@tangle-network/agent-runtime`, `@tangle-network/agent-eval`, or `@tangle-network/agent-knowledge`.
- The self-improving series has a median of about 2,948 words but no actual syntax-code posts; it needs concrete experiments and product walkthroughs, not more theory.
- The Agent Intent Infrastructure, Blueprint Agent, Tangle Protocol, Browser Agent, and Code Auditor series have medians between 720 and 789 words and need full teaching rewrites.

These findings mean the next work is editorial depth and product proof, not another metadata-only pass.

## Required checks before merging a content PR

Run:

```bash
pnpm check:blog
pnpm check:blog:reader
pnpm build
git diff --check
python3 ~/company/tools/seo-engine/cli.py site-audit \
  --blog-dir ~/code/tangle-website/src/content/blog --json
```

Then inspect the rendered URL in a browser and check its canonical, structured data, social image, and internal links.

The SEO engine’s composite score is diagnostic only until its data collection and period-comparison checks are complete.

The content PR is not ready when an automated check passes but the reader cannot explain what to do next.
