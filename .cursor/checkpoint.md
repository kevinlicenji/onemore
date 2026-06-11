# OneMore — Project Checkpoint

**Updated:** 2026-06-11  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-gdpr-observability` (PR pending)

---

## Latest state

**Phase 7 — GDPR, notifications, observability** on `feat/mvp1-gdpr-observability`:

- GDPR export: `POST /users/me/export` → BullMQ (or inline) → JSON+CSV → email link
- Account deletion: `DELETE /users/me` → soft 30d → `hard-delete-users` cron
- Web Push VAPID: subscribe/unsubscribe + weekly workout reminder job
- Settings page: notification prefs, motivation level, export, delete account
- Sentry: `@sentry/node` (API) + `@sentry/nextjs` (web, when DSN set)
- PostHog: `POSTHOG_EVENTS` catalog in `@onemore/shared`
- PII logging: removed password reset URL from logs

**Phase 6** merged in `main` (PR #7).

---

## Next step

Merge Phase 7 PR, then **Phase 8 — Hardening & beta** (E2E, k6, prod compose, deploy).

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
