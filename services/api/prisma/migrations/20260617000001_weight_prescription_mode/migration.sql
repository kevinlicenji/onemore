-- AlterTable
ALTER TABLE "program_exercise" ADD COLUMN     "target_percent_of_max" INTEGER,
ADD COLUMN     "weight_prescription_mode" TEXT NOT NULL DEFAULT 'absolute';
