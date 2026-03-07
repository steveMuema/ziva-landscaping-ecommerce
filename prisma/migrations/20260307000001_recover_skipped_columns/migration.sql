-- Recovery migration: safely adds columns/tables that were skipped when
-- old conflicting migrations were bypassed via --applied during production baseline.
-- All statements use IF NOT EXISTS / DO blocks to be idempotent.

-- From 20250822000000_add_payment_agriculture
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'PAY_ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isAgriculture" BOOLEAN NOT NULL DEFAULT false;

-- Order columns: wrapped in a block to skip gracefully if the table name differs in prod
DO $$ BEGIN
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'KSH';
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod";
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "mpesaReceiptNo" TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MpesaStkRequest" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MpesaStkRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MpesaStkRequest_checkoutRequestId_key" ON "MpesaStkRequest"("checkoutRequestId");

-- From 20250822000001_add_blog_post
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- Add imageUrl column in case BlogPost table already existed without it
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;


-- From 20250822000002_add_product_tags
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';

-- From 20260307000000_add_two_factor_to_user
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
