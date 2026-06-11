# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-programs` (PR pending)

---

## Latest state

**Phase 3 — Programs & exercise library** on `feat/mvp1-programs`:

- API: exercises list/search (tsvector), custom exercises, programs CRUD, publish, templates + apply
- Migration: `search_vector` on `exercise_library`
- Seed: 34 exercises + 4 program templates (`pnpm --filter @onemore/api seed`)
- Web: template picker, single-day program builder, credits page, dashboard links
- Shared schemas + api-client `ProgramsApi` / `ExercisesApi`
- CI: seed step after migrations

**Phase 2** merged in `main` (PR #3).

**Phase 1** merged in `main` (PR #2).

Phase 0 merged via PR #1.

---

## Next step

Merge Phase 3 PR, then **Phase 4 — Workouts**.

---

## Quick start

```bash
docker compose -f docker/compose.dev.yml up -d
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm --filter @onemore/api db:migrate
pnpm --filter @onemore/api seed
pnpm dev
```

- Web: http://localhost:3000/it
- API: http://localhost:4000/health

---

## Tests

```bash
pnpm test && pnpm build && pnpm test:e2e
```
