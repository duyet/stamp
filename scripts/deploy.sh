#!/usr/bin/env bash
set -euo pipefail

# stamp.builders — Build, migrate, and deploy
# Usage: ./scripts/deploy.sh

echo "==> Deploying stamp.builders..."
echo ""

set -a
for env_file in .env .env.local .env.production .env.production.local; do
	if [ -f "$env_file" ]; then
		source "$env_file"
	fi
done
set +a

# 1. Remote migrations
echo "--- Applying D1 migrations (remote) ---"
bunx wrangler d1 migrations apply stamp-db --remote

echo ""

# 2. Build + Deploy
echo "--- Building and deploying ---"
bun run deploy

echo ""
echo "==> Deploy complete!"
