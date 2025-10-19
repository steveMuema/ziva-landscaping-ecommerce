-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- AlterTable: Change Order.status from String to OrderStatus enum
-- First, update existing data to match enum values (convert lowercase to uppercase)
UPDATE "Order" SET status = 'PENDING' WHERE LOWER(status) = 'pending';
UPDATE "Order" SET status = 'PROCESSING' WHERE LOWER(status) = 'processing';
UPDATE "Order" SET status = 'COMPLETED' WHERE LOWER(status) = 'completed';
UPDATE "Order" SET status = 'CANCELLED' WHERE LOWER(status) = 'cancelled';

-- Now alter the column type
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex: Add index on Product.subCategoryId for better query performance
CREATE INDEX "Product_subCategoryId_idx" ON "Product"("subCategoryId");

-- Create unique constraint on Cart (clientId, productId)
-- First, remove any duplicate entries (keep the most recent one)
DELETE FROM "Cart" a USING "Cart" b
WHERE a.id < b.id 
AND a."clientId" = b."clientId" 
AND a."productId" = b."productId";

ALTER TABLE "Cart" ADD CONSTRAINT "Cart_clientId_productId_key" UNIQUE ("clientId", "productId");

-- Create unique constraint on Wishlist (clientId, productId)
-- First, remove any duplicate entries (keep the most recent one)
DELETE FROM "Wishlist" a USING "Wishlist" b
WHERE a.id < b.id 
AND a."clientId" = b."clientId" 
AND a."productId" = b."productId";

ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_clientId_productId_key" UNIQUE ("clientId", "productId");

-- Create unique constraint on OrderItem (orderId, productId)
-- First, remove any duplicate entries (keep the most recent one)
DELETE FROM "OrderItem" a USING "OrderItem" b
WHERE a.id < b.id 
AND a."orderId" = b."orderId" 
AND a."productId" = b."productId";

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_productId_key" UNIQUE ("orderId", "productId")