-- At most one super admin, enforced by the database. Prisma's schema can't express a partial
-- index, so it lives only here; the super admin role is transferred, never shared. Idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS "User_single_superadmin" ON "User" ("role") WHERE "role" = 'superadmin';
