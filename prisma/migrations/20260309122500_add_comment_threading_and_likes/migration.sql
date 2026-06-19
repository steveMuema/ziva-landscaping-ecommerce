-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Comment" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "parentId" INTEGER;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
