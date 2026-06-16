-- Drop search_vector column and its dependencies (removed from schema)
DROP TRIGGER IF EXISTS exercise_library_search_vector_trigger ON "exercise_library";
DROP FUNCTION IF EXISTS exercise_library_search_vector_update CASCADE;
ALTER TABLE "exercise_library" DROP COLUMN IF EXISTS "search_vector";

-- Create enum types for max values module
CREATE TYPE "MaxSource" AS ENUM ('MANUAL', 'AUTOMATIC_APPROVED');
CREATE TYPE "LogStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'MANUAL_ENTRY');

-- Create UserExerciseMax table
CREATE TABLE "user_exercise_max" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "source" "MaxSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_exercise_max_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_exercise_max_user_id_exercise_id_key" UNIQUE ("user_id", "exercise_id")
);

-- Create MaxHistoryLog table
CREATE TABLE "max_history_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "calculated_1rm" DOUBLE PRECISION NOT NULL,
    "status" "LogStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "max_history_log_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "user_exercise_max" ADD CONSTRAINT "user_exercise_max_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "user_exercise_max" ADD CONSTRAINT "user_exercise_max_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise_library"("id") ON DELETE CASCADE;
ALTER TABLE "max_history_log" ADD CONSTRAINT "max_history_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "max_history_log" ADD CONSTRAINT "max_history_log_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise_library"("id") ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "max_history_log_user_id_exercise_id_idx" ON "max_history_log"("user_id", "exercise_id");
CREATE INDEX "max_history_log_status_date_idx" ON "max_history_log"("status", "date" DESC);
