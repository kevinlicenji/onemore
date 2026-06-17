-- Ensure at most one of is_completed / is_skipped / is_failed can be true at a time.
-- NOT VALID skips check of existing rows so the migration never blocks on legacy data.
ALTER TABLE "set_log"
  ADD CONSTRAINT "set_log_status_mutual_exclusion"
  CHECK (
    (is_completed::int + is_skipped::int + is_failed::int) <= 1
  ) NOT VALID;
