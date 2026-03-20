#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$HOME/.openclaw/workspace/.secrets"

cd "$PROJECT_DIR"

# Load Cloudflare credentials
if [[ -f "$SECRETS_DIR/cloudflare-api-token" && -f "$SECRETS_DIR/cloudflare-account-id" ]]; then
  export CLOUDFLARE_API_TOKEN
  export CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN="$(cat "$SECRETS_DIR/cloudflare-api-token")"
  CLOUDFLARE_ACCOUNT_ID="$(cat "$SECRETS_DIR/cloudflare-account-id")"
else
  echo "ERROR: Cloudflare credentials not found at $SECRETS_DIR"
  echo "Expected files: cloudflare-api-token, cloudflare-account-id"
  exit 1
fi

# Build
echo "Building site..."
./node_modules/.bin/astro build

# Deploy
echo "Deploying to Cloudflare Pages..."
./node_modules/.bin/wrangler pages deploy dist/client \
  --project-name=tangle-website \
  --branch="${1:-production}"

echo "Deploy complete."
