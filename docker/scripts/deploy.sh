#!/usr/bin/env bash
# Routine production deploy (pull, restart, migrate).
# Usage: ./docker/scripts/deploy.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker/compose.prod.yml"
ENV_FILE="${ROOT_DIR}/docker/.env.prod"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing ${ENV_FILE}. Copy docker/.env.prod.example first." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "==> Pulling images"
compose pull

echo "==> Restarting stack"
compose up -d

echo "==> Running database migrations"
compose exec -T api sh < "${ROOT_DIR}/docker/scripts/migrate.sh"

echo "==> Local health checks"
curl -fsS http://127.0.0.1:4000/health >/dev/null
curl -fsS -o /dev/null -w "web status: %{http_code}\n" http://127.0.0.1:3000/it

echo "Deploy completed."
