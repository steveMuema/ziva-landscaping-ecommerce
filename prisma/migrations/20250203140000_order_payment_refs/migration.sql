-- CreateTable
CREATE TABLE "OrderPaymentRef" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPaymentRef_pkey" PRIMARY KEY ("id")
);

-- Backfill from Order.mpesaReceiptNo
INSERT INTO "OrderPaymentRef" ("orderId", "value", "createdAt")
SELECT id, "mpesaReceiptNo", COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "Order"
WHERE "mpesaReceiptNo" IS NOT NULL AND TRIM("mpesaReceiptNo") != '';

-- DropColumn
ALTER TABLE "Order" DROP COLUMN "mpesaReceiptNo";

-- CreateIndex
CREATE INDEX "OrderPaymentRef_orderId_idx" ON "OrderPaymentRef"("orderId");

-- CreateIndex
CREATE INDEX "OrderPaymentRef_value_idx" ON "OrderPaymentRef"("value");

-- AddForeignKey
ALTER TABLE "OrderPaymentRef" ADD CONSTRAINT "OrderPaymentRef_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
