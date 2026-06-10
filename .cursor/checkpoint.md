# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-monorepo-bootstrap`

---

## Latest state

**Phase 0 foundation implemented** — monorepo boots locally with Docker, Prisma MVP-1 schema, Express health API, Next.js demo page.

---

## What exists

| Area | Status |
|------|--------|
| Turborepo monorepo | `apps/web`, `services/api`, `packages/*` |
| Docker dev stack | Postgres `:55432`, Redis `:6380`, PgBouncer `:6432` |
| Prisma schema | MVP-1 tables + partial PR unique indexes |
| API | `GET /health`, `GET /api/v1` |
| Web | Home page, IT/EN, API health check |
| CI | GitHub Actions lint, test, build, audit |

---

## Quick start

```bash
docker compose -f docker/compose.dev.yml up -d
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm --filter @onemore/api db:migrate
pnpm dev
```

- Web: http://localhost:3000/it
- API: http://localhost:4000/health

---

## Next step

**Phase 1 — Auth & users** per [IMPLEMENTATION_ROADMAP.md](../docs/IMPLEMENTATION_ROADMAP.md).
