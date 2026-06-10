# OneMore — Algorithm Specification Appendix

**Version:** 1.0  
**Applies from:** MVP-1 (PR/e1RM) and MVP-3 (progression, plateau, Progress Score)  
**Parent document:** [OneMore_PRD_Enterprise_v1.md](../../OneMore_PRD_Enterprise_v1.md)

---

## 1. Scope

This appendix defines deterministic algorithms for analytics and automation. All formulas are **rule-based in v1** (no ML). Inputs come from `ExerciseExecution` records: weight (kg), reps, optional RPE/RIR, exercise ID, timestamp.

**Units:** Weight in kilograms (kg). Display conversion to lb is a UI concern (`lb = kg × 2.20462`).

---

## 2. Estimated One-Rep Max (e1RM)

### 2.1 Formula selection

Use **Epley** as the default formula for reps 1–10; use **Brzycki** for reps 11–15. Reps &gt; 15 or weight = 0 → e1RM not computed (cardio/time-based sets excluded).

```
Epley:   e1RM = weight × (1 + reps / 30)
Brzycki: e1RM = weight × (36 / (37 - reps))   // reps must be < 37
```

### 2.2 Per-set e1RM

For each completed set with weight &gt; 0 and reps ≥ 1:

```
e1RM_set = formula(weight, reps)
```

### 2.3 Session e1RM (per exercise)

```
e1RM_session = max(e1RM_set) for all sets in session for that exercise
```

### 2.4 Rolling e1RM (displayed trend)

- **Best ever:** `max(e1RM_session)` across all history
- **30-day best:** `max(e1RM_session)` where session_date ≥ today - 30 days
- **Trend line:** weekly `max(e1RM_session)` per ISO week; chart shows last 12 weeks

### 2.5 Acceptance criteria

| AC | Rule |
|----|------|
| AC-e1RM-01 | 100 kg × 5 reps → Epley e1RM = 116.67 kg (±0.01) |
| AC-e1RM-02 | Reps = 0 or weight = 0 → no e1RM stored |
| AC-e1RM-03 | Reps &gt; 15 → no e1RM stored |
| AC-e1RM-04 | Bodyweight exercises use effective load (bodyweight + added weight) when configured on exercise |

---

## 3. Personal Record (PR) Detection

### 3.1 PR types (MVP-1)

| Type | Condition |
|------|-----------|
| `weight_pr` | Max weight for exercise at given rep count (exact reps match) |
| `volume_pr` | Max `weight × reps` for a single set |
| `e1rm_pr` | New session e1RM exceeds previous best ever |

### 3.2 Detection timing

PR evaluated **on set completion** (offline-safe). PR stored locally first; server reconciles on sync (server wins on tie with same timestamp → higher weight).

### 3.3 Free workout sets

Included in PR detection and e1RM (same rules as program workouts).

---

## 4. Volume Analytics

### 4.1 Set volume

```
set_volume = weight × reps
```

Bodyweight: `set_volume = effective_load × reps` where `effective_load` defaults to user bodyweight from profile if exercise flagged `bodyweight`.

### 4.2 Workout volume

```
workout_volume = sum(set_volume) for all completed sets in session
```

### 4.3 Weekly volume

Sum of `workout_volume` for sessions with `status = completed` in ISO week.

### 4.4 Muscle volume (MVP-3)

Each exercise maps to primary muscles (weight 1.0) and secondary muscles (weight 0.5) in the exercise library.

```
muscle_volume[m] += set_volume × muscle_weight[m]
```

If exercise has 2 primary muscles, each receives `set_volume × 0.5`. Secondary muscles split `set_volume × 0.5` equally.

---

## 5. Consistency Metrics

### 5.1 Workout completed definition

A session counts toward consistency when:

- `status = completed`
- `completed_exercise_ratio ≥ 0.5` (at least half of planned exercises logged with ≥ 1 set)
- `duration_minutes ≥ 10` OR `total_sets ≥ 6`

Free workouts: same rules; no planned exercise ratio — require `total_sets ≥ 6` OR `duration_minutes ≥ 10`.

### 5.2 Weekly frequency

```
frequency_week = count(completed sessions in ISO week)
```

### 5.3 Adherence (programmed users only, MVP-3)

```
planned_sessions = count(program days in week matching user's availability)
adherence = completed_sessions / planned_sessions   // cap at 1.0
```

### 5.4 Streak

Consecutive **calendar weeks** with `frequency_week ≥ 1` completed session. Week boundary: Monday 00:00 user timezone.

Streak breaks if a full week has zero completed sessions.

---

## 6. Progression Engine (MVP-3)

### 6.1 Modes

| Mode | ID | Description |
|------|-----|-------------|
| Linear | `linear` | Increase load when all working sets hit target reps |
| Double progression | `double` | Increase reps until ceiling, then increase load and reset reps |
| Volume progression | `volume` | Increase total sets or reps per week |
| Intensity progression | `intensity` | Decrease target RIR or increase load at fixed reps |

Coach selects mode per exercise in program. Default: `linear`.

### 6.2 Linear progression rules

**Inputs per exercise:** `target_sets`, `target_reps`, `current_weight`, `increment_kg` (default 2.5 barbell / 1.0 dumbbell).

**Trigger:** After session completes, if **all working sets** (exclude warm-up sets flagged `is_warmup`) satisfy `actual_reps ≥ target_reps` at `actual_weight ≥ current_weight`:

```
proposed_weight = current_weight + increment_kg
```

**Proposal workflow:**

1. System creates `ProgramVersion` draft with updated weight
2. If coach assigned: status `pending_coach_approval` → coach approves/rejects within 7 days
3. If independent athlete: status `auto_applied` unless user disabled auto-progression in settings

### 6.3 Double progression rules

- `rep_range_min`, `rep_range_max` (e.g. 8–12), `increment_kg`
- Each session: if all sets at `rep_range_max` → propose `weight + increment_kg`, reset target to `rep_range_min`
- Else if all sets ≥ `rep_range_min` → propose `target_reps + 1` (cap at `rep_range_max`)

### 6.4 Volume progression rules

Every 2 weeks if adherence ≥ 80%:

```
proposed_sets = min(current_sets + 1, max_sets_cap)   // max_sets_cap default 5
```

### 6.5 Intensity progression rules

When all sets at target reps and `avg_RIR ≤ 2` (if RIR logged):

```
proposed_weight = current_weight + increment_kg
```

Requires RIR data on ≥ 50% of working sets in session.

### 6.6 Deload (MVP-3)

Auto-suggest deload when **plateau detected** (Section 7) for exercise:

```
proposed_weight = current_weight × 0.9
proposed_sets = max(2, current_sets - 1)
```

Coach approval required for coached clients.

### 6.7 Versioning

| Event | Action |
|-------|--------|
| Progression proposal approved | New `ProgramVersion` published; `previous_version_id` linked |
| Manual coach edit | New `ProgramVersion`; progression state reset for edited exercise |
| Client mid-program switch | Old version archived; new assignment starts at version 1 |

---

## 7. Plateau Detection (MVP-3)

### 7.1 Definition

An exercise is **plateaued** when e1RM does not improve over a rolling window.

### 7.2 Algorithm

```
window_sessions = last 4 sessions containing exercise (min 3 sessions required)
window_weeks = span from first to last session in window

IF window_sessions < 3 OR window_weeks < 2:
  status = insufficient_data

best_early = max(e1RM_session) in first half of window_sessions
best_late  = max(e1RM_session) in second half of window_sessions

improvement_pct = (best_late - best_early) / best_early

IF improvement_pct < 0.02:   // less than 2% improvement
  status = plateau
ELSE:
  status = progressing
```

### 7.3 Actions

| Status | Athlete (independent) | Coached client |
|--------|----------------------|----------------|
| `plateau` | In-app insight card + optional deload suggestion | Coach automation alert + athlete insight card |
| `progressing` | No alert | No alert |

Plateau re-evaluated after each session containing the exercise.

---

## 8. Progress Score (MVP-3)

### 8.1 Purpose

Single 0–100 index combining consistency, strength trend, and goal progress. Updated **weekly** (Sunday 00:00 user timezone).

### 8.2 Components

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Consistency | 40% | `min(streak_weeks / 12, 1) × 40` + `min(frequency_week / target_frequency, 1) × 0` — see note |
| Consistency sub | — | `consistency_score = (streak_component + frequency_component) / 40` where `streak_component = min(streak/12,1)×20`, `frequency_component = min(actual_freq/target_freq,1)×20` |
| Strength | 35% | Average across tracked exercises (max 5 user-selected or auto top-5 by volume): `improvement_pct_12wk` capped 0–1 × 35 |
| Goal | 25% | If active goal: `goal_progress_pct × 25`; else 12.5 neutral |

### 8.3 Strength improvement (12-week)

For each tracked exercise:

```
improvement = (e1RM_week_current - e1RM_week_12ago) / e1RM_week_12ago
normalized = clamp(improvement / 0.15, 0, 1)   // 15% improvement = full component
```

Average `normalized` across tracked exercises → multiply by 35.

### 8.4 Final score

```
progress_score = round(consistency_component + strength_component + goal_component)
```

Range: 0–100. Display with weekly delta (`score_this_week - score_last_week`).

### 8.5 Acceptance criteria

| AC | Rule |
|----|------|
| AC-PS-01 | New user with 1 workout → score between 5–25 |
| AC-PS-02 | 12-week streak, 3x/week, 10% strength gain, goal 80% → score ≥ 70 |
| AC-PS-03 | Score updates once per week, not per session |

---

## 9. North Star Metric Alignment

North Star: **% users completing ≥3 workouts/week for 12 consecutive weeks**.

Uses **consistency completed definition** (Section 5.1) and ISO week boundaries. Tracked via `north_star_qualified` user property (see [OneMore_Analytics_Events.md](./OneMore_Analytics_Events.md)).

---

## 10. Implementation Notes

- All calculations run server-side on sync for coached analytics; client-side for offline PR/e1RM preview
- Store computed values in `AnalyticsSnapshot` (weekly) to avoid recomputation
- Float precision: round display to 1 decimal kg; store 2 decimals internally
- Algorithm version field `algo_version` on snapshots for future formula changes
