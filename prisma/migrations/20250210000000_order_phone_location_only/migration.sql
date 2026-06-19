-- Add location column (only phone + location collected at payment)
-- All statements wrapped to skip gracefully when Order doesn't exist yet on a fresh DB.

DO $$ BEGIN
  ALTER TABLE "Order" ADD COLUMN "location" TEXT;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;

-- Backfill location from existing address fields
DO $$ BEGIN
  UPDATE "Order"
  SET "location" = TRIM(CONCAT(COALESCE("address", ''), ', ', COALESCE("city", ''), ', ', COALESCE("country", '')))
  WHERE "location" IS NULL OR "location" = '';

  UPDATE "Order" SET "location" = '—' WHERE "location" IS NULL OR TRIM("location") = '';

  ALTER TABLE "Order" ALTER COLUMN "location" SET NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Make former required address/contact fields optional
DO $$ BEGIN
  ALTER TABLE "Order" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "fullname" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "country" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "state" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "address" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "city" DROP NOT NULL;
  ALTER TABLE "Order" ALTER COLUMN "postalCode" DROP NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
