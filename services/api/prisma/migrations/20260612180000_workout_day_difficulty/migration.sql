-- Add difficulty level (1=easy, 2=medium, 3=hard) to workout days.
ALTER TABLE "workout_day" ADD COLUMN "difficulty_level" INTEGER NOT NULL DEFAULT 2;
