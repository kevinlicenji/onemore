# Incident response

**SLA:** Best-effort (internal target 99% uptime)

## Severity levels

| Level | Examples | Response |
|-------|----------|----------|
| P0 | API down, auth broken, data loss | Immediate — all hands |
| P1 | Sync failure spike, export job stuck | &lt; 4h — on-call backend |
| P2 | Elevated latency, single feature degraded | Next business day |

## Triage checklist

1. Confirm scope: Uptime Kuma, Sentry, user reports
2. Check recent deploys (`git log`, GHCR image tags)
3. Inspect API logs: `docker compose logs -f api --tail=200`
4. Check Postgres/Redis health in compose
5. Roll back if deploy-related (see [deploy-production.md](./deploy-production.md))

## Communication

- Internal: Slack `#onemore-incidents`
- Users: status page or email for P0 &gt; 30 min

## Specialized runbooks

- [gdpr-export-failure.md](./gdpr-export-failure.md)
- [sync-incident.md](./sync-incident.md)
- [restore-database.md](./restore-database.md)

## Post-incident

- Sentry issue resolved + linked to PR
- Short post-mortem within 48h for P0/P1
