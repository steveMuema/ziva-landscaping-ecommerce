-- AlterTable
DO $$ BEGIN
  ALTER TABLE "OrderPaymentRef" ADD COLUMN "amount" DOUBLE PRECISION;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;
