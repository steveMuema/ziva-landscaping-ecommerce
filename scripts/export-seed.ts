import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("Exporting local DB data (which is a replica of production)...");

    const categories = await prisma.category.findMany({
        include: {
            subCategories: {
                include: {
                    products: true
                }
            }
        }
    });

    const seedData = {
        categories
    };

    const outPath = path.join(__dirname, '../prisma/seed-data.json');
    fs.writeFileSync(outPath, JSON.stringify(seedData, null, 2));

    console.log(`Successfully wrote ${categories.length} categories to prisma/seed-data.json!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
