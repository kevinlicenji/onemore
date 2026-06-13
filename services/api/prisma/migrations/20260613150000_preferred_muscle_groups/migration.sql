-- AlterTable
ALTER TABLE "user" ADD COLUMN "preferred_muscle_groups" TEXT[] DEFAULT ARRAY[]::TEXT[];
