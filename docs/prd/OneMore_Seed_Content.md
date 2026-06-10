# OneMore — Seed Content (MVP-1)

**Version:** 1.0  
**Related:** [IMPLEMENTATION_ROADMAP](../IMPLEMENTATION_ROADMAP.md) Phase 3

---

## 1. Exercise library seed

### Source

- **Primary:** [wger.de](https://wger.de) REST API (open source, **CC-BY-SA 3.0**)
- Import English names; map Italian labels in `packages/shared` i18n overlay or `exercise_translation` table
- Curate to **~150 exercises** covering major patterns for gym + home

### Attribution (required)

- In-app **Credits** page: "Exercise data from wger.de, licensed under CC-BY-SA 3.0"
- Link to wger source

### Categories to cover

| Category | Target count |
|----------|--------------|
| Chest | 15 |
| Back | 15 |
| Legs | 25 |
| Shoulders | 12 |
| Arms | 15 |
| Core | 12 |
| Bodyweight / home | 25 |
| Cardio (basic) | 10 |
| Custom slot | User-created |

### Seed command

```
pnpm --filter api seed:exercises
```

Idempotent: upsert by `wger_id` or canonical slug.

---

## 2. Program templates (4 presets)

Applied at onboarding or program picker. All use **linear progression fields** preset but auto-progression engine is MVP-3 — templates are static prescriptions only in MVP-1.

### Template 1: `beginner_full_body_gym`

| Field | Value |
|-------|-------|
| Name (EN) | Beginner Full Body |
| Name (IT) | Full body principiante |
| Days/week | 3 |
| Audience | Beginner, gym |

| Day | Label | Exercises (prescription) |
|-----|-------|--------------------------|
| A | Day A | Squat 3×8, Bench press 3×8, Row 3×8, Plank 3×30s |
| B | Day B | RDL 3×8, OHP 3×8, Lat pulldown 3×8, Leg raise 3×12 |
| C | Day C | Leg press 3×10, Incline DB press 3×10, Cable row 3×10, Pallof press 3×12 |

Rest: 90s default. Weights: user-defined (empty on assign).

---

### Template 2: `beginner_upper_lower_gym`

| Field | Value |
|-------|-------|
| Name (EN) | Beginner Upper / Lower |
| Name (IT) | Upper / Lower principiante |
| Days/week | 4 |
| Audience | Beginner, gym |

| Day | Label | Focus |
|-----|-------|-------|
| A | Upper A | Bench 3×8, Row 3×8, OHP 3×8, Curl 2×12, Tricep pushdown 2×12 |
| B | Lower A | Squat 3×8, RDL 3×8, Leg curl 3×10, Calf raise 3×15 |
| C | Upper B | Incline press 3×8, Pull-up/lat pulldown 3×8, Lateral raise 3×12, Hammer curl 2×12 |
| D | Lower B | Leg press 3×10, Bulgarian split squat 3×8 each, Leg extension 3×10, Core 3×12 |

---

### Template 3: `home_bodyweight_3day`

| Field | Value |
|-------|-------|
| Name (EN) | Home Bodyweight |
| Name (IT) | Corpo libero a casa |
| Days/week | 3 |
| Audience | Beginner–intermediate, home |

| Day | Label | Exercises |
|-----|-------|-----------|
| A | Day A | Push-up 3×max, Squat 3×15, Superman 3×12, Plank 3×45s |
| B | Day B | Glute bridge 3×15, Pike push-up 3×max, Reverse lunge 3×12 each, Dead bug 3×12 |
| C | Day C | Burpee 3×8, Jump squat 3×12, Mountain climber 3×20, Side plank 3×30s each |

Mark exercises `is_bodyweight: true` in library mapping.

---

### Template 4: `intermediate_upper_lower_gym`

| Field | Value |
|-------|-------|
| Name (EN) | Intermediate Upper / Lower |
| Name (IT) | Upper / Lower intermedio |
| Days/week | 4 |
| Audience | Intermediate, gym |

| Day | Label | Notes |
|-----|-------|-------|
| A | Upper A | Bench 4×6, Barbell row 4×6, OHP 3×8, Pull-up 3×6–8, Accessories 2×12 |
| B | Lower A | Squat 4×6, RDL 3×8, Leg press 3×10, Ham curl 3×10 |
| C | Upper B | Incline DB 4×8, Cable row 4×8, Lateral raise 3×12, Face pull 3×15 |
| D | Lower B | Front squat or leg press 4×8, Split squat 3×8, Leg extension 3×12, Calf 4×12 |

Higher volume than Template 2 — target `intermediate` onboarding level.

---

## 3. Template selection logic (onboarding)

| Onboarding input | Suggested template |
|------------------|-------------------|
| Beginner + gym | `beginner_full_body_gym` or `beginner_upper_lower_gym` if 4 days availability |
| Beginner + home | `home_bodyweight_3day` |
| Intermediate + gym | `intermediate_upper_lower_gym` |
| Advanced + gym | `intermediate_upper_lower_gym` (until advanced templates in V2) |

If availability &lt; template days/week, show warning and suggest lower-day template.

---

## 4. Seed command

```
pnpm --filter api seed:templates
```

Creates `program` with `is_template: true`, `author_type: template`, published `program_version` v1.
