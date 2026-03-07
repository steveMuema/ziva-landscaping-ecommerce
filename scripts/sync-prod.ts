import { PrismaClient } from '@prisma/client';

const PROD_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19YNm9CNnFNX0dKc2szWERBM1NnS3UiLCJhcGlfa2V5IjoiMDFLSkRFNEZUTUFIN0JUTVA3MjlXWU1YTUoiLCJ0ZW5hbnRfaWQiOiI5OGU3ODk4OGVmYmNkYzc0MjJiNGIwZGEzYTdlYTBkNDlmYjUxOGY0NzRhODVlN2Q5ZWNjN2M2YjgzOTM3NjE4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNjY5ZDA3YzUtOGU3YS00ZjNjLWFjNzEtNjU0ZDU5MDFhN2NlIn0.5YElx9DhhC5UOYKof-jM0M4w-ljRfBJcfgz26q1SFB4";

const localPrisma = new PrismaClient();
const remotePrisma = new PrismaClient({
    datasourceUrl: PROD_URL
});

async function main() {
    console.log("Fetching production data...");

    let categories: any[] = [];
    try { categories = await remotePrisma.$queryRaw<any[]>`SELECT * FROM "Category"`; }
    catch { console.log("Missing Category table in prod."); }

    let subCategories: any[] = [];
    try { subCategories = await remotePrisma.$queryRaw<any[]>`SELECT * FROM "SubCategory"`; }
    catch { console.log("Missing SubCategory table in prod."); }

    let products: any[] = [];
    try { products = await remotePrisma.$queryRaw<any[]>`SELECT * FROM "Product"`; }
    catch { console.log("Missing Product table in prod."); }

    let blogs: any[] = [];
    try { blogs = await remotePrisma.$queryRaw<any[]>`SELECT * FROM "BlogPost"`; }
    catch { console.log("Missing BlogPost table in prod."); }

    console.log(`Found ${categories.length} categories, ${subCategories.length} subcategories, ${products.length} products, ${blogs.length} blogs in Production.`);

    console.log("Clearing local data to prepare for sync...");
    // Clear everything related to products/orders so we can insert clean IDs
    await localPrisma.orderItem.deleteMany();
    await localPrisma.orderPaymentRef.deleteMany();
    await localPrisma.order.deleteMany();
    await localPrisma.cart.deleteMany();
    await localPrisma.wishlist.deleteMany();
    await localPrisma.product.deleteMany();
    await localPrisma.subCategory.deleteMany();
    await localPrisma.category.deleteMany();
    await localPrisma.blogPost.deleteMany();

    console.log("Inserting production data into local database...");

    if (categories.length > 0) {
        const mappedCategories = categories.map((c: any) => ({
            ...c,
            isAgriculture: c.isAgriculture ?? false,
        }));
        await localPrisma.category.createMany({ data: mappedCategories });
        console.log(`✅ Synced ${categories.length} Categories.`);
    }

    if (subCategories.length > 0) {
        await localPrisma.subCategory.createMany({ data: subCategories });
        console.log(`✅ Synced ${subCategories.length} SubCategories.`);
    }

    if (products.length > 0) {
        const mappedProducts = products.map((p: any) => ({
            ...p,
            tags: p.tags ?? [],
            cost: p.cost ?? Math.round(Number(p.price) * 0.9 * 100) / 100,
        }));
        await localPrisma.product.createMany({ data: mappedProducts });
        console.log(`✅ Synced ${products.length} Products.`);
    }

    if (blogs.length > 0) {
        await localPrisma.blogPost.createMany({ data: blogs });
        console.log(`✅ Synced ${blogs.length} BlogPosts.`);
    }

    console.log("🎉 Sync complete. Your local database mirror is ready.");
}

main()
    .catch(e => {
        console.error("Sync failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await localPrisma.$disconnect();
        await remotePrisma.$disconnect();
    });
