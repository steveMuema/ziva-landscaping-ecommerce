const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    try {
        console.log('Adding BlogPost.imageUrl...');
        await prisma.$executeRawUnsafe('ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;');
        console.log('Adding Category.isAgriculture...');
        await prisma.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isAgriculture" BOOLEAN NOT NULL DEFAULT false;');
        console.log('Adding User.twoFactorSecret...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;');
        console.log('Adding User.twoFactorEnabled...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;');
        console.log('Adding Product.tags...');
        await prisma.$executeRawUnsafe("ALTER TABLE \"Product\" ADD COLUMN IF NOT EXISTS \"tags\" TEXT[] DEFAULT '{}';");
        console.log('Done!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
