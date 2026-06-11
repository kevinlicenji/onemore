# OneMore — Project Checkpoint

**Updated:** 2026-06-11  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-hardening-beta` (PR pending)

---

## Latest state

**Phase 8 — Hardening & beta** on `feat/mvp1-hardening-beta`:

- E2E: `athlete-journey.spec.ts` (register → onboarding → template → workout → offline sync)
- A11y: touch-target spot-check + `docs/tests/wcag-workout-spot-check.md`
- k6: `tests/load/health.js`, `authenticated-read.js`
- Docker: `services/api/Dockerfile`, `apps/web/Dockerfile`, `docker/compose.prod.yml`
- CI/CD: `.github/workflows/deploy.yml` (GHCR), `e2e-nightly.yml`, `load-nightly.yml`
- Runbooks: deploy, restore, incident, GDPR export, sync
- Beta checklist: `docs/infra/beta-launch-checklist.md`

**Phase 7** merged in `main` (PR #8).

---

## Next step

Merge Phase 8 PR → configure VPS/staging → beta cohort → tag **`v0.1.0`**.

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
