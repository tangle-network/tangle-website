# Compact homepage examples — Beelink verification

Commit: `821e597f54d52a61fef638e997a4aec89bb56a0e`. Snapshot hashes match all seven checked source/config files and the committed worktree.

**PASS:** frozen install; strict component/data TypeScript; 8 full TypeScript examples and 8 contextual snippets against published Sandbox SDK 0.60.13; 8 full Python examples and 8 snippets parsed/compiled. Required imports, cleanup registration, startup polling, extra imports and network policy retained. Ordinary snippets omit repeated setup; create is first. Display receives `snippet`; copy receives `fullCode`. Agent failures select `result.error`.

Host: `beelink1-wsl`, Node 24.21.0, repository-pinned pnpm 10.17.1, TypeScript 6.0.3, Python 3.12.3. SDK tarball integrity verified. Compiler uses `strict` and `skipLibCheck`.

No hosted sandbox calls, paid workloads, CI, broad build, browser clipboard or mobile checks. Short excerpts require the setup shown in Create a sandbox; copied examples include setup and require dependencies plus `TANGLE_API_KEY`. Parent owns rendered/clipboard proof.

The first scratch compiler invocation lacked Astro CSS ambient types; the final invocation includes real `astro/client.d.ts` and passes. No source changes were needed. Frozen install used the exact Mac brand 0.9.0 dependency; UI 11.15.1's existing brand ^1.10.0 peer mismatch remains outside this change. Install reported ignored esbuild/workerd scripts; no policy was changed and no build success is claimed.

See `receipt.json`, `snapshot.json`, `commit-match.json`, and the `beelink/` results. `check.mjs` is the retained initial combined run; `check-component.mjs` is the corrected final affected-component check. `component-typescript-final.json` supersedes the initial component result.
