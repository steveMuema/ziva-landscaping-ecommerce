-- CreateEnum (safe)
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'PAY_ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isAgriculture" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'KSH',
    ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod",
    ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "mpesaReceiptNo" TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MpesaStkRequest" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpesaStkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MpesaStkRequest_checkoutRequestId_key" ON "MpesaStkRequest"("checkoutRequestId");
