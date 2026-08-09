#!/usr/bin/env bash

set -Eeuo pipefail

readonly BASE_BRANCH="${STATUS_BASE_BRANCH:-master}"
readonly UPDATE_BRANCH="${STATUS_UPDATE_BRANCH:-automation/status-history}"
readonly HISTORY_PATH='public/status/history.json'
readonly PR_TITLE='chore(status): update public status history'
readonly REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
readonly OUTPUT_FILE="${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
readonly APPROVAL_TIMEOUT_SECONDS="${STATUS_APPROVAL_TIMEOUT_SECONDS:-300}"
readonly APPROVAL_POLL_SECONDS="${STATUS_APPROVAL_POLL_SECONDS:-5}"

die() {
  echo "status history publication failed: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

assert_only_history_changes() {
  local changed_files
  changed_files="$(git diff --name-only "origin/${BASE_BRANCH}...HEAD")"

  if [[ -n "$changed_files" && "$changed_files" != "$HISTORY_PATH" ]]; then
    echo 'The automation branch contains unexpected changes:' >&2
    echo "$changed_files" >&2
    die "only ${HISTORY_PATH} may be published by this workflow"
  fi
}

prepare_branch() {
  git config user.name 'github-actions[bot]'
  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git fetch origin "$BASE_BRANCH"

  if git ls-remote --exit-code --heads origin "refs/heads/${UPDATE_BRANCH}" >/dev/null 2>&1; then
    git fetch origin "${UPDATE_BRANCH}:refs/remotes/origin/${UPDATE_BRANCH}"
    git switch --create "$UPDATE_BRANCH" "origin/${UPDATE_BRANCH}"
    git merge --no-edit "origin/${BASE_BRANCH}"
  else
    git switch --create "$UPDATE_BRANCH" "origin/${BASE_BRANCH}"
  fi

  assert_only_history_changes
}

find_open_pr() {
  local count
  count="$(
    gh pr list \
      --repo "$REPOSITORY" \
      --state open \
      --base "$BASE_BRANCH" \
      --head "$UPDATE_BRANCH" \
      --json number,isCrossRepository \
      --jq '[.[] | select(.isCrossRepository == false)] | length'
  )"

  [[ "$count" =~ ^[0-9]+$ ]] || die 'GitHub returned an invalid pull request count'
  (( count <= 1 )) || die "found ${count} open pull requests for ${UPDATE_BRANCH}"

  if (( count == 1 )); then
    gh pr list \
      --repo "$REPOSITORY" \
      --state open \
      --base "$BASE_BRANCH" \
      --head "$UPDATE_BRANCH" \
      --json number,isCrossRepository \
      --jq '[.[] | select(.isCrossRepository == false)][0].number'
  fi
}

open_or_refresh_pr() {
  local pr_number
  pr_number="$(find_open_pr)"

  if [[ -z "$pr_number" ]]; then
    local pr_url
    pr_url="$(
      gh pr create \
        --repo "$REPOSITORY" \
        --base "$BASE_BRANCH" \
        --head "$UPDATE_BRANCH" \
        --title "$PR_TITLE" \
        --body $'Automated six-hour service reachability update.\n\nThe workflow restricts this pull request to `public/status/history.json`, builds the site before merging, and waits for the configured independent reviewer to approve the exact commit.'
    )"
    pr_number="$(gh pr view "$pr_url" --repo "$REPOSITORY" --json number --jq '.number')"
  fi

  local is_draft
  is_draft="$(gh pr view "$pr_number" --repo "$REPOSITORY" --json isDraft --jq '.isDraft')"
  if [[ "$is_draft" == 'false' ]]; then
    gh pr ready "$pr_number" --repo "$REPOSITORY" --undo >/dev/null
  fi
  gh pr ready "$pr_number" --repo "$REPOSITORY" >/dev/null

  printf '%s\n' "$pr_number"
}

prepare_update() {
  prepare_branch
  node scripts/collect-status.mjs

  if ! git diff --quiet -- "$HISTORY_PATH"; then
    git add "$HISTORY_PATH"
    git commit -m "$PR_TITLE"
  fi

  assert_only_history_changes

  if git diff --quiet "origin/${BASE_BRANCH}...HEAD" -- "$HISTORY_PATH"; then
    echo 'No status history changes'
    {
      echo 'has_update=false'
      echo "head_sha=$(git rev-parse HEAD)"
    } >> "$OUTPUT_FILE"
    return
  fi

  git push --set-upstream origin "$UPDATE_BRANCH"

  local pr_number head_sha pr_url
  pr_number="$(open_or_refresh_pr)"
  head_sha="$(git rev-parse HEAD)"
  pr_url="$(gh pr view "$pr_number" --repo "$REPOSITORY" --json url --jq '.url')"

  {
    echo 'has_update=true'
    echo "head_sha=${head_sha}"
    echo "pr_number=${pr_number}"
    echo "pr_url=${pr_url}"
  } >> "$OUTPUT_FILE"

  echo "Published ${HISTORY_PATH} at ${pr_url} (${head_sha})"
}

wait_for_approval_and_merge() {
  local pr_number="${STATUS_PR_NUMBER:?STATUS_PR_NUMBER is required}"
  local expected_head="${STATUS_HEAD_SHA:?STATUS_HEAD_SHA is required}"
  local deadline=$((SECONDS + APPROVAL_TIMEOUT_SECONDS))

  while (( SECONDS < deadline )); do
    local pr_state state is_draft review_decision merge_state actual_head
    pr_state="$(
      gh pr view "$pr_number" \
        --repo "$REPOSITORY" \
        --json state,isDraft,reviewDecision,mergeStateStatus,headRefOid \
        --jq '[.state, (.isDraft | tostring), (.reviewDecision // ""), .mergeStateStatus, .headRefOid] | join("|")'
    )"
    IFS='|' read -r state is_draft review_decision merge_state actual_head <<< "$pr_state"

    [[ "$state" == 'OPEN' ]] || die "pull request #${pr_number} is ${state}"
    [[ "$is_draft" == 'false' ]] || die "pull request #${pr_number} is still a draft"
    [[ "$actual_head" == "$expected_head" ]] || die "pull request head changed from ${expected_head} to ${actual_head}"

    if [[ "$review_decision" == 'CHANGES_REQUESTED' ]]; then
      die "pull request #${pr_number} has requested changes"
    fi

    if [[ "$merge_state" == 'DIRTY' ]]; then
      die "pull request #${pr_number} conflicts with ${BASE_BRANCH}"
    fi

    if [[ "$review_decision" == 'APPROVED' ]]; then
      local trusted_approvals
      trusted_approvals="$(
        gh api "repos/${REPOSITORY}/pulls/${pr_number}/reviews?per_page=100" \
          --jq "[.[] | select(.user.login == \"tangletools\" and .state == \"APPROVED\" and .commit_id == \"${expected_head}\")] | length"
      )"
      [[ "$trusted_approvals" =~ ^[0-9]+$ ]] || die 'GitHub returned an invalid approval count'

      if (( trusted_approvals > 0 )); then
        gh pr merge "$pr_number" \
          --repo "$REPOSITORY" \
          --squash \
          --match-head-commit "$expected_head" \
          --subject "$PR_TITLE" \
          --body 'Generated by the scheduled public status collector.'
        break
      fi
    fi

    echo "Waiting for independent approval of #${pr_number}: review=${review_decision:-REVIEW_REQUIRED}, merge=${merge_state}"
    sleep "$APPROVAL_POLL_SECONDS"
  done

  local merged_pr merged_state merge_sha
  merged_pr="$(
    gh pr view "$pr_number" \
      --repo "$REPOSITORY" \
      --json state,mergeCommit \
      --jq '[.state, .mergeCommit.oid] | join("|")'
  )"
  IFS='|' read -r merged_state merge_sha <<< "$merged_pr"
  [[ "$merged_state" == 'MERGED' ]] || die "pull request #${pr_number} was not approved and merged within ${APPROVAL_TIMEOUT_SECONDS}s"

  git fetch origin "$BASE_BRANCH"

  local merged_history
  merged_history="$(mktemp)"
  git show "origin/${BASE_BRANCH}:${HISTORY_PATH}" > "$merged_history"
  if ! cmp --silent "$HISTORY_PATH" "$merged_history"; then
    rm -f "$merged_history"
    die "${BASE_BRANCH} does not contain the generated status history"
  fi
  rm -f "$merged_history"

  echo "Merged pull request #${pr_number} as ${merge_sha}; ${HISTORY_PATH} matches ${BASE_BRANCH}"
}

main() {
  require_command git
  require_command gh
  require_command node
  require_command cmp

  case "${1:-}" in
    prepare)
      prepare_update
      ;;
    merge)
      wait_for_approval_and_merge
      ;;
    *)
      die 'usage: publish-status-history.sh prepare|merge'
      ;;
  esac
}

main "$@"
