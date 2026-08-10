import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/collect-status.yml', import.meta.url), 'utf8');
const deployWorkflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const publisher = await readFile(new URL('./publish-status-history.sh', import.meta.url), 'utf8');

const requiredWorkflowText = [
  'group: production-deploy',
  'cancel-in-progress: false',
  'contents: write',
  'pull-requests: write',
  'fetch-depth: 0',
  'pnpm check:status-workflow',
  'bash scripts/publish-status-history.sh prepare',
  'Resolve proposed revision',
  'Build proposed status history',
  'Check proposed revision',
  'bash scripts/publish-status-history.sh merge',
  "if: steps.status.outputs.has_update == 'true'",
  'git switch --detach origin/master',
  'Resolve deploy revision',
  'Build persisted master',
  'Check deploy revision',
  'pnpm check:version',
  'Deploy to Cloudflare Pages',
];

const requiredPublisherText = [
  "UPDATE_BRANCH=\"${STATUS_UPDATE_BRANCH:-automation/status-history}\"",
  "HISTORY_PATH='public/status/history.json'",
  'git merge --no-edit "origin/${BASE_BRANCH}"',
  'assert_only_history_changes',
  'gh pr create',
  'gh pr ready "$pr_number" --repo "$REPOSITORY" --undo >/dev/null',
  'gh pr ready "$pr_number" --repo "$REPOSITORY" >/dev/null',
  'gh pr merge',
  'tangletools',
  '--match-head-commit "$expected_head"',
  'cmp --silent "$HISTORY_PATH" "$merged_history"',
  'select(.isCrossRepository == false)',
];

const forbiddenText = [
  /git push[^\n]*HEAD:master/,
  /--force(?:-with-lease)?\b/,
  /--admin\b/,
  /continue-on-error\s*:/,
  /\|\|\s*true/,
];

const failures = [];

const orderedWorkflowText = [
  'bash scripts/publish-status-history.sh prepare',
  'Resolve proposed revision',
  'Build proposed status history',
  'Check proposed revision',
  'bash scripts/publish-status-history.sh merge',
  'git switch --detach origin/master',
  'Resolve deploy revision',
  'Build persisted master',
  'Check deploy revision',
  'Deploy to Cloudflare Pages',
];
const orderedWorkflowIndexes = orderedWorkflowText.map((text) => workflow.indexOf(text));

for (let index = 1; index < orderedWorkflowIndexes.length; index += 1) {
  if (orderedWorkflowIndexes[index - 1] >= orderedWorkflowIndexes[index]) {
    failures.push('the workflow must validate before merging, then rebuild persisted master before deploying');
    break;
  }
}

for (const text of requiredWorkflowText) {
  if (!workflow.includes(text)) failures.push(`workflow is missing: ${text}`);
}

for (const text of requiredPublisherText) {
  if (!publisher.includes(text)) failures.push(`publisher is missing: ${text}`);
}

for (const text of ['group: production-deploy', 'cancel-in-progress: false']) {
  if (!deployWorkflow.includes(text)) failures.push(`deploy workflow is missing: ${text}`);
}

if (deployWorkflow.includes('scripts/collect-status.mjs')) {
  failures.push('deploy workflow must not publish an unreviewed status-history snapshot');
}

for (const pattern of forbiddenText) {
  if (pattern.test(workflow) || pattern.test(publisher)) {
    failures.push(`forbidden status workflow pattern: ${pattern}`);
  }
}

const revisionEnvironmentCount = workflow.match(/TANGLE_BUILD_REVISION:/g)?.length ?? 0;
if (revisionEnvironmentCount !== 2) {
  failures.push(`expected two revision-pinned builds, found ${revisionEnvironmentCount}`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Status workflow safety check passed');
}
