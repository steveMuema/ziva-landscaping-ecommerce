const { Client } = require('pg');

const DATABASE_URL = 'postgres://ziva:ziva_dev_secret@localhost:5434/ziva_landscaping'; // Fallback
// Parse Prisma Accelerate URL to get the direct connection URL or just use the Vercel DB direct string if available
// Since Prisma Accelerate uses HTTP, pg cannot connect directly to accelerate.prisma-data.net.
// We need the *direct* database connection string. But we don't have it here.

// Alternatively, let's use Prisma Client! Prisma Client works over Accelerate.
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL
    });

    try {
        console.log('Adding twoFactorSecret column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;');

        console.log('Adding twoFactorEnabled column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;');

        console.log('Columns added successfully.');
    } catch (error) {
        console.error('Error executing SQL:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
