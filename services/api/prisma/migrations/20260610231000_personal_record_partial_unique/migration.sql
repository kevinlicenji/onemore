-- Partial unique indexes for personal_record (Data Model v1.2 §9.1)
-- weight_pr: one row per (user, exercise, rep count)
CREATE UNIQUE INDEX "personal_record_weight_pr_unique"
  ON "personal_record" ("user_id", "exercise_library_id", "pr_type", "reps")
  WHERE "pr_type" = 'weight_pr';

-- volume_pr and e1rm_pr: one row per (user, exercise, type)
CREATE UNIQUE INDEX "personal_record_volume_e1rm_unique"
  ON "personal_record" ("user_id", "exercise_library_id", "pr_type")
  WHERE "pr_type" IN ('volume_pr', 'e1rm_pr');
