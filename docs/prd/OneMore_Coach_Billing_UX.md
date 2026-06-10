# OneMore — Coach Billing & Upgrade UX

**Version:** 1.0  
**Applies from:** V2 (Stripe Coach Pro)  
**Related:** [ADR 0011](../adr/0011-monetization-and-legal-model.md)

---

## 1. Pricing (placeholder — revise before launch)

| Tier | Active clients | Price |
|------|----------------|-------|
| Coach Free | 1–3 | €0 |
| Coach Pro | 4+ (unlimited at V2) | **€29/month** EUR |

Marketplace (V4): **15%** platform fee via Stripe Connect application fee.

---

## 2. Upgrade flow

### 2.1 Trigger points

| Action | When blocked |
|--------|--------------|
| Send client invite | `active_clients >= 3` and no active Pro |
| Client accepts invite link | Would make `active_clients > 3` and no active Pro |
| Convert CRM lead to active client | Same |
| Coach dashboard CTA | Optional "Upgrade" in nav when on free tier with 3 clients |

### 2.2 Blocked flow UX

```mermaid
flowchart TD
  A[Coach adds 4th client] --> B{active_count >= 3 and not Pro?}
  B -->|No| C[Proceed normally]
  B -->|Yes| D[Modal: client limit reached]
  D --> E[Explain: 3 free clients included]
  E --> F[Primary CTA: Upgrade to Coach Pro €29/mo]
  F --> G[/coach/billing]
  G --> H[Stripe Checkout]
  H --> I[Return success → can add client]
  D --> J[Secondary: Cancel]
```

### 2.3 Modal copy (keys for i18n)

| Key | EN (placeholder) |
|-----|------------------|
| `billing.limit.title` | You've reached your free client limit |
| `billing.limit.body` | Your free plan includes 3 active clients. Upgrade to Coach Pro to add more and grow your coaching business. |
| `billing.limit.cta` | Upgrade to Coach Pro — €29/month |
| `billing.limit.dismiss` | Not now |

### 2.4 Billing page `/coach/billing`

- Current tier and active client count
- Pro benefits list
- Stripe Checkout button (monthly €29)
- Manage subscription link (Stripe Customer Portal) when Pro
- Invoice history via Stripe Portal

---

## 3. Downgrade / lapse UX

| State | Existing clients | Add new client |
|-------|------------------|----------------|
| Free, 1–3 active | Full management | Allowed if `< 3` after add |
| Free, exactly 3 active | Full management | Blocked → upgrade modal |
| Pro active | Full management | Allowed |
| Pro lapsed, any count | **Full management for all existing** | Blocked if `active >= 3` without active Pro |
| Pro lapsed, >3 active (grandfather) | Full management for all | Blocked until resubscribe |

**No read-only mode** on lapse. Coach workflow unchanged except the add-client gate.

### Stripe webhook states

| `subscription.status` | Tier shown | Add-client gate |
|-----------------------|------------|-----------------|
| `active` | Pro | Open if Pro |
| `past_due` | Pro (warning banner) | Open if still `active` in Stripe; if revoked, apply free rules |
| `canceled` / `unpaid` | Free | `active_count < 3` only |

---

## 4. API errors

```json
{
  "error": "CLIENT_LIMIT_REACHED",
  "message": "Free tier supports up to 3 active clients. Upgrade to Coach Pro to add more.",
  "active_clients": 3,
  "upgrade_url": "/coach/billing"
}
```

HTTP **403**.

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-BILL-01 | Coach with 3 active clients on free cannot send 4th invite |
| AC-BILL-02 | Modal appears with link to `/coach/billing` |
| AC-BILL-03 | After successful Checkout, coach can add 4th client |
| AC-BILL-04 | Coach with 3 clients retains full program/messaging access without Pro |
| AC-BILL-05 | Lapsed Pro with 5 clients: all 5 manageable; 6th invite blocked |
| AC-BILL-06 | Athlete users never see billing UI |
