# ADR 0008: Security, observability, and testing

**Status:** Accepted  
**Date:** 2026-06-10

## Decision

### Security

| Control | Implementation |
|---------|----------------|
| WAF / DDoS | Cloudflare + NPM |
| Rate limiting | Redis sliding window — login 5/15min/IP; API 300/min/user; sync 120/min/user |
| Secrets | Docker env files on VPS; migrate to Doppler if team grows |
| PII in logs | **Forbidden** — structured JSON logs with `user_id` only |
| Audit log | **All coach reads** on client PII/workouts + all writes — `audit_log` table |
| CSP | Strict CSP on web app from **MVP-2** coach routes |
| SAST / deps | **GitHub Dependabot + `npm audit` in CI** — fail on critical |
| Pentest | **Before public launch** — external or structured internal |
| Messaging E2E | **Signal-style double ratchet** or **libsodium** channel keys MVP-2 — keys exchanged online |
| Backup crypto | R2 backups encrypted at rest (provider default) |

### GDPR / legal (technical enablers)

- Self-service export: async job → Resend email with R2 signed URL (24h TTL)
- Soft delete 30 days → hard delete cron
- Fitness data: separate consent flag `fitness_data_consent`
- Age gate: block registration if `birth_year` &gt; current_year - 16
- Internal policy templates in `docs/legal/` (to be authored)

### Coach DPA (recommended — product/legal)

- Platform = processor for coach CRM notes; coach = independent controller for client relationship
- Template DPA in coach onboarding MVP-2 — **pending legal review**

### Observability

| Tool | Scope |
|------|-------|
| **Sentry** | Web + API errors, performance traces |
| **Uptime Kuma** | Self-hosted on VPS — HTTP checks staging/prod |
| **Structured logs** | `pino` → Docker logs; optional **Loki** MVP-2 if volume warrants |
| **PostHog EU Cloud** | Product analytics (no PII in events) |
| On-call | Slack/email alert from Uptime Kuma + Sentry — rotation doc in runbook |

### Feature flags

- MVP-1: env vars
- MVP-2: **Unleash** Docker sidecar (self-hosted, free)

### Performance targets

| Metric | Target |
|--------|--------|
| API read p95 | 300ms |
| API write p95 | 500ms |
| Sync batch (50 sets) p95 | 1s |
| Beta concurrent users | Load test 200–500 |

### Testing

| Layer | Tool |
|-------|------|
| Unit / integration | **Vitest** (api + packages) |
| API contracts | **OpenAPI** + Spectral lint in CI |
| E2E web | **Playwright** |
| Load | **k6** before public launch and major releases |
| Coverage | **≥80%** on sync engine, auth, algorithms — **100% target** on critical paths |

### Beta distribution

- Web only: staging URL + prod — no TestFlight MVP-1

## Rationale

- Sentry + Uptime Kuma fit VPS budget vs full Datadog.
- PostHog EU aligns with GDPR product analytics decision.
- Playwright covers responsive athlete + coach flows in one codebase.
