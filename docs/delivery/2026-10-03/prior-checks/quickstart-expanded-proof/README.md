# Expanded homepage quickstarts

Skill: sandbox-sdk-integration.
Source: `src/data/sandboxQuickstart.ts`.
The original Run code, Files and Run an agent exported strings remain byte-for-byte unchanged.

Added App preview, Pause and resume, Parallel agents and Network policy in TypeScript and Python.

## Verification

Run `node .agent/real-homepage-20261002/quickstart-expanded-proof/check.mjs` from the website worktree.

- TypeScript 6.0.3 strict checking against npm Sandbox 0.60.9 passed with zero diagnostics.
- npm tarball SHA-512 integrity was verified before reading declarations.
- Node types 25.6.0 validate readline imports and process streams; no SDK or Node method stubs were used.
- Dependency declaration checking is skipped.
- Python snippets all parse and compile, contain required imports and define their variables.
- AST checks cover bounded creation polling, deletion callback registration and ExitStack cleanup before the HTTP client closes.
- Exact exported strings, source SHA-256, inferred SDK types and check results are retained in JSON files beside this receipt.
- No hosted sandboxes were created or billed. No browser evidence is claimed here.

## Checked server contracts

ADC source revision: `ee803cb7501379389e32c928cecc9311580bc17b`.
Read `products/sandbox/sdk/INTEGRATION.md` and package exports before implementation.

| Behavior | Maintained source |
| --- | --- |
| Public runtime proxy and authorization | `products/sandbox/api/src/routes/sandbox-gpu-and-proxy.ts` |
| Create accepts environment, maxLifetimeSeconds, egressPolicy | `products/sandbox/api/src/routes/sandbox-create-schema.ts` |
| Create may require readiness polling | `products/sandbox/sdk/src/client.ts` |
| Process POST accepts executable, args and timeoutMs; nonblocking by default | `apps/sidecar/src/routes/process.ts:46` and `:636` |
| Preview POST/GET response uses previewLink with previewId, url, status | `apps/orchestrator/src/routes/sidecars/preview-links.ts:125`, `:181`, `:218`; `apps/orchestrator/src/schemas/preview-links.ts` |
| Preview readiness is separate from creation | `products/sandbox/sdk/src/sandbox.ts:5986` |
| Stop preserves state, resume returns sandbox state | `products/sandbox/api/src/routes/sandbox-delete-stop-route-schema.ts:107`, `:162` |
| File write/read payload and data.content | `apps/sidecar/src/routes/files.ts` |
| Agent sessionId is passed to runAgent | `apps/sidecar/src/routes/agents.ts:174`, `:183`, `:217` |
| Agent JSON route, base64 prompt parts and data.finalText | `apps/sidecar/src/index.ts`; `apps/sidecar/src/schemas/agent-request.ts`; `apps/sidecar/src/routes/agents.ts` |
| Strict egress accepts explicit domains and includeImplicitDomains | `products/sandbox/api/src/routes/sandbox-create-schema.ts:246`; `products/sandbox/sdk/src/types.ts:4830` |

## Behavior and limits

App preview serves a file through a real Python HTTP server, waits for public preview delivery, prints the real URL, and keeps the sandbox until the user presses Enter.
Both the server process and sandbox runtime have a 15-minute limit.
The lifetime cap suspends the sandbox; deletion happens after viewing, not before.

Pause and resume writes a file, stops, resumes, waits for running, and reads that file.

Parallel agents uses distinct session IDs and concurrent requests.
Both tasks are read-only because sessions can share a workspace.
It does not promise isolated files or parallel provider scheduling.

Network policy allows docs.tangle.tools, disables the broad implicit domain list, and requests the docs page from the sandbox.
Strict policies also retain provisioned model endpoints; the example makes no claim that the named domain is the sole possible destination.

Python uses public httpx because tangle-sandbox is not on PyPI and its source repository is private.
TypeScript ends with explicit deletion on successful completion; it deliberately contains no exception boilerplate.
Python registers cleanup immediately after creation and deletes on completion or exception.
These are source and package contract checks; deployed availability and runtime behavior remain untested.
