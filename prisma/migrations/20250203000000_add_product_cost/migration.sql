-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "cost" DOUBLE PRECISION;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;
