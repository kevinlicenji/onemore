# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-history-analytics` (PR pending)

---

## Latest state

**Phase 6 — History, PR detection, analytics** on `feat/mvp1-history-analytics`:

- PR detection on set completion (`weight_pr`, `volume_pr`, `e1rm_pr`) — online upsert + sync batch
- e1RM formulas in `@onemore/shared` (AC-e1RM-01)
- API: `GET /history/sessions`, `GET /history/sessions/:id`, `GET /analytics/dashboard`
- Web: dashboard widgets (streak, volume, next/last workout, recent PRs)
- Web: `/history` list + session detail, PR celebration modal + `pr_achieved` PostHog event

**Phase 5** merged in `main` (PR #6).

---

## Next step

Merge Phase 6 PR, then **Phase 7 — GDPR export/delete, notifications, Sentry, PostHog catalog** per roadmap.

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
```
