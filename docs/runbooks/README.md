# Operational Runbooks

**Status:** TODO — create before production launch.

| Runbook | Priority |
|---------|----------|
| `deploy-production.md` | P0 — GitHub Actions → GHCR → VPS pull |
| `restore-database.md` | P0 — R2 backup restore, RTO 4h |
| `incident-response.md` | P0 — best-effort SLA, Slack alerts |
| `gdpr-export-failure.md` | P1 |
| `sync-incident.md` | P1 — elevated sync failure rate |

Reference: [Technical Spec v1](../Technical_Spec_v1.md) §11–12.
