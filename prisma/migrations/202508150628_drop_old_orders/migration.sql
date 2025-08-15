-- Drop the previous OrderItem table first due to foreign key dependencies
DROP TABLE IF EXISTS "OrderItem" CASCADE;

-- Drop the previous Order table
DROP TABLE IF EXISTS "Order" CASCADE;