# ADR 0011: Monetization and legal data model

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Product + Engineering

## Context

V1 is free for all users. V2 introduces coach monetization via Stripe. V4 introduces marketplace with coach payouts. GDPR roles for coach-client data must be fixed before coach CRM (MVP-2).

## Decision

### 1. Coach pricing (V2) — Freemium

| Tier | Active clients | Price (placeholder — revise before launch) |
|------|----------------|---------------------------------------------|
| **Coach Free** | Up to **3** active clients | €0 |
| **Coach Pro** | 4+ active clients | **€29/month** (EUR, billed monthly via Stripe) |

- **Active client** = `coach_client_relationship.status = active`
- Athletes remain **free** in V1 and V2 (no athlete subscription in this model)
- Stripe Billing for Coach Pro subscription (Stripe Price ID configured in env)
- Currency: EUR only at V2 launch (expand later)

### Upgrade gate UX (free / lapsed Pro)

Coach on free tier (or Pro subscription not `active`) with **3 active clients**:

1. All coach features work normally for those 3 clients (programs, messaging, CRM, analytics).
2. Any action that would create a **4th active client** is blocked:
   - Send invite when `active_count >= 3`
   - Accept pending link that would exceed limit
   - Convert lead → active client when `active_count >= 3`
3. UI shows modal: limit reached → CTA **Upgrade to Coach Pro** → `/coach/billing` checkout.
4. API returns `403` + error code `CLIENT_LIMIT_REACHED` with `upgrade_url`.

**Subscription lapse (had Pro, now free):**

- All **existing** active clients remain **fully manageable** (no read-only).
- Coach **cannot add** new active clients while `active_count >= 3` without active Pro.
- If lapse left coach with **>3** active clients (e.g. 8 on Pro): all 8 stay fully manageable; cannot add 9th until resubscribe (no forced archive in V2).

### Enforcement

- API: `POST /coach/clients/invite`, link accept, lead convert — check `tier === pro && subscription.status === active` OR `active_count < 3`

### 2. Marketplace payouts (V4) — Stripe Connect

- **Stripe Connect Express** (or Express Dashboard equivalent at implementation time)
- Coaches selling programs on marketplace = **connected accounts**
- Platform collects **15% application fee** (placeholder — revise before V4 launch) on each marketplace sale
- OneMore does not manually invoice and remit coach earnings
- Requires Stripe foundation from V2 Coach Pro billing

### 3. GDPR roles — Coach as controller (CRM), OneMore as processor (workout)

| Data domain | Role | Notes |
|-------------|------|-------|
| Workout sessions, sets, PRs, analytics | OneMore **processor**; athlete **controller** of own data | Standard SaaS fitness |
| Coach CRM (leads, pipeline notes, call logs) | Coach **controller**; OneMore **processor** | Coach business data |
| Coach ↔ client relationship, messaging metadata | Shared — **DPA** between coach and OneMore at coach signup MVP-2 |
| Platform account data (email, auth) | OneMore **controller** | |

- DPA template presented and accepted at **coach onboarding (MVP-2)**
- Athlete consent for coach data sharing remains separate (existing coach-link flow)
- Legal templates in `docs/legal/` — require external legal review before public launch

## Rationale

- Freemium with N=3 maximizes coach acquisition while creating clear upgrade trigger for growing coaches.
- Stripe Connect is industry standard for marketplaces; avoids platform holding coach funds manually.
- Split GDPR roles match reality: coach runs client relationship; platform hosts workout infrastructure.

## Consequences

### Technical (V2)

- `coach_subscription` table + Stripe Customer/Subscription IDs
- `billing` module in API monolith
- Webhook handler: `customer.subscription.updated`, `invoice.paid`, etc.
- Feature gate on **new client activation only:** allow if `active_count < 3` OR `subscription.tier === pro && status === active`
- No feature degradation for existing clients on downgrade/lapse

### Technical (V4)

- Stripe Connect onboarding flow for coaches
- `marketplace_listing`, `marketplace_purchase` entities
- Application fee on PaymentIntent / Checkout Session

### Data model stubs

Add in MVP-2 migration planning (not MVP-1):

- `coach_subscription` (user_id, stripe_customer_id, stripe_subscription_id, status, tier)
- `stripe_connect_account` (coach_profile_id, connect_account_id, onboarding_complete) — V4

## Alternatives rejected

| Alternative | Why rejected |
|-------------|--------------|
| Per-client pricing (B) | Higher billing complexity; freemium chosen |
| Athlete-paid model (D) | Conflicts with free athlete V1 base |
| Platform marketplace invoicing (B) | Manual payout ops; regulatory burden |
