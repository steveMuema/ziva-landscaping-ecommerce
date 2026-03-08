import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Ensure the connection_limit is always set to 1 per serverless function invocation.
// This prevents connection pool exhaustion on Neon/Supabase free tiers.
function buildUrl(base: string | undefined): string {
  if (!base) return "";
  try {
    const url = new URL(base);
    url.searchParams.set("connection_limit", "1");
    url.searchParams.set("pool_timeout", "10");
    return url.toString();
  } catch {
    return base;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma?: any };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
    datasources: {
      db: { url: buildUrl(process.env.DATABASE_URL) },
    },
  }).$extends(withAccelerate());

// Cache the client globally in ALL environments to prevent re-instantiation
// across hot-reloads in dev and across invocations within the same lambda instance in prod.
globalForPrisma.prisma = prisma;

export default prisma;