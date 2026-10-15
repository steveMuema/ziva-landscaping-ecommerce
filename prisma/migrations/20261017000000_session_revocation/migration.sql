-- Lets admins end a user's existing sign-ins (password reset, 2FA reset, role change). Idempotent.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionsValidAfter" TIMESTAMP(3);
