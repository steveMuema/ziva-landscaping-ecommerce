-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- AlterTable: drop legacy image column (safe if already removed)
DO $$ BEGIN
  ALTER TABLE "Product" DROP COLUMN "image";
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- CreateTable (old Order schema; dropped and replaced by later migrations)
CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL NOT NULL,
    "userDetails" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
