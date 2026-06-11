# OneMore — Project Checkpoint

**Updated:** 2026-06-11  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-onboarding` (PR pending)

---

## Latest state

**Phase 2 — Onboarding** on `feat/mvp1-onboarding`:

- API: PATCH `/onboarding`, POST `/onboarding/complete`
- Web: 5-step wizard, choose-program, empty dashboard, PostHog events
- Phase 1 merged in `main` (`7e065c8`):

- API: register/login/logout/refresh, forgot/reset password, OAuth Google+Apple, `/users/me`, rate limiting, audit log, OpenAPI + Spectral
- Web: login/register/forgot-password pages, in-memory access token + refresh cookie proxy
- CI: Postgres + Redis services, integration tests, OpenAPI lint

Phase 0 merged via PR #1 (`1fc26e8`).

---

## Next step

Merge Phase 2 PR, then **Phase 3 — Programs & exercise library**.

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
