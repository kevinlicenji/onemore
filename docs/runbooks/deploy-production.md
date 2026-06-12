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
3. Configure NPM proxy hosts (see checklist printed by `first-deploy.sh`):
   - Web domain → `http://172.17.0.1:3000`
   - API domain → `http://172.17.0.1:4000`
4. Enable Cloudflare SSL mode **Full (strict)** with origin cert or Let's Encrypt via NPM
5. Pull images, start stack, migrate, and seed:

```bash
cd /opt/onemore
chmod +x docker/scripts/*.sh
./docker/scripts/first-deploy.sh
```

`first-deploy.sh` validates `docker/.env.prod`, starts the stack, runs migrations + seed, checks local health, then prints the NPM proxy checklist.

`seed.sh` is idempotent — use `./docker/scripts/first-deploy.sh --skip-seed` to re-run without seeding.

## Deploy (routine)

```bash
cd /opt/onemore
git pull origin main
./docker/scripts/deploy.sh
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
