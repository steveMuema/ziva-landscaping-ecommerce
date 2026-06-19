-- AlterTable
DO $$ BEGIN
  ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
