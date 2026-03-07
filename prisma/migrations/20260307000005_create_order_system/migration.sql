-- Create Order system tables (Order, OrderItem, OrderPaymentRef)
-- All statements use IF NOT EXISTS so this is safe to run even if partially applied.

-- Enums
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'PAY_ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order table
CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "email" TEXT,
    "fullname" TEXT,
    "company" TEXT,
    "country" TEXT,
    "state" TEXT,
    "address" TEXT,
    "apartment" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "costTotal" DOUBLE PRECISION,
    "transportFee" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'KSH',
    "paymentMethod" "PaymentMethod",
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mpesaReceiptNo" TEXT,
    "completedAt" TIMESTAMP(3),
    "waveInvoiceId" TEXT,
    "waveCustomerId" TEXT,
    "zohoInvoiceId" TEXT,
    "zohoCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- OrderPaymentRef table
CREATE TABLE IF NOT EXISTS "OrderPaymentRef" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPaymentRef_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderPaymentRef_orderId_idx" ON "OrderPaymentRef"("orderId");
CREATE INDEX IF NOT EXISTS "OrderPaymentRef_value_idx" ON "OrderPaymentRef"("value");

-- OrderItem table
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- Foreign keys (safe to add; ignored if already exist via DO blocks)
DO $$ BEGIN
  ALTER TABLE "OrderPaymentRef" ADD CONSTRAINT "OrderPaymentRef_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
