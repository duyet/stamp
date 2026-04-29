#!/usr/bin/env bash
set -euo pipefail

# Sync deploy-time environment values into Cloudflare Worker secrets.
# Values are read from the current environment, after loading local env files.

for env_file in .env .env.local .env.production .env.production.local; do
	if [ -f "$env_file" ]; then
		set -a
		# shellcheck disable=SC1090
		source "$env_file"
		set +a
	fi
done

sync_secret() {
	local name="$1"
	local value="${!name:-}"

	if [ -z "$value" ]; then
		echo "--- $name: not set, skipping"
		return
	fi

	echo "--- $name: syncing"
	printf "%s" "$value" | bunx wrangler secret put "$name"
}

echo "--- Syncing Worker secrets ---"
sync_secret ADMIN_USER_IDS
sync_secret ADMIN_EMAILS
sync_secret CLOUDFLARE_API_TOKEN
