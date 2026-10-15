-- CMS editing: product status/SKU/sale price/gallery/SEO, blog SEO + slug history.
-- Idempotent like the other migrations, so it is safe to re-run.

DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "previousSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
