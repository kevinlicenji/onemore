-- CreateEnum
CREATE TYPE "SupplementUnit" AS ENUM ('g', 'mg', 'capsule', 'scoop', 'drops');

-- CreateTable
CREATE TABLE "supplement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" JSONB NOT NULL,
    "brand" TEXT,
    "unit" "SupplementUnit" NOT NULL,
    "user_id" UUID,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "supplement_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplement_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplement_user_id_idx" ON "supplement"("user_id");
CREATE INDEX "supplement_deleted_at_idx" ON "supplement"("deleted_at");
CREATE INDEX "supplement_log_user_id_date_idx" ON "supplement_log"("user_id", "date" DESC);
CREATE INDEX "supplement_log_supplement_id_idx" ON "supplement_log"("supplement_id");
CREATE UNIQUE INDEX "supplement_log_user_supplement_date_key" ON "supplement_log"("user_id", "supplement_id", "date");

-- AddForeignKey
ALTER TABLE "supplement" ADD CONSTRAINT "supplement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplement_log" ADD CONSTRAINT "supplement_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplement_log" ADD CONSTRAINT "supplement_log_supplement_id_fkey" FOREIGN KEY ("supplement_id") REFERENCES "supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
