# ADR 0007: Infrastructure and deployment

**Status:** Accepted  
**Date:** 2026-06-10

## Context

VPS Docker deploy, GitHub → pull → Docker, best-effort SLA, 10k MAU, EU market, team 10 people.

## Decision

### Hosting

- **EU VPS** (recommended: **Hetzner Frankfurt** CX41 or equivalent — 8 vCPU, 16GB RAM for app + DB + Redis MVP-1)
- All services via **Docker Compose** on VPS

### Compose services (MVP-1)

| Service | Image |
|---------|-------|
| `web` | Next.js standalone |
| `api` | Express API |
| `postgres` | postgres:16-alpine |
| `pgbouncer` | edoburu/pgbouncer |
| `redis` | redis:7-alpine |
| `nginx-proxy-manager` | Existing user choice — TLS termination, reverse proxy |

### Edge

- **Cloudflare** (free/pro): DNS, DDoS, WAF basic rules, CDN for static assets
- Origin: NPM on VPS — Cloudflare proxied orange cloud

### CI/CD

- **GitHub Actions:** lint, test, build images, push to **GHCR** (`ghcr.io/org/onemore-api`, `ghcr.io/org/onemore-web`)
- Deploy: SSH to VPS → `docker compose pull && docker compose up -d`
- Environments: **dev** (local), **staging**, **production**
- Staging: synthetic data only (no prod copy)

### Registry

- **GitHub Container Registry (GHCR)** — private images

### Object storage (phased — ADR 0009)

- MVP-1: no object storage
- MVP-2+: Cloudflare R2 (EU)

### Horizontal scaling

- MVP-1: **single API instance** stateless behind NPM
- Scale trigger: API CPU >70% sustained → second API container + Redis Socket adapter (MVP-2+)

### SLA

- **Best-effort** — no contractual uptime; internal target 99% monitored via Uptime Kuma

## Rationale

- Matches established workflow: local build → GitHub → VPS pull → Docker.
- GHCR integrates with GitHub Actions without extra cost.
- Cloudflare offloads TLS and static without managed k8s cost.
