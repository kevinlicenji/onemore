# OneMore — Analytics Event Catalog & KPI Targets

**Version:** 1.1  
**Parent document:** [OneMore_PRD_Enterprise_v1.md](../../OneMore_PRD_Enterprise_v1.md)  
**Architecture:** [Technical Spec v1](../Technical_Spec_v1.md)

---

## 1. Purpose

Defines product analytics events, user properties, funnels, and numeric targets for KPIs (PRD Section 26) and North Star Metric (PRD Section 2).

**Tooling:** **PostHog EU Cloud** (GDPR). All events include `user_id`, `timestamp`, `platform`, `app_version`. No PII in event properties.

---

## 2. North Star Metric

### 2.1 Definition

```
North Star Qualified User (NSQU):
  User with ≥ 3 completed workouts per ISO week
  for 12 consecutive ISO weeks
```

Uses **workout completed** definition from [Algorithm Spec](./OneMore_Algorithm_Spec.md) Section 5.1.

### 2.2 Computation

| Property | Type | Update frequency |
|----------|------|------------------|
| `north_star_qualified` | boolean | Weekly (Monday 02:00 UTC batch) |
| `north_star_weeks_current` | int | Consecutive qualifying weeks |
| `north_star_weeks_best` | int | Historical max |

### 2.3 Targets

| Milestone | Target | Timeframe |
|-----------|--------|-----------|
| Beta | 5% of activated users NSQU | MVP-1 + 12 weeks post-launch |
| MVP-1 launch + 6 months | 10% NSQU | Among users active 90+ days |
| MVP-3 + 12 months | 15% NSQU | Among users active 180+ days |

---

## 3. KPI Targets (PRD Section 26)

### 3.1 User KPIs

| KPI | Definition | Beta target | Launch target (6mo) |
|-----|------------|-------------|---------------------|
| DAU | Unique users with ≥1 event/day | — | Baseline |
| WAU | Unique users with ≥1 event/7d | — | Baseline |
| MAU | Unique users with ≥1 event/30d | 500 | 5,000 |
| DAU/MAU (stickiness) | DAU ÷ MAU | 15% | 25% |
| D1 retention | Return day after signup | 40% | 45% |
| D7 retention | Active 7 days after signup | 25% | 30% |
| D30 retention | Active 30 days after signup | 15% | 20% |

### 3.2 Coach KPIs (MVP-2+)

| KPI | Definition | MVP-2 target | MVP-3 target |
|-----|------------|--------------|--------------|
| Active coaches | Coach with ≥1 active client | 20 | 100 |
| Clients per coach | Median active clients | 3 | 8 |
| Coach WAU | Coach with ≥1 coach event/7d | 60% of coaches | 70% |
| Lead conversion | Leads → active_client / total leads | — | 25% |
| Client retention (coach) | Clients active 90d / clients ever | — | 60% |
| Coach response time | Median time to first message reply | — | &lt; 24h |

### 3.3 Product KPIs

| KPI | Definition | Beta target | Launch target |
|-----|------------|-------------|---------------|
| Onboarding completion | `onboarding_completed` / `signup_completed` | 60% | 70% |
| Time to first workout | Median minutes signup → `workout_completed` | ≤ 15 min | ≤ 10 min |
| Workout completion rate | `workout_completed` / `workout_started` | 85% | 90% |
| Sync success rate | Sessions synced / sessions completed | 98% | 99.5% |
| Offline workout rate | Sessions with offline sets / total | — | Track baseline |

---

## 4. Event Catalog

### 4.1 Authentication & onboarding

| Event | Properties | When |
|-------|------------|------|
| `signup_started` | `method` | Registration form opened |
| `signup_completed` | `method` | Account created |
| `onboarding_step_completed` | `step_id`, `step_index` | Each onboarding screen |
| `onboarding_completed` | `motivation_level`, `goal`, `level` | Final onboarding screen |
| `onboarding_abandoned` | `last_step_id` | App closed mid-onboarding |
| `login_completed` | `method` | Successful login |

### 4.2 Program & exercise

| Event | Properties | When |
|-------|------------|------|
| `program_created` | `program_id`, `source` (manual/template) | New program |
| `program_template_selected` | `template_id` | Template applied |
| `program_version_published` | `program_id`, `version` | Version published |
| `exercise_searched` | `query_length`, `results_count` | Library search |
| `custom_exercise_created` | `exercise_id` | User custom exercise |

### 4.3 Workout execution

| Event | Properties | When |
|-------|------------|------|
| `workout_started` | `session_id`, `type`, `program_id`, `offline` | Start workout |
| `set_logged` | `session_id`, `exercise_id`, `set_number`, `offline` | Set completed |
| `exercise_substituted` | `session_id`, `from_id`, `to_id` | Substitution |
| `rest_timer_started` | `duration_seconds` | Timer start |
| `workout_completed` | `session_id`, `duration_s`, `sets_count`, `offline` | Finish workout |
| `workout_abandoned` | `session_id`, `sets_count` | Discard workout |
| `workout_resumed` | `session_id`, `elapsed_s` | Crash resume |
| `sync_completed` | `session_id`, `latency_ms`, `sets_synced` | Successful sync |
| `sync_failed` | `session_id`, `error_code`, `retry_count` | Sync failure |

### 4.4 Progress & motivation

| Event | Properties | When |
|-------|------------|------|
| `pr_achieved` | `exercise_id`, `pr_type`, `value` | New PR |
| `achievement_unlocked` | `achievement_id` | Badge earned |
| `streak_updated` | `streak_weeks`, `broken` | Weekly streak calc |
| `progress_score_updated` | `score`, `delta` | Weekly score |
| `goal_created` | `goal_type`, `target` | New goal |
| `goal_achieved` | `goal_id`, `goal_type` | Goal completed |
| `motivation_level_changed` | `from`, `to` | Settings change |

### 4.5 Coach platform (MVP-2+)

| Event | Properties | When |
|-------|------------|------|
| `coach_signup_completed` | — | Coach account enabled |
| `coach_invite_sent` | `method` (link/username/qr) | Invite created |
| `coach_link_accepted` | `relationship_id` | Client accepts |
| `coach_link_revoked` | `by` (client/coach) | Relationship ends |
| `consent_granted` | `scopes[]`, `consent_version` | GDPR consent |
| `program_assigned` | `program_id`, `client_id` | Coach assigns |
| `message_sent` | `relationship_id`, `sender_role` | Chat message |
| `lead_created` | `lead_id`, `source` | CRM lead |
| `lead_status_changed` | `lead_id`, `from`, `to` | Pipeline move |
| `lead_converted` | `lead_id`, `user_id` | Lead → client |
| `coach_automation_triggered` | `rule_id`, `client_id` | Alert fired |

### 4.6 Notifications

| Event | Properties | When |
|-------|------------|------|
| `notification_sent` | `category`, `channel`, `motivation_level` | Notification dispatched |
| `notification_suppressed` | `reason` (budget/quiet/level) | Blocked by rules |
| `notification_opened` | `category`, `notification_id` | User opens |
| `notification_preference_changed` | `category`, `enabled` | Settings |

---

## 5. Funnels

### 5.1 Activation funnel (MVP-1)

```
signup_completed
  → onboarding_completed (target 70%)
  → program_created OR program_template_selected (target 85% of onboarding)
  → workout_started (target 80% within 24h)
  → workout_completed (target 90% of started)
```

### 5.2 North Star funnel

```
workout_completed (week 1, count ≥ 3)
  → repeat 12 weeks
  → north_star_qualified = true
```

Track `north_star_weeks_current` distribution weekly.

### 5.3 Coach funnel (MVP-2+)

```
coach_signup_completed
  → coach_invite_sent (target 90% within 7d)
  → coach_link_accepted (target 50% of invites)
  → program_assigned (target 80% within 48h of link)
  → client workout_completed within 7d (target 60%)
```

---

## 6. Dashboards

| Dashboard | Audience | Key views |
|-----------|----------|-----------|
| Product health | Product team | DAU/WAU/MAU, retention, activation funnel |
| North Star | Leadership | NSQU %, weeks distribution, cohort trends |
| Workout quality | Engineering | Sync rate, offline %, completion rate, latency |
| Coach success | Coach PM | Conversion, retention, automation triggers |
| Motivation | Product | Level distribution, suppression rate, open rate |

---

## 7. Data Governance

| Rule | Policy |
|------|--------|
| PII in analytics | No email/name in event properties |
| Coach CRM notes | Never in product analytics |
| Message content | Never in analytics |
| Fitness data | Aggregated only in dashboards; raw in secure warehouse |
| Retention | Analytics events 24 months |
| EU users | EU analytics endpoint |

---

## 8. Implementation Checklist

- [ ] Event SDK integrated MVP-1 sprint 1
- [ ] `workout_completed` validated against DB session status
- [ ] North Star batch job with alerting if job fails
- [ ] Funnel dashboards before beta launch
- [ ] Coach events before MVP-2 beta
