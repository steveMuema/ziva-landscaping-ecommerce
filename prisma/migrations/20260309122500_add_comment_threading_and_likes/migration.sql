-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
