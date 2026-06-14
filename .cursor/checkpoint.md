# OneMore — Project Checkpoint

**Updated:** 2026-06-14  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `main` (synced with `origin/main`)

---

## Latest state

**Dashboard KPI redesign** — commit `b9c2b19` on `main`:

- **Home UI:** blocco Costanza (🔥 streak settimane + striscia L–D + `X / Target`), confronto volume settimanale, CTA scheda, PR e serie del mese
- **Business logic:** allenamenti liberi contano nella striscia e nel target (può superare, es. `5/4`); target da scheda attiva o `trainingDaysPerWeek`
- **Architettura client-first:** KPI calcolati da IndexedDB (`completedSessions`, `personalRecords`, `nextWorkout`); invalidazione su `WORKOUT_SAVED` / `DELETED` / `EDITED` / `SYNC_COMPLETE`; sync background via `pullDelta` + hydrate
- **API:** `AnalyticsDashboard` esteso; `GET /analytics/personal-records` per hydrate offline; `computeDashboardKpis` condiviso in `@onemore/shared`
- **Test:** `dashboard-kpis.test.ts`, `analytics.service.test.ts`, `dashboard-store.test.ts` — typecheck verde

**Recenti su `main` (prima del dashboard):**

- `7603343` — workout UX polish, exercise search, settings tabs
- `331e1fb` — ghost session fix, gym workout UX
- `6036a50` — workout auto-finish, overlay exercise drag, per-day program edit

**Phase 8 — Hardening & beta** (branch `feat/mvp1-hardening-beta`, PR pending):

- E2E athlete journey, a11y spot-check, k6 load tests
- Docker prod, CI/CD deploy, runbooks, beta checklist

---

## Next step

1. **Test manuale dashboard** — workout libero → cerchietto verde + counter; multi-device sync
2. **Deploy su VPS** — pull `main` + rebuild Docker
3. Merge Phase 8 PR → staging → beta cohort → tag **`v0.1.0`**

---

## Quick start

```bash
docker compose -f docker/compose.dev.yml up -d
pnpm install
pnpm --filter @onemore/api db:migrate
pnpm --filter @onemore/api seed
pnpm dev
```

---

## Tests

```bash
pnpm test && pnpm build && pnpm test:e2e
k6 run tests/load/health.js
```
