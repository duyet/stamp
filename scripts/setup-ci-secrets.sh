#!/usr/bin/env bash
set -euo pipefail

# stamp.builders — Set up GitHub Actions secrets for Cloudflare deployment
# Usage: ./scripts/setup-ci-secrets.sh
#
# Loads variables from .env.local if present, then sets GitHub secrets.
# Prerequisites:
#   - gh CLI authenticated (gh auth login)

REPO="duyet/stamp"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "==> Setting up CI secrets for $REPO"
echo ""

# Load .env.local if it exists
ENV_FILE="$PROJECT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  echo "--- Loading $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "--- No .env.local found, using environment variables"
fi
echo ""

# Track what we set
SECRETS_SET=0
SECRETS_MISSING=()

# 1. Account ID
if [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "--- CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:0:8}..."
  gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID" --repo "$REPO"
  echo "    ✓ set"
  SECRETS_SET=$((SECRETS_SET + 1))
else
  echo "--- CLOUDFLARE_ACCOUNT_ID: missing"
  SECRETS_MISSING+=("CLOUDFLARE_ACCOUNT_ID")
fi

# 2. API Token
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "--- CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:0:8}..."
  gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN" --repo "$REPO"
  echo "    ✓ set"
  SECRETS_SET=$((SECRETS_SET + 1))
else
  echo "--- CLOUDFLARE_API_TOKEN: missing"
  SECRETS_MISSING+=("CLOUDFLARE_API_TOKEN")
fi

echo ""

if [ ${#SECRETS_MISSING[@]} -gt 0 ]; then
  echo "⚠ Missing: ${SECRETS_MISSING[*]}"
  echo "  Add them to .env.local and re-run, or set manually:"
  for secret in "${SECRETS_MISSING[@]}"; do
    echo "    gh secret set $secret --repo $REPO"
  done
  exit 1
fi

echo "==> Done! $SECRETS_SET secrets set. Push to main to trigger deploy."
