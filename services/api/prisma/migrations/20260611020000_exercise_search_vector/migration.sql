-- Full-text search vector for exercise library (ADR 0004)
ALTER TABLE "exercise_library" ADD COLUMN "search_vector" tsvector;

CREATE OR REPLACE FUNCTION exercise_library_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.names->>'en', '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(NEW.names->>'it', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exercise_library_search_vector_trigger
BEFORE INSERT OR UPDATE ON "exercise_library"
FOR EACH ROW EXECUTE FUNCTION exercise_library_search_vector_update();

CREATE INDEX "exercise_library_search_vector_idx" ON "exercise_library" USING GIN ("search_vector");

-- Backfill existing rows
UPDATE "exercise_library" SET "search_vector" =
  setweight(to_tsvector('english', coalesce(names->>'en', '')), 'A') ||
  setweight(to_tsvector('italian', coalesce(names->>'it', '')), 'A') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'B');
