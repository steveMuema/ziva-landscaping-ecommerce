-- Add description column to SubCategory table
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS description TEXT;
