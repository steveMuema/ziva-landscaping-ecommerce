-- Add location column (only phone + location collected at payment)
ALTER TABLE "Order" ADD COLUMN "location" TEXT;

-- Backfill location from existing address fields for existing orders
UPDATE "Order"
SET "location" = TRIM(CONCAT(COALESCE("address", ''), ', ', COALESCE("city", ''), ', ', COALESCE("country", '')))
WHERE "location" IS NULL OR "location" = '';

UPDATE "Order" SET "location" = '—' WHERE "location" IS NULL OR TRIM("location") = '';

ALTER TABLE "Order" ALTER COLUMN "location" SET NOT NULL;

-- Make former required address/contact fields optional
ALTER TABLE "Order" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "fullname" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "country" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "state" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "address" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "postalCode" DROP NOT NULL;
