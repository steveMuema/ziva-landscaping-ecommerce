/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    include: { subCategories: { include: { products: true } } },
  });
}

  export async function getCategoryByName(name: string) {
    return prisma.category.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
      include: { subCategories: { include: { products: true } } },
    });
  }

export async function getSubCategoryByNames(categoryName: string, subCategoryName: string) {
  // if (!categoryName || !subCategoryName) return null;
  console.log("Searching for - categoryName:", categoryName, "subCategoryName:", subCategoryName); // Debug search terms

  // Find the category first
  const category = await prisma.category.findFirst({
    where: { name: { equals: categoryName, mode: "insensitive" } },
  });

  if (!category) return null;

  // Find the subcategory within the category using categoryId
  const subCategory = await prisma.subCategory.findFirst({
    where: {
      categoryId: category.id,
      name: { equals: subCategoryName, mode: "insensitive" },
    },
    include: { products: {include: { subCategory: true, carts: true, wishlists: true },}, category: true },
  });

  return subCategory || null;
}


export async function getProductsBySubCategory(subCategoryId: string) {
  return prisma.product.findMany({
    where: { subCategoryId: parseInt(subCategoryId) },
  });
}
