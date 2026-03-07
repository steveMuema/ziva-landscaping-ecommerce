-- Recovery v2: safely adds all columns/tables missing in production.
-- Uses IF NOT EXISTS throughout so it is fully idempotent.

-- PaymentMethod enum (from add_payment_agriculture, skipped at baseline)
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'PAY_ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isAgriculture" BOOLEAN NOT NULL DEFAULT false;

-- Order columns (skip gracefully if table name differs)
DO $$ BEGIN
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'KSH';
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod";
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "mpesaReceiptNo" TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- MpesaStkRequest
CREATE TABLE IF NOT EXISTS "MpesaStkRequest" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MpesaStkRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MpesaStkRequest_checkoutRequestId_key" ON "MpesaStkRequest"("checkoutRequestId");

-- PageView
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path");
CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");

-- BlogPost
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- imageUrl on BlogPost (in case table already existed without it)
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Product tags
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';

-- User: two-factor auth columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
