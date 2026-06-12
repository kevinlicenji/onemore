#!/bin/sh
# Run inside the api container: docker compose ... exec -T api sh < docker/scripts/migrate.sh
set -eu

cd /app/services/api

if [ -f ./node_modules/prisma/build/index.js ]; then
  PRISMA_CLI=./node_modules/prisma/build/index.js
elif [ -f ../../node_modules/prisma/build/index.js ]; then
  PRISMA_CLI=../../node_modules/prisma/build/index.js
else
  echo "prisma CLI not found in api image" >&2
  exit 1
fi

MIGRATE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
echo "Running prisma migrate deploy (direct Postgres when DIRECT_DATABASE_URL is set)..."
DATABASE_URL="$MIGRATE_URL" node "$PRISMA_CLI" migrate deploy
