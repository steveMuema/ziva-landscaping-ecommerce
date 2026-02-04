-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'PAY_ON_DELIVERY');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "isAgriculture" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'KSH',
ADD COLUMN "paymentMethod" "PaymentMethod",
ADD COLUMN "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "mpesaReceiptNo" TEXT;

-- CreateTable
CREATE TABLE "MpesaStkRequest" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpesaStkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MpesaStkRequest_checkoutRequestId_key" ON "MpesaStkRequest"("checkoutRequestId");
