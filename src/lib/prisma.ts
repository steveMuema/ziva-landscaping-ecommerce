import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: [ "info", "warn", "error"], // Optional: Log queries for debugging
})

// Export the Prisma client
export default prisma;