-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM ('mass', 'strength', 'fat_loss', 'recomp', 'fitness');

-- CreateEnum
CREATE TYPE "TrainingLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "TrainingEnvironment" AS ENUM ('gym', 'home');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('apple', 'google');

-- CreateEnum
CREATE TYPE "AuthorType" AS ENUM ('self', 'coach', 'template');

-- CreateEnum
CREATE TYPE "ProgramVersionStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ProgramVersionChangeReason" AS ENUM ('manual', 'progression', 'coach_edit', 'suggestion');

-- CreateEnum
CREATE TYPE "ProgressionMode" AS ENUM ('linear', 'double', 'volume', 'intensity');

-- CreateEnum
CREATE TYPE "ProgramAssignmentStatus" AS ENUM ('active', 'completed', 'paused');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('programmed', 'free');

-- CreateEnum
CREATE TYPE "ExerciseExecutionStatus" AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "PrType" AS ENUM ('weight_pr', 'volume_pr', 'e1rm_pr');

-- CreateEnum
CREATE TYPE "BodyWeightSource" AS ENUM ('manual', 'import');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('workout', 'progress', 'pr', 'goal', 'coach', 'system');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('tos', 'privacy', 'fitness_data', 'coach_data_sharing', 'messaging', 'marketing', 'dpa_coach');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "display_name" TEXT,
    "username" TEXT,
    "username_changed_at" TIMESTAMP(3),
    "birth_year" INTEGER,
    "locale" TEXT NOT NULL DEFAULT 'it',
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
    "motivation_level" INTEGER,
    "fitness_data_consented_at" TIMESTAMP(3),
    "onboarding_completed_at" TIMESTAMP(3),
    "training_goal" "TrainingGoal",
    "training_level" "TrainingLevel",
    "training_environment" "TrainingEnvironment",
    "training_days_per_week" INTEGER,
    "is_coach" BOOLEAN NOT NULL DEFAULT false,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret_encrypted" BYTEA,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credential" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credential_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "oauth_account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email_at_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" "TrainingGoal",
    "duration_weeks" INTEGER,
    "author_type" "AuthorType" NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_version" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "previous_version_id" UUID,
    "status" "ProgramVersionStatus" NOT NULL,
    "published_at" TIMESTAMP(3),
    "change_reason" "ProgramVersionChangeReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_day" (
    "id" UUID NOT NULL,
    "program_version_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_exercise" (
    "id" UUID NOT NULL,
    "workout_day_id" UUID NOT NULL,
    "exercise_library_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "target_reps" INTEGER NOT NULL,
    "target_weight_kg" DECIMAL(8,2),
    "rest_seconds" INTEGER NOT NULL,
    "target_rpe" DECIMAL(3,1),
    "target_rir" INTEGER,
    "progression_mode" "ProgressionMode" NOT NULL DEFAULT 'linear',
    "progression_config" JSONB NOT NULL DEFAULT '{}',
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "coach_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_assignment" (
    "id" UUID NOT NULL,
    "program_version_id" UUID NOT NULL,
    "client_user_id" UUID NOT NULL,
    "assigned_by_coach_profile_id" UUID,
    "status" "ProgramAssignmentStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "last_completed_workout_day_id" UUID,
    "next_workout_day_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_library" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "wger_id" INTEGER,
    "names" JSONB NOT NULL,
    "description" JSONB,
    "category" TEXT NOT NULL,
    "primary_muscles" JSONB NOT NULL,
    "secondary_muscles" JSONB NOT NULL DEFAULT '[]',
    "equipment" TEXT NOT NULL,
    "is_bodyweight" BOOLEAN NOT NULL DEFAULT false,
    "owner_user_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "program_assignment_id" UUID,
    "workout_day_id" UUID,
    "status" "WorkoutSessionStatus" NOT NULL,
    "session_type" "SessionType" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "private_notes" TEXT,
    "coach_notes" TEXT,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_execution" (
    "id" UUID NOT NULL,
    "workout_session_id" UUID NOT NULL,
    "exercise_library_id" UUID NOT NULL,
    "program_exercise_id" UUID,
    "substituted_from_exercise_id" UUID,
    "sort_order" INTEGER NOT NULL,
    "status" "ExerciseExecutionStatus" NOT NULL,
    "prescription_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_log" (
    "id" UUID NOT NULL,
    "exercise_execution_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "weight_kg" DECIMAL(8,2),
    "reps" INTEGER,
    "rpe" DECIMAL(3,1),
    "rir" INTEGER,
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_skipped" BOOLEAN NOT NULL DEFAULT false,
    "is_failed" BOOLEAN NOT NULL DEFAULT false,
    "client_timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "set_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_record" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_library_id" UUID NOT NULL,
    "pr_type" "PrType" NOT NULL,
    "reps" INTEGER,
    "value" DECIMAL(10,2) NOT NULL,
    "set_log_id" UUID NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_weight_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "source" "BodyWeightSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_weight_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievement" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_record" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "relationship_id" UUID,
    "consent_type" "ConsentType" NOT NULL,
    "consent_version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "scopes" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_idempotency" (
    "key" TEXT NOT NULL,
    "response_body" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_idempotency_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_deleted_at_idx" ON "user"("deleted_at");

-- CreateIndex
CREATE INDEX "user_onboarding_completed_at_idx" ON "user"("onboarding_completed_at");

-- CreateIndex
CREATE INDEX "oauth_account_user_id_idx" ON "oauth_account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_account_provider_provider_user_id_key" ON "oauth_account"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_revoked_at_idx" ON "refresh_token"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON "password_reset_token"("user_id");

-- CreateIndex
CREATE INDEX "program_owner_user_id_idx" ON "program"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_version_program_id_version_number_key" ON "program_version"("program_id", "version_number");

-- CreateIndex
CREATE INDEX "workout_day_program_version_id_sort_order_idx" ON "workout_day"("program_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "program_exercise_workout_day_id_sort_order_idx" ON "program_exercise"("workout_day_id", "sort_order");

-- CreateIndex
CREATE INDEX "program_assignment_client_user_id_status_idx" ON "program_assignment"("client_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_library_slug_key" ON "exercise_library"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_library_wger_id_key" ON "exercise_library"("wger_id");

-- CreateIndex
CREATE INDEX "exercise_library_category_idx" ON "exercise_library"("category");

-- CreateIndex
CREATE INDEX "workout_session_user_id_started_at_idx" ON "workout_session"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workout_session_user_id_completed_at_idx" ON "workout_session"("user_id", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "workout_session_user_id_status_idx" ON "workout_session"("user_id", "status");

-- CreateIndex
CREATE INDEX "exercise_execution_workout_session_id_sort_order_idx" ON "exercise_execution"("workout_session_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "set_log_exercise_execution_id_set_number_key" ON "set_log"("exercise_execution_id", "set_number");

-- CreateIndex
CREATE INDEX "personal_record_user_id_exercise_library_id_pr_type_idx" ON "personal_record"("user_id", "exercise_library_id", "pr_type");

-- CreateIndex
CREATE INDEX "body_weight_log_user_id_recorded_at_idx" ON "body_weight_log"("user_id", "recorded_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_achievement_user_id_achievement_id_key" ON "user_achievement"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "notification_user_id_read_at_idx" ON "notification"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "consent_record_user_id_consent_type_idx" ON "consent_record"("user_id", "consent_type");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_created_at_idx" ON "audit_log"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_resource_type_resource_id_idx" ON "audit_log"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "sync_idempotency_expires_at_idx" ON "sync_idempotency"("expires_at");

-- AddForeignKey
ALTER TABLE "user_credential" ADD CONSTRAINT "user_credential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_version" ADD CONSTRAINT "program_version_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_version" ADD CONSTRAINT "program_version_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "program_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day" ADD CONSTRAINT "workout_day_program_version_id_fkey" FOREIGN KEY ("program_version_id") REFERENCES "program_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercise" ADD CONSTRAINT "program_exercise_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercise" ADD CONSTRAINT "program_exercise_exercise_library_id_fkey" FOREIGN KEY ("exercise_library_id") REFERENCES "exercise_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "program_assignment_program_version_id_fkey" FOREIGN KEY ("program_version_id") REFERENCES "program_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "program_assignment_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "program_assignment_last_completed_workout_day_id_fkey" FOREIGN KEY ("last_completed_workout_day_id") REFERENCES "workout_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "program_assignment_next_workout_day_id_fkey" FOREIGN KEY ("next_workout_day_id") REFERENCES "workout_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_library" ADD CONSTRAINT "exercise_library_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_program_assignment_id_fkey" FOREIGN KEY ("program_assignment_id") REFERENCES "program_assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_execution" ADD CONSTRAINT "exercise_execution_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_execution" ADD CONSTRAINT "exercise_execution_exercise_library_id_fkey" FOREIGN KEY ("exercise_library_id") REFERENCES "exercise_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_execution" ADD CONSTRAINT "exercise_execution_program_exercise_id_fkey" FOREIGN KEY ("program_exercise_id") REFERENCES "program_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_execution" ADD CONSTRAINT "exercise_execution_substituted_from_exercise_id_fkey" FOREIGN KEY ("substituted_from_exercise_id") REFERENCES "exercise_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_log" ADD CONSTRAINT "set_log_exercise_execution_id_fkey" FOREIGN KEY ("exercise_execution_id") REFERENCES "exercise_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_record" ADD CONSTRAINT "personal_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_record" ADD CONSTRAINT "personal_record_exercise_library_id_fkey" FOREIGN KEY ("exercise_library_id") REFERENCES "exercise_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_record" ADD CONSTRAINT "personal_record_set_log_id_fkey" FOREIGN KEY ("set_log_id") REFERENCES "set_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_weight_log" ADD CONSTRAINT "body_weight_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
