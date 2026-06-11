# Sync incident

## Symptoms

- Elevated `sync/batch` 4xx/5xx in logs
- Users report workouts not appearing after offline session
- PostHog `sync_failed` spike (when instrumented)

## Diagnosis

1. Sentry: filter `sync` route errors
2. API logs: `Idempotency-Key` conflicts, validation errors
3. Redis availability (rate limits, queues)

## Mitigations

| Issue | Action |
|-------|--------|
| DB connection pool exhausted | Scale PgBouncer pool; restart api |
| Validation mismatch client/server | Identify app version skew; hotfix |
| Idempotency replay storm | Check duplicate keys; extend TTL if needed |

## User guidance

Ask affected users to open app online — sync queue flushes on `online` event. Pending badge should clear.

## Recovery verification

- E2E `athlete-journey.spec.ts` passes
- Sample user: offline set → online → history shows set
