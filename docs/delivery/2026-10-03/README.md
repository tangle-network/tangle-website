# Website checkpoint — 2026-10-03

This is an unpublished draft, not a completed homepage redesign.
Production layout, typography, and scroll interactions remain the baseline.

## Committed implementation

- Compact shared code component near the top, with integrated TypeScript/Python controls and copy buttons.
- Examples: execution, files, agents, app previews, pause/resume, parallel sessions, and network policy.
- Python examples use HTTPX against the public API; the last checked native package was not installable from PyPI.
- Harness tiles link to Sandbox creation with a selected harness.
- Product/platform and enterprise copy changes remain a draft.
- Pinned `@tangle-network/ui@11.15.1`; a Vite alias avoids the Node-only Markdown renderer in Cloudflare SSR.

## Validation and gaps

Prior receipts are retained under `prior-checks/`; they establish what was tested at that revision, not a new production result.
The TypeScript snippets passed strict checks against SDK0.60.9; Python snippets parsed and compiled.
The original code component passed desktop/mobile layout and copy checks.
The expanded examples have a desktop screenshot and local served-page receipt; not every new interaction has fresh browser proof.
The source examples have not all run against the hosted runtime.
No native interactive task recording is included.
The headless recording is a separate SDK event rendering, not Claude Code's native terminal UI.

The current branch still needs integration with current master, its focused build gate, hosted execution of each advertised example, and final UI review before deployment.
The existing file dependency on `../brand/packages/brand` also needed a clean-consumer install check; on 2026-10-05 the site moved to the released npm package and the sibling checkout was removed.
UI11.15.1 expects brand^1.10; prior local preview retained brand0.9 with local code tokens.
No fresh frozen-install/build or production deployment is claimed for this checkpoint.

## Preserved history

`rejected-prototypes/` contains authored source from rejected explorations outside application routes.
It is explicitly excluded from the recommended product direction.
Raw media, caches, generated output, and private execution receipts remain in the local `.agent/` archive.
