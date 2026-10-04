# Compact homepage examples

Implementation: `821e597f54d52a61fef638e997a4aec89bb56a0e`, in [draft PR 225](https://github.com/tangle-network/tangle-website/pull/225).
Preview: <http://127.0.0.1:4391/#quickstart-title>. Not deployed.

- “Create a sandbox” is first and shows client initialization, creation and readiness.
- Later examples display the operation and any additional imports. Network policy retains its creation options because those are the feature being demonstrated.
- The icon copies the complete example, including initialization and cleanup. There is no visible “Copy full” text.
- The panel has a fixed 32rem height. The example list and code area scroll independently; language and copy controls remain above the scrolling code.
- TypeScript agent output now selects response/error using `success`, correcting the failure-display finding in the earlier audit.

Beelink checks passed on the exact committed source: frozen installation, strict component/data typechecking with Astro client types, full TypeScript programs and contextual snippets against Sandbox SDK 0.60.13, and Python parsing/compilation. All source hashes matched the commit. No hosted workloads were run.

Desktop browser inspection confirmed focused TypeScript and Python Files snippets, language highlighting, fixed panel presentation and icon-only copying. Clipboard content verification did not complete: browser control repeatedly timed out and the clipboard read was empty. Fresh phone coverage and a recorded interaction remain unchecked. These are open verification items; source/type checks do not replace them.

[Before: repeated initialization](homepage-audit/draft-desktop-quickstart.png) · [After: focused Files example](compact-examples/desktop-files-fixed.png).
The captures use different viewport dimensions; they establish content changes, not an exact pixel comparison.

The broader workflow story, first-run key instructions and missing Prime tile from the homepage audit remain separate work.
