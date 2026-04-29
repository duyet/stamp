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

set_secret() {
  local name="$1"
  local value="${!name:-}"

  if [ -n "$value" ]; then
    echo "--- $name: ${value:0:8}..."
    gh secret set "$name" --body "$value" --repo "$REPO"
    echo "    ✓ set"
    SECRETS_SET=$((SECRETS_SET + 1))
    return 0
  fi

  echo "--- $name: missing"
  return 1
}

# 1. Account ID
if set_secret CLOUDFLARE_ACCOUNT_ID; then
  :
else
  SECRETS_MISSING+=("CLOUDFLARE_ACCOUNT_ID")
fi

# 2. API Token
if set_secret CLOUDFLARE_API_TOKEN; then
  :
else
  SECRETS_MISSING+=("CLOUDFLARE_API_TOKEN")
fi

# 3. Admin allowlists
ADMIN_ALLOWLIST_SET=0
if [ -n "${ADMIN_USER_IDS:-}" ]; then
  echo "--- ADMIN_USER_IDS: ${ADMIN_USER_IDS:0:8}..."
  gh secret set ADMIN_USER_IDS --body "$ADMIN_USER_IDS" --repo "$REPO"
  echo "    ✓ set"
  SECRETS_SET=$((SECRETS_SET + 1))
  ADMIN_ALLOWLIST_SET=1
else
  echo "--- ADMIN_USER_IDS: missing"
fi

if [ -n "${ADMIN_EMAILS:-}" ]; then
  echo "--- ADMIN_EMAILS: ${ADMIN_EMAILS:0:8}..."
  gh secret set ADMIN_EMAILS --body "$ADMIN_EMAILS" --repo "$REPO"
  echo "    ✓ set"
  SECRETS_SET=$((SECRETS_SET + 1))
  ADMIN_ALLOWLIST_SET=1
else
  echo "--- ADMIN_EMAILS: missing"
fi

if [ "$ADMIN_ALLOWLIST_SET" -eq 0 ]; then
  SECRETS_MISSING+=("ADMIN_USER_IDS or ADMIN_EMAILS")
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
