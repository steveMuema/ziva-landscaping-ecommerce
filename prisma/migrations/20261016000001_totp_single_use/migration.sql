-- Remember the last accepted authenticator code step so a code can't be reused. Idempotent.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastTotpStep" INTEGER;
