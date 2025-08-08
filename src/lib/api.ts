/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    include: { subCategories: { include: { products: true } } },
    orderBy: {id: "asc"},
  });
}

  export async function getCategoryByName(name: string) {
    return prisma.category.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
      orderBy: {id: "asc"},
      include: { subCategories: { include: { products: true } } },
    });
  }

export async function getSubCategoryByNames(categoryName: string, subCategoryName: string) {
  console.log("Searching for - categoryName:", categoryName, "subCategoryName:", subCategoryName); // Debug search terms

  // Find the category first with limited relations
  const category = await prisma.category.findFirst({
    where: { name: { equals: categoryName, mode: "insensitive" } }, 
    orderBy: {id: "asc"},
    include: {
      subCategories: {
        include: {
          products: {
            include: {
              subCategory: true,
              carts: true,
              wishlists: true,
            },
          },
        },
      },
    },
  });

  if (!category) return null;

  // Find the subcategory within the category using categoryId
  const subCategory = await prisma.subCategory.findFirst({
    where: {
      categoryId: category.id,
      name: { equals: subCategoryName, mode: "insensitive" },
    },
    orderBy: {id: "asc"},
    include: {
      products: {
        include: {
          subCategory: {
            include: {
              category: true, // Include basic category, avoid deep nesting
            },
          },
          carts: true,
          wishlists: true,
        },
      },
      category: {
        include: {
          subCategories: {
            include: {
              products: {
                include: {
                  subCategory: true,
                  carts: true,
                  wishlists: true, // Ensure nested products have full relations
                },
              },
            },
          },
        },
      },
    },
  });

  return subCategory || null;
}

export async function getProductsBySubCategory(subCategoryId: string) {
  return prisma.product.findMany({
    where: { subCategoryId: parseInt(subCategoryId) },
    orderBy: {id: "asc"},
  });
}
export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: {id: parseInt(id)}
  })
}
