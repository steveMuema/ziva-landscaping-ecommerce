import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findFirst();
  if (!category) {
    console.log("No category found");
    return;
  }
  let subCat = await prisma.subCategory.findFirst({ where: { categoryId: category.id } });
  if (!subCat) {
    subCat = await prisma.subCategory.create({ data: { name: "Test Sub", categoryId: category.id } });
  }

  for (let i = 0; i < 200; i++) {
    await prisma.product.create({
      data: {
        name: `Test Product ${i}`,
        price: 100,
        cost: 90,
        stock: 10,
        subCategoryId: subCat.id,
        tags: ["test"]
      }
    });
  }
  console.log("Seeded 200 products");
}
main().catch(console.error).finally(() => prisma.$disconnect());
