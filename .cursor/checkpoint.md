# OneMore — Project Checkpoint

**Updated:** 2026-06-11  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `main`

---

## Latest state

**Phase 0 merged** — PR #1 in `main` (`1fc26e8`).

Monorepo, API skeleton, Prisma MVP-1, Next.js demo, Docker dev stack, full test suite + CI green.

---

## Next step

**Phase 1 — Auth & users** on branch `feat/mvp1-auth`.

See [IMPLEMENTATION_ROADMAP.md](../docs/IMPLEMENTATION_ROADMAP.md) § Phase 1.

```bash
git checkout main && git pull
git checkout -b feat/mvp1-auth
```

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

## Tests

24 Vitest + 6 Playwright — see [docs/tests/README.md](../docs/tests/README.md)

```bash
pnpm test && pnpm build && pnpm test:e2e
```
