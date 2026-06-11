# MVP-1 beta launch checklist (P8-05 – P8-08)

## P8-05 — Cloudflare DNS → NPM → VPS

- [ ] `app.onemore.com` → NPM → `web:3000`
- [ ] `api.onemore.com` → NPM → `api:4000`
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] TLS Full (strict) with valid origin certificate
- [ ] `WEB_APP_URL` / `API_PUBLIC_URL` match public URLs

## P8-06 — Uptime Kuma

- [ ] Monitor `GET https://api.onemore.com/health` (1 min interval)
- [ ] Monitor `GET https://app.onemore.com/it` (5 min interval)
- [ ] Alerts → Slack or email on 2 consecutive failures

## P8-07 — Security review

- [ ] Run [security.api.test.ts](../../services/api/src/test/security.api.test.ts) suite green
- [ ] npm audit high/critical resolved or accepted
- [ ] OAuth redirect URLs locked to production domains
- [ ] JWT keys rotated from dev fixtures
- [ ] Structured security review or external pentest scheduled before public launch

## P8-08 — Beta cohort (~50 users)

- [ ] Staging soak 1 week with internal team
- [ ] Invite list + feedback channel (Slack/form)
- [ ] Track [go-live criteria](../prd/OneMore_MVP_MoSCoW.md#mvp-1-go-live-criteria):
  - 95% sessions without sync failure
  - p95 set-log ≤ 2 taps
  - Onboarding completion ≥ 60%
  - Median time to first workout ≤ 10 min
  - Zero P0 security issues

## P8-10 — Release

- [ ] All P8 tasks complete
- [ ] Tag `v0.1.0` on `main`
- [ ] Publish release notes
