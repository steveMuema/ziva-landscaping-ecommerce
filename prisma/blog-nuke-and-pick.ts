import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // 1. Nuke existing blog posts
    const deleted = await prisma.blogPost.deleteMany();
    console.log(`Deleted ${deleted.count} old generic blog posts.`);

    // 2. Fetch some interesting products to choose from
    const products = await prisma.product.findMany({
        take: 20,
        orderBy: { stock: "desc" },
        select: { id: true, name: true, description: true, imageUrl: true }
    });

    console.log("\n--- Available Products ---");
    products.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | Image: ${p.imageUrl}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
