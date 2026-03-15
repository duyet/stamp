#!/usr/bin/env bash
set -euo pipefail

# stamp.builder — Setup Cloudflare resources (D1 + R2) and apply migrations
# Usage: ./scripts/setup.sh [--remote]

WRANGLER="bunx wrangler"
DB_NAME="stamp-db"
BUCKET_NAME="stamp-images"
WRANGLER_CONFIG="wrangler.jsonc"

REMOTE=false
if [[ "${1:-}" == "--remote" ]]; then
  REMOTE=true
fi

echo "==> Setting up stamp.builder Cloudflare resources..."
echo ""

# --- D1 Database ---
echo "--- D1 Database: $DB_NAME ---"

# Check if database already exists
EXISTING_DB=$($WRANGLER d1 list --json 2>/dev/null | grep -o "\"uuid\":\"[^\"]*\"" | head -1 || true)
DB_ID=""

if $WRANGLER d1 list --json 2>/dev/null | grep -q "\"name\":\"$DB_NAME\""; then
  DB_ID=$($WRANGLER d1 list --json 2>/dev/null \
    | python3 -c "import sys,json; dbs=json.load(sys.stdin); print(next((d['uuid'] for d in dbs if d['name']=='$DB_NAME'),''))" 2>/dev/null || true)
  echo "  Database '$DB_NAME' already exists: $DB_ID"
else
  echo "  Creating D1 database '$DB_NAME'..."
  CREATE_OUTPUT=$($WRANGLER d1 create "$DB_NAME" 2>&1)
  echo "$CREATE_OUTPUT"
  DB_ID=$(echo "$CREATE_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  echo "  Created database: $DB_ID"
fi

# Update wrangler.jsonc with database_id if empty
if [[ -n "$DB_ID" ]]; then
  CURRENT_ID=$(grep -o '"database_id": *"[^"]*"' "$WRANGLER_CONFIG" | grep -o '"[^"]*"$' | tr -d '"')
  if [[ -z "$CURRENT_ID" ]]; then
    echo "  Updating $WRANGLER_CONFIG with database_id..."
    # Use perl for cross-platform in-place edit (avoids sed -i differences)
    perl -i -pe "s/\"database_id\": *\"\"/\"database_id\": \"$DB_ID\"/" "$WRANGLER_CONFIG"
    echo "  Updated database_id: $DB_ID"
  else
    echo "  database_id already set: $CURRENT_ID"
  fi
fi

echo ""

# --- R2 Bucket ---
echo "--- R2 Bucket: $BUCKET_NAME ---"

if $WRANGLER r2 bucket list 2>/dev/null | grep -q "$BUCKET_NAME"; then
  echo "  Bucket '$BUCKET_NAME' already exists."
else
  echo "  Creating R2 bucket '$BUCKET_NAME'..."
  $WRANGLER r2 bucket create "$BUCKET_NAME"
  echo "  Created bucket: $BUCKET_NAME"
fi

echo ""

# --- D1 Migrations ---
echo "--- Applying D1 migrations ---"

if [[ "$REMOTE" == true ]]; then
  echo "  Applying migrations to REMOTE database..."
  $WRANGLER d1 migrations apply "$DB_NAME" --remote
else
  echo "  Applying migrations to LOCAL database..."
  $WRANGLER d1 migrations apply "$DB_NAME" --local
fi

echo ""
echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'bun run preview' for local CF dev"
echo "  2. Run './scripts/setup.sh --remote' for production setup"
echo "  3. Run 'bun run deploy' to deploy"
