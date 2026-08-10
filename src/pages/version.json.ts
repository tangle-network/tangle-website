import type { APIRoute } from 'astro';

export const prerender = true;

const revisionInput = import.meta.env.TANGLE_BUILD_REVISION?.trim();
const fullGitSha = /^[0-9a-f]{40}$/i;

if (revisionInput && !fullGitSha.test(revisionInput)) {
  throw new Error('TANGLE_BUILD_REVISION must be a full 40-character Git SHA');
}

const revision = revisionInput?.toLowerCase() ?? null;
const source = revision === null
  ? 'local-unversioned'
  : import.meta.env.GITHUB_ACTIONS === 'true'
    ? 'github-actions'
    : 'explicit-build-environment';

export const GET: APIRoute = () => new Response(`${JSON.stringify({ revision, source })}\n`, {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});
