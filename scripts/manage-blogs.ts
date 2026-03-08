import prisma from "../src/lib/prisma";

async function main() {
    console.log("Deleting all existing blog posts...");
    await prisma.blogPost.deleteMany({});
    console.log("All existing blog posts deleted.");

    console.log("Searching for Bermuda grass in products...");
    const products = await prisma.product.findMany({
        where: {
            name: {
                contains: "Bermuda",
                mode: "insensitive"
            }
        }
    });

    console.log(`Found ${products.length} products matching 'Bermuda'`);
    console.log(products.map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl })));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
