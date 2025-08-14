-- Create Cart table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Cart" (
    "id" SERIAL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Create Wishlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Wishlist" (
    "id" SERIAL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Rename userId to clientId if Cart exists with userId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Cart' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "Cart" RENAME COLUMN "userId" TO "clientId";
    END IF;
END $$;

-- Rename userId to clientId if Wishlist exists with userId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Wishlist' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "Wishlist" RENAME COLUMN "userId" TO "clientId";
    END IF;
END $$;

-- Add foreign key constraints if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Cart_productId_fkey'
    ) THEN
        ALTER TABLE "Cart" ADD CONSTRAINT "Cart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Wishlist_productId_fkey'
    ) THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Cart_clientId_idx" ON "Cart" ("clientId");
CREATE INDEX IF NOT EXISTS "Wishlist_clientId_idx" ON "Wishlist" ("clientId");