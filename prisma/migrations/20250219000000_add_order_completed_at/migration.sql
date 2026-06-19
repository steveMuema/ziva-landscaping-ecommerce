-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
