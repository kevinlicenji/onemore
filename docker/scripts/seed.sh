#!/bin/sh
# Idempotent catalog seed — run once on a fresh database.
# docker compose ... exec -T api sh < docker/scripts/seed.sh
set -eu

cd /app/services/api

if [ ! -f dist/seed/index.js ]; then
  echo "Compiled seed bundle missing — rebuild the api image." >&2
  exit 1
fi

SEED_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
echo "Running production seed (exercises + templates)..."
DATABASE_URL="$SEED_URL" node dist/seed/index.js
