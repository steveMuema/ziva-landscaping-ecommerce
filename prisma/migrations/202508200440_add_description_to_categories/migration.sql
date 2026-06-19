-- Add description column to Category table
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS description TEXT;