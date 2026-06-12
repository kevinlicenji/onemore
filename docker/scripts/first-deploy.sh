#!/usr/bin/env bash
# First production deploy on the VPS (Postgres migrate + catalog seed).
# Run from the repo root after filling docker/.env.prod.
#
# Usage:
#   ./docker/scripts/first-deploy.sh
#   ./docker/scripts/first-deploy.sh --skip-seed   # re-run without seeding
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker/compose.prod.yml"
ENV_FILE="${ROOT_DIR}/docker/.env.prod"
SKIP_SEED=0

for arg in "$@"; do
  case "$arg" in
    --skip-seed)
      SKIP_SEED=1
      ;;
    -h | --help)
      echo "Usage: ./docker/scripts/first-deploy.sh [--skip-seed]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [ -z "$line" ]; then
    return 1
  fi
  printf '%s' "${line#*=}"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "Create ${ENV_FILE} from docker/.env.prod.example and fill secrets first." >&2
    exit 1
  fi
}

require_nonempty_env() {
  local key="$1"
  local value
  value="$(read_env_value "$key" || true)"
  if [ -z "${value}" ]; then
    echo "Set ${key} in ${ENV_FILE} before deploying." >&2
    exit 1
  fi
}

require_env_not_placeholder() {
  local key="$1"
  local forbidden="$2"
  local value
  value="$(read_env_value "$key" || true)"
  if [ "$value" = "$forbidden" ]; then
    echo "Replace placeholder ${key} in ${ENV_FILE} before deploying." >&2
    exit 1
  fi
}

wait_for_service_healthy() {
  local service="$1"
  local attempts="${2:-40}"
  local delay_seconds="${3:-3}"
  local attempt=1

  echo "Waiting for ${service} to become healthy..."
  while [ "$attempt" -le "$attempts" ]; do
    if compose ps --status running --format json "$service" 2>/dev/null | grep -q '"Health":"healthy"'; then
      echo "${service} is healthy."
      return 0
    fi

    if compose ps --status running "$service" 2>/dev/null | grep -q "(healthy)"; then
      echo "${service} is healthy."
      return 0
    fi

    sleep "$delay_seconds"
    attempt=$((attempt + 1))
  done

  echo "${service} did not become healthy in time." >&2
  compose ps
  compose logs --tail=80 "$service" || true
  exit 1
}

print_npm_checklist() {
  local web_app_url api_public_url web_host api_host
  web_app_url="$(read_env_value WEB_APP_URL)"
  api_public_url="$(read_env_value API_PUBLIC_URL)"
  web_host="${web_app_url#https://}"
  web_host="${web_host#http://}"
  web_host="${web_host%%/*}"
  api_host="${api_public_url#https://}"
  api_host="${api_host#http://}"
  api_host="${api_host%%/*}"

  cat <<EOF

Nginx Proxy Manager (already on this VPS)
---------------------------------------
Create or verify these Proxy Hosts:

1) Web app
   - Domain Names: ${web_host}
   - Scheme: http
   - Forward Hostname / IP: 172.17.0.1
   - Forward Port: 3000
   - Websockets Support: ON
   - Block Common Exploits: ON
   - SSL: request a new certificate (Let's Encrypt) or use your Cloudflare origin cert

2) API
   - Domain Names: ${api_host}
   - Scheme: http
   - Forward Hostname / IP: 172.17.0.1
   - Forward Port: 4000
   - Websockets Support: ON
   - Block Common Exploits: ON
   - SSL: same as above

If 172.17.0.1 does not work from the NPM container, use the VPS private IP
or host.docker.internal (Docker 20.10+ on Linux).

Cloudflare: orange cloud ON, SSL mode Full (strict).

Public checks:
  curl -fsS ${api_public_url}/health
  curl -fsS -o /dev/null -w "%{http_code}" ${web_app_url}/it

EOF
}

main() {
  require_command docker
  require_env_file

  require_nonempty_env POSTGRES_PASSWORD
  require_nonempty_env JWT_PRIVATE_KEY
  require_nonempty_env JWT_PUBLIC_KEY
  require_nonempty_env WEB_APP_URL
  require_nonempty_env API_PUBLIC_URL
  require_env_not_placeholder POSTGRES_PASSWORD change-me-strong-password

  cd "$ROOT_DIR"

  if ! docker manifest inspect "$(read_env_value ONEMORE_API_IMAGE || echo ghcr.io/kevinlicenji/onemore-api:latest)" >/dev/null 2>&1; then
    echo "Warning: cannot inspect API image on GHCR. Run 'docker login ghcr.io' if pull fails." >&2
  fi

  echo "==> Pulling images"
  compose pull

  echo "==> Starting stack"
  compose up -d

  wait_for_service_healthy api
  wait_for_service_healthy web

  echo "==> Running database migrations"
  compose exec -T api sh < "${ROOT_DIR}/docker/scripts/migrate.sh"

  if [ "$SKIP_SEED" -eq 0 ]; then
    echo "==> Seeding exercises and templates"
    compose exec -T api sh < "${ROOT_DIR}/docker/scripts/seed.sh"
  else
    echo "==> Skipping seed (--skip-seed)"
  fi

  echo "==> Local health checks"
  curl -fsS http://127.0.0.1:4000/health >/dev/null
  curl -fsS -o /dev/null -w "web status: %{http_code}\n" http://127.0.0.1:3000/it

  echo "First deploy completed."
  print_npm_checklist
}

main "$@"
