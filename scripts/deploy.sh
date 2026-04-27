#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VAULT="$HOME/company/devops/secrets/agent-state.env"

cd "$PROJECT_DIR"

# Re-exec under dotenvx so CLOUDFLARE_* are loaded from the encrypted vault
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if [[ ! -f "$VAULT" ]]; then
    echo "ERROR: secrets vault not found at $VAULT" >&2
    exit 1
  fi
  exec dotenvx run -f "$VAULT" --overload --quiet -- "$0" "$@"
fi
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID

# Build
echo "Building site..."
./node_modules/.bin/astro build

# Deploy
echo "Deploying to Cloudflare Pages..."
./node_modules/.bin/wrangler pages deploy dist/client \
  --project-name=tangle-website \
  --branch="${1:-production}"

echo "Deploy complete."
