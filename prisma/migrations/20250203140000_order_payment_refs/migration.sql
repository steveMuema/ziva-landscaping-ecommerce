-- CreateTable (safe if Order doesn't exist yet on a fresh DB)
CREATE TABLE IF NOT EXISTS "OrderPaymentRef" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPaymentRef_pkey" PRIMARY KEY ("id")
);

-- Backfill from Order.mpesaReceiptNo (skip if Order or column missing)
DO $$ BEGIN
  INSERT INTO "OrderPaymentRef" ("orderId", "value", "createdAt")
  SELECT id, "mpesaReceiptNo", COALESCE("updatedAt", CURRENT_TIMESTAMP)
  FROM "Order"
  WHERE "mpesaReceiptNo" IS NOT NULL AND TRIM("mpesaReceiptNo") != '';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- DropColumn (skip if Order or column missing)
DO $$ BEGIN
  ALTER TABLE "Order" DROP COLUMN "mpesaReceiptNo";
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderPaymentRef_orderId_idx" ON "OrderPaymentRef"("orderId");
CREATE INDEX IF NOT EXISTS "OrderPaymentRef_value_idx" ON "OrderPaymentRef"("value");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "OrderPaymentRef" ADD CONSTRAINT "OrderPaymentRef_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;
