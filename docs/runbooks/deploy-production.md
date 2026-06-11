# Deploy production

**Owner:** Backend  
**Related:** [ADR 0007](../adr/0007-infrastructure-and-deployment.md), `docker/compose.prod.yml`

## Prerequisites

- VPS with Docker and Docker Compose v2
- Nginx Proxy Manager (NPM) for TLS termination
- Cloudflare DNS (orange cloud) pointing to VPS
- GHCR images built via `.github/workflows/deploy.yml`
- `.env.prod` on server (copy from `docker/.env.prod.example`)

## First-time setup

1. Clone repo on VPS: `/opt/onemore`
2. Copy `docker/.env.prod.example` → `docker/.env.prod` and fill secrets
3. Configure NPM proxy hosts:
   - `app.onemore.com` → `web:3000`
   - `api.onemore.com` → `api:4000`
4. Enable Cloudflare SSL mode **Full (strict)** with origin cert or Let's Encrypt via NPM

## Deploy (routine)

```bash
cd /opt/onemore
git pull origin main
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod pull
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod exec -T api \
  pnpm exec prisma migrate deploy
```

Or trigger GitHub Actions `Deploy` workflow (builds images + optional SSH to staging when secrets are set).

## Verify

```bash
curl -fsS https://api.onemore.com/health
curl -fsS -o /dev/null -w "%{http_code}" https://app.onemore.com/it
```

## Rollback

```bash
export ONEMORE_API_IMAGE=ghcr.io/kevinlicenji/onemore-api:<previous-sha>
export ONEMORE_WEB_IMAGE=ghcr.io/kevinlicenji/onemore-web:<previous-sha>
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d
```

## Post-deploy

- Check Sentry for new errors (15 min)
- Confirm Uptime Kuma monitors green
- Smoke test: register → onboarding → workout on staging before prod promotion
