#!/usr/bin/env bash
# Audit every marketing page with `bad design-audit`.
# Usage: ./scripts/bad-batch.sh [base-url]
#   base-url defaults to http://localhost:4321 (Astro dev server)
#
# Defaults to direct OpenAI (Drew's router sub is anonymous-tier 5/day,
# which caps a 9-page batch). Override with TANGLE_USER=1 to route via
# router (5/day cap applies). Writes per-page report + flat scorecard.

set -euo pipefail

BASE_URL="${1:-http://localhost:4321}"
SECRETS=~/company/devops/secrets/agent-state.env

if [[ ! -f "$SECRETS" ]]; then
  echo "missing $SECRETS — can't decrypt TANGLE_ROUTER_USER_KEY" >&2
  exit 1
fi

if [[ "${TANGLE_USER:-0}" == "1" ]]; then
  export OPENAI_API_KEY="$(dotenvx get TANGLE_ROUTER_USER_KEY -f "$SECRETS")"
  export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://router.tangle.tools/v1}"
else
  export OPENAI_API_KEY="$(dotenvx get OPENAI_API_KEY -f "$SECRETS")"
  export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.openai.com/v1}"
fi
# @ai-sdk/openai reads OPENAI_BASE_URL natively; bad's documented LLM_BASE_URL is
# NOT plumbed through cli-design-audit.js, so we set the SDK env var directly.
export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://router.tangle.tools/v1}"
# Free-tier model on Tangle Router (default gpt-5.4 requires credits).
MODEL="${BAD_MODEL:-gpt-5.5}"  # gpt-5.5 (released 2026-04-23) gives product-strategy critique, not CSS noise

if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "TANGLE_ROUTER_USER_KEY decrypt returned empty" >&2
  exit 1
fi

PAGES=(
  /
  /overview
  /operators
  /developers
  /stake
  /services/blueprint-agent
  /services/sandbox
  /services/browser-agent
  /brand-kit
)

TS="$(date +%Y%m%dT%H%M%SZ)"
OUT_DIR="audit-results/batch-$TS"
mkdir -p "$OUT_DIR"
SCORECARD="$OUT_DIR/scorecard.tsv"
echo -e "page\tscore\tfindings\treport" > "$SCORECARD"

for path in "${PAGES[@]}"; do
  URL="$BASE_URL$path"
  SLUG="$(echo "$path" | sed 's|^/||; s|/|_|g; s|^$|home|')"
  : "${SLUG:=home}"
  LOG="$OUT_DIR/$SLUG.log"

  echo "▶ $URL → $LOG"
  if bad design-audit --url "$URL" --provider openai --model "$MODEL" --pages 1 > "$LOG" 2>&1; then
    SCORE="$(grep -oE 'Avg: [0-9.]+/10' "$LOG" | tail -1 | grep -oE '[0-9.]+/10' | head -1)"
    FINDINGS="$(grep -oE '[0-9]+ findings' "$LOG" | tail -1)"
    REPORT="$(grep -oE 'audit-results/[^ ]+/report\.md' "$LOG" | tail -1)"
    echo -e "$path\t${SCORE:-?}\t${FINDINGS:-?}\t${REPORT:-?}" >> "$SCORECARD"
  else
    echo -e "$path\tFAIL\t?\tsee $LOG" >> "$SCORECARD"
  fi
done

echo
echo "=== scorecard ==="
column -t -s $'\t' "$SCORECARD"
echo
echo "scorecard → $SCORECARD"
