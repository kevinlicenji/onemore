# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-workouts` (PR pending)

---

## Latest state

**Phase 4 — Workout execution (online-first)** on `feat/mvp1-workouts`:

- API: start/resume sessions, set logging, complete/abandon, program day rotation
- Auto-fill weight/reps from last completed session per exercise
- Web: start page (programmed + free), active workout UI with rest timer
- Free workout: add exercises via search

**Phase 3** merged in `main` (PR #4).

**Phase 2** merged in `main` (PR #3).

**Phase 1** merged in `main` (PR #2).

Phase 0 merged via PR #1.

---

## Next step

Merge Phase 4 PR, then **Phase 5 — Offline sync (Dexie + `/sync/batch`)** per roadmap.

---

## Quick start

```bash
docker compose -f docker/compose.dev.yml up -d
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
