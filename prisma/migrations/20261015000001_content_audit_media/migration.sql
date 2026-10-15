-- Editable content blocks, admin audit log and media library.
-- Idempotent like the other migrations, so it is safe to re-run.

CREATE TABLE IF NOT EXISTS "ContentBlock" (
  "key" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" SERIAL NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

CREATE TABLE IF NOT EXISTS "Media" (
  "id" SERIAL NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT,
  "filename" TEXT,
  "mimeType" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "bytes" INTEGER,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Media_url_key" ON "Media"("url");
CREATE INDEX IF NOT EXISTS "Media_createdAt_idx" ON "Media"("createdAt");
