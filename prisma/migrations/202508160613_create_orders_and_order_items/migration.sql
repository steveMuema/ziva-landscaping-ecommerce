-- Creating Orders table
CREATE TABLE "Order" (
    "id" SERIAL PRIMARY KEY,
    "clientId" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "country" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "apartment" VARCHAR(255),
    "city" VARCHAR(255) NOT NULL,
    "postalCode" VARCHAR(255) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Creating OrderItems table
CREATE TABLE "OrderItem" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT
);

-- Create index for faster lookups
CREATE INDEX idx_order_clientId ON "Order"("clientId");
CREATE INDEX idx_orderItem_orderId ON "OrderItem"("orderId");
CREATE INDEX idx_orderItem_productId ON "OrderItem"("productId");