/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    include: { subCategories: { include: { products: true } } },
    orderBy: { id: "asc" },
  });
}

export async function getCategoryByName(name: string) {
  return prisma.category.findFirst({
    where: { name: { contains: name, mode: "insensitive" } },
    orderBy: { id: "asc" },
    include: { subCategories: { include: { products: true } } },
  });
}

export async function getSubCategoryByNames(categoryName: string, subCategoryName: string) {
  console.log("Searching for - categoryName:", categoryName, "subCategoryName:", subCategoryName);
  const category = await prisma.category.findFirst({
    where: { name: { equals: categoryName, mode: "insensitive" } },
    orderBy: { id: "asc" },
    include: {
      subCategories: {
        include: { products: true },
      },
    },
  });

  if (!category) return null;

  const subCategory = await prisma.subCategory.findFirst({
    where: {
      categoryId: category.id,
      name: { equals: subCategoryName, mode: "insensitive" },
    },
    orderBy: { id: "asc" },
    include: {
      products: {
        include: { subCategory: { include: { category: true } } },
      },
      category: {
        include: { subCategories: { include: { products: true } } },
      },
    },
  });

  return subCategory || null;
}

export async function getProductsBySubCategory(subCategoryId: string) {
  return prisma.product.findMany({
    where: { subCategoryId: parseInt(subCategoryId) },
    orderBy: { id: "asc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { subCategory: { include: { category: true } } },
  });
}

export async function getCart(clientId: string) {
  try {
    const cartItems = await prisma.cart.findMany({
      where: { clientId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            description: true,
            stock: true,
            subCategoryId: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    const validItems = cartItems.filter((item) => {
      if (!item.product) {
        console.warn(`Cart item ${item.id} has no associated product, productId: ${item.productId}`);
        return false;
      }
      return true;
    });
    return validItems;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function addToCart(clientId: string, productId: number, quantity: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new Error(`Product with ID ${productId} does not exist`);
    }
    const existingCartItem = await prisma.cart.findFirst({
      where: { clientId, productId },
    });

    if (existingCartItem) {
      return prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              description: true,
              stock: true,
              subCategoryId: true,
            },
          },
        },
      });
    }

    return prisma.cart.create({
      data: {
        clientId,
        productId,
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            description: true,
            stock: true,
            subCategoryId: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function removeFromCart(clientId: string, productId: number) {
  try {
    const result = await prisma.cart.deleteMany({
      where: { clientId, productId },
    });
    if (result.count === 0) {
      console.warn(`No cart item found for clientId: ${clientId}, productId: ${productId}`);
    }
    return result;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function clearCart(clientId: string) {
  try {
    const result = await prisma.cart.deleteMany({
      where: { clientId },
    });
    console.log(`Cleared ${result.count} items from cart for clientId: ${clientId}`);
    return result;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}

export async function getWishlist(clientId: string) {
  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { clientId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            description: true,
            stock: true,
            subCategoryId: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    const validItems = wishlistItems.filter((item) => {
      if (!item.product) {
        console.warn(`Wishlist item ${item.id} has no associated product, productId: ${item.productId}`);
        return false;
      }
      return true;
    });
    return validItems;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

export async function addToWishlist(clientId: string, productId: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new Error(`Product with ID ${productId} does not exist`);
    }
    const existingWishlistItem = await prisma.wishlist.findFirst({
      where: { clientId, productId },
    });

    if (existingWishlistItem) {
      return existingWishlistItem;
    }

    return prisma.wishlist.create({
      data: {
        clientId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            description: true,
            stock: true,
            subCategoryId: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
}

export async function removeFromWishlist(clientId: string, productId: number) {
  try {
    const result = await prisma.wishlist.deleteMany({
      where: { clientId, productId },
    });
    if (result.count === 0) {
      console.warn(`No wishlist item found for clientId: ${clientId}, productId: ${productId}`);
    }
    return result;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
}