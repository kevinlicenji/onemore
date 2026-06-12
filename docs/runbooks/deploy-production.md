# Deploy production

**Owner:** Backend  
**Related:** [ADR 0007](../adr/0007-infrastructure-and-deployment.md), `docker/compose.prod.yml`

## Prerequisites

- VPS with Docker and Docker Compose v2
- Nginx Proxy Manager (NPM) for TLS termination
- Cloudflare DNS (orange cloud) pointing to VPS
- GHCR images built via `.github/workflows/deploy.yml`
- `docker login ghcr.io` on the VPS (PAT with `read:packages`)
- `docker/.env.prod` on server (copy from `docker/.env.prod.example`)

## First-time setup

1. Clone repo on VPS: `/opt/onemore`
2. Copy `docker/.env.prod.example` → `docker/.env.prod` and fill secrets (JWT, Postgres, URLs)
3. Configure NPM proxy hosts:
   - `app.onemore.com` → `web:3000`
   - `api.onemore.com` → `api:4000`
4. Enable Cloudflare SSL mode **Full (strict)** with origin cert or Let's Encrypt via NPM
5. Pull images and start the stack (see below)
6. Run migrations and seed on the **empty** database:

```bash
cd /opt/onemore
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod exec -T api sh < docker/scripts/migrate.sh
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod exec -T api sh < docker/scripts/seed.sh
```

`seed.sh` is idempotent — safe to re-run, but only required on first deploy.

## Deploy (routine)

```bash
cd /opt/onemore
git pull origin main
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod pull
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod exec -T api sh < docker/scripts/migrate.sh
```

Or trigger GitHub Actions `Deploy` workflow (builds images + optional SSH to staging when secrets are set).

Migrations use `DIRECT_DATABASE_URL` (Postgres) automatically — not PgBouncer transaction pooling.

## Verify

```bash
curl -fsS https://api.onemore.com/health
curl -fsS -o /dev/null -w "%{http_code}" https://app.onemore.com/it
```

Smoke on staging: register → onboarding → template → workout → refresh session (wait 15+ min or force token expiry).

## Rollback

```bash
export ONEMORE_API_IMAGE=ghcr.io/kevinlicenji/onemore-api:<previous-sha>
export ONEMORE_WEB_IMAGE=ghcr.io/kevinlicenji/onemore-web:<previous-sha>
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d
```

## Post-deploy

- Check Sentry for new errors (15 min)
- Confirm Uptime Kuma monitors green
- Smoke test on staging before prod promotion
