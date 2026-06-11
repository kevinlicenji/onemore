# GDPR export failure

## Symptoms

- User reports no email after 24h
- `DataExportJob` stuck in `pending` or `failed`
- BullMQ worker errors in API logs

## Diagnosis

```bash
docker compose -f docker/compose.prod.yml logs api --tail=100 | grep -i export
```

Check job status via DB or `GET /api/v1/users/me/export/latest` as the user.

## Common causes

| Cause | Fix |
|-------|-----|
| Redis down | Restart redis; jobs run inline fallback when `REDIS_URL` unset |
| Disk full on export volume | Clear old exports; expand volume |
| Resend API key missing/invalid | Set `RESEND_API_KEY` in `.env.prod` |
| Email in spam | Resend dashboard + verify `EMAIL_FROM` domain |

## Manual retry

1. Identify `jobId` for user
2. Re-queue via admin script or user re-requests export (rate-limited)
3. Confirm files under `/data/exports/{userId}/{jobId}/`

## Escalation

If PII was exposed in logs — treat as P0 security incident.
