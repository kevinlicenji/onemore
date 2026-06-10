# ADR 0006: Authentication and identity

**Status:** Accepted  
**Date:** 2026-06-10

## Context

Self-hosted VPS, OAuth Apple + Google from V1, optional MFA, GDPR, future Enterprise SSO, web SPA security.

## Decision

### Auth implementation

- **Custom auth module** in Express (not Supabase/Auth0) for full VPS control
- Libraries: `bcrypt` (passwords), `jose` (JWT), `arctic` (OAuth 2.0 Apple + Google)
- Password breach check: **Have I Been Pwned** k-anonymity API on registration/password change

### Session model

- **Access JWT:** 15 min, signed RS256, payload: `user_id`, `roles[]`
- **Refresh token:** 7 days, **httpOnly Secure SameSite=Strict cookie**, rotated on use
- Access token: **memory only** in SPA (not localStorage) — refresh via cookie on app load
- SPA uses Next.js middleware + API route proxy for cookie handling

### OAuth (MVP-1)

- **Apple Sign In** (required for future iOS parity)
- **Google Sign In**
- Account linking: same verified email → single `user_id`; user prompted to link if email exists

### MFA (optional)

- TOTP via `otplib` — opt-in in settings; recommended prompt for coach accounts MVP-2

### Passwordless

- **Deferred to MVP-2** (magic link via Resend) — not V1 scope

### Username policy (product rule)

- Unique, case-insensitive
- **First change:** allowed anytime after signup
- **Subsequent changes:** max once per 6 months; minimum 30 days after first change
- Enforced server-side with `username_changed_at` audit

### Enterprise SSO (ADR 0010)

- OIDC config table stub in V1; no SSO login until Enterprise tier

## Rationale

- httpOnly refresh cookies reduce XSS token theft vs localStorage JWT.
- Custom auth avoids per-MAU SaaS auth pricing and keeps GDPR data on VPS.

## Security notes

- CSRF: double-submit cookie or SameSite Strict + custom header `X-Requested-With`
- Rate limit login: 5 attempts / 15 min / IP (see ADR 0008)
