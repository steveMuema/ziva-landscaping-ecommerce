-- Create the users table
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255),
  "emailVerified" TIMESTAMP(3),
  "password" VARCHAR(255),
  "role" VARCHAR(50) NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

-- Create an index on the email column for faster lookups
CREATE INDEX "users_email_idx" ON "users" ("email");

-- Add a comment to the table for documentation
COMMENT ON TABLE "users" IS 'Stores user information for the e-commerce platform';