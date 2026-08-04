# Batch Rewrite Protocol

Use this protocol to rewrite a Tangle blog series or the complete blog corpus in one coordinated turn.
It is designed for independent one-turn workers, disjoint file ownership, and a coordinator that can prove the final tree is complete.

## Definition of complete

A batch is complete only when every assigned post has one of these explicit outcomes:

- rewritten and validated;
- intentionally unchanged with a written reason and a factual/link check; or
- blocked with a precise file, claim, or missing source that a human must resolve.

“Drafted,” “sampled,” “the rest follow the pattern,” or “the worker ran out of time” are not completion states.
The coordinator must publish the exact post count, changed-file list, unchanged-file list, blocked-file list, and validation results.

## 1. Inventory before writing

From the website repository, collect:

1. every `src/content/blog/*.mdx` path and frontmatter record;
2. series name and order, internal links, cover/hero image paths, and primary search query;
3. the latest reader-rubric report, copy-audit output, and hard failures;
4. neighboring posts that establish facts, terminology, or series continuity;
5. public source links for each product or protocol claim.

Reconcile against existing work before creating anything.
If a post already has a current rewrite, assign it to factual/link review rather than rewriting it again.
If a slug is public, preserve it unless a redirect is explicitly implemented and checked.

## 2. Partition work without collisions

Create a manifest with one row per post:

| Field | Required value |
| --- | --- |
| `path` | Repository-relative MDX path |
| `owner` | Exactly one worker or `coordinator` |
| `series` | Existing series and order |
| `reader` | Newcomer, caller, operator, builder, researcher, or buyer |
| `primaryQuery` | One query from the checked-in map |
| `mode` | Rewrite, revise, or factual/link check |
| `neighbors` | Two or more related posts to read |
| `sources` | Public or repository sources that constrain claims |

Partition by related series and reader path, not by arbitrary file count.
Keep every file in exactly one lane.
Do not let two workers edit the same series index, triage report, frontmatter schema, or shared asset.
Reserve those files for the coordinator after all content workers finish.

For a large corpus, use several medium batches rather than one worker per post.
Each batch should be small enough for a worker to read its neighbors and large enough to preserve a series argument.
The coordinator may dispatch a separate batch for each major series plus one for standalones.

## 3. One-turn worker contract

Each worker receives:

- the full voice and rewrite rubric;
- the exact assigned file list;
- the series and neighbor context;
- primary query and search intent for each file;
- public sources and the private-code prohibition;
- the required checks and the required result format.

The worker performs all of the following in the same turn:

1. read every assigned post and its named neighbors;
2. state the reader problem, wrong assumption, decision, and evidence plan for each post;
3. rewrite the full assigned posts, not just the opening or one example;
4. explain every Tangle-native term before relying on it;
5. add a real narrative or concrete workflow, not a list of slogans;
6. include a public, runnable command, API, manifest, or toy example when the topic permits;
7. include limits, failure behavior, and the next decision;
8. preserve public slugs and valid frontmatter;
9. run `git diff --check` plus the narrowest available blog audit or link check;
10. report changed paths, raw word counts, checks run, and any unverified claims.

Workers must not:

- expose private repository paths, source, commit IDs, internal architecture, customer data, or unpublished measurements;
- invent SDK APIs, benchmarks, search volume, customer results, or production availability;
- paste repository archaeology such as `git show`, `sed`, `rg`, private file paths, or commit mechanics into a public post;
- edit outside their manifest;
- leave placeholders, TODOs, fake citations, or “the remaining posts follow this pattern”; or
- delegate a second writing pass when the contract requires one turn.

## 4. Article quality contract

Every rewritten post must pass the following reader test:

- The opening names a problem a newcomer recognizes before introducing Tangle vocabulary.
- The primary query is answered naturally in the title, summary, or opening.
- The first use of every native term defines it in plain language.
- One continuing example carries the reader through the important decision.
- Tangle's role is concrete: a public SDK, Sandbox, Router, Browser Agent, Blueprint, x402 payment path, TEE boundary, operator record, manifest, or observable result.
- At least one artifact supports the argument: code, command, request/response shape, table, diagram, trace, screenshot, or measured result.
- The post distinguishes observed behavior, proposal, and illustrative toy code.
- Failure and limits are explained before the ending.
- The ending tells the reader what to choose, test, deploy, or avoid.
- The post has useful internal links and public primary sources without keyword stuffing.

Aim for long-form depth where the topic needs it.
Add words to explain a decision, run a scenario, or show evidence; remove words that repeat the thesis or turn the article into a taxonomy.
Vary paragraph length and headings.
Do not force every post into the same template.

## 5. Coordinator reconciliation

After workers finish, the coordinator must:

1. verify that every manifest row has a result;
2. check `git diff --name-only` against the ownership manifest;
3. inspect series order, cross-links, duplicate primary queries, and repeated openings;
4. run the full blog audit, reader rubric, slop scan, link check, build, and copy audit on the combined tree;
5. inspect every hard failure and every copy-audit failure, then dispatch a correction to the owning worker or fix it centrally;
6. regenerate the canonical triage report only after the final source tree is stable;
7. commit in reviewable batches and open/update PRs with exact proof;
8. read the newest PR review and CI result after each push;
9. merge only when the current head has green checks, an approval, and no blocking review finding.

Do not hide an incomplete batch behind a lower score.
A post with a good score but an unsupported claim, broken link, private path, or missing reader decision remains unfinished.

## 6. Model and concurrency rules

Probe the available model roster before dispatching.
Use the user's requested model and reasoning level when exposed.
If the requested model is absent, show the exact rejection and ask for or use only an explicitly approved fallback.
Do not claim a Luna worker ran if the runtime rejected `gpt-5.6-luna`.

Run independent writing lanes concurrently, but serialize shared-file edits and final validation.
The coordinator should not wait for one post before starting another independent lane.
It should also avoid saturating the machine: cap concurrent workers at the number the runtime and repository can support, and stop a lane that begins editing outside its manifest.

The one-turn contract improves repeatability, not magic.
If a batch cannot fit in one worker turn, split the manifest into smaller disjoint batches and preserve the same final checks.
