/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma  from "@/lib/prisma";
import { Cart, Order } from "@/types";

enum OrderStatus {
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
}



export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: { subCategories: { include: { products: true } } },
      orderBy: { id: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoryByName(name: string) {
  try {
    const category = await prisma.category.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
      orderBy: { id: "asc" },
      include: { subCategories: { include: { products: true } } },
    });
    return category;
  } catch (error) {
    console.error("Error fetching category by name:", error);
    return null;
  }
}

export async function getSubCategoryByNames(categoryName: string, subCategoryName: string, tag?: string) {
  try {
    console.log("Searching for - categoryName:", categoryName, "subCategoryName:", subCategoryName, "tag:", tag);
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
          where: tag ? { tags: { has: tag } } : undefined,
          include: { subCategory: { include: { category: true } } },
        },
        category: {
          include: { subCategories: { include: { products: true } } },
        },
      },
    });

    return subCategory || null;
  } catch (error) {
    console.error("Error fetching subcategory by names:", error);
    return null;
  }
}

export async function getProductsBySubCategory(subCategoryId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { subCategoryId: parseInt(subCategoryId) },
      orderBy: { id: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    return [];
  }
}

export async function getProductsByTag(tag: string) {
  try {
    const products = await prisma.product.findMany({
      where: { tags: { has: tag } },
      orderBy: { id: "asc" },
      include: { subCategory: { include: { category: true } } },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products by tag:", error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { subCategory: { include: { category: true } } },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

export async function getCart(clientId: string): Promise<Cart[]> {
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
    return validItems as Cart[];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function addToCart(clientId: string, productId: number, quantity: number): Promise<Cart> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new Error(`Product with ID ${productId} does not exist`);
    }
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for product ID ${productId}`);
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
      }) as Promise<Cart>;
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
    }) as Promise<Cart>;
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

export async function updateCart(clientId: string, productId: number, quantity: number): Promise<Cart> {
  try {
    const existingCartItem = await prisma.cart.findFirst({
      where: { clientId, productId },
      include: { product: true },
    });

    if (!existingCartItem) {
      throw new Error(`Cart item with productId ${productId} not found for clientId ${clientId}`);
    }
    if (existingCartItem.product.stock < quantity) {
      throw new Error(`Insufficient stock for product ID ${productId}`);
    }

    const updatedCartItem = await prisma.cart.update({
      where: { id: existingCartItem.id },
      data: { quantity },
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

    return updatedCartItem as Cart;
  } catch (error) {
    console.error("Error updating cart:", error);
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

export async function getOrders(clientId: string): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { clientId },
      include: {
        orderItems: {
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
        },
      },
      orderBy: { id: "asc" },
    });
    const validOrders = orders.filter((order) => {
      if (!order.orderItems.every((item) => item.product)) {
        console.warn(`Order ${order.id} has invalid order items`);
        return false;
      }
      return true;
    });
    return validOrders as unknown as Order[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getOrder(orderId: number, clientId: string): Promise<Order | null> {
  try {
    if (!orderId || isNaN(orderId)) {
      console.warn(`Invalid orderId: ${orderId}`);
      throw new Error("Invalid orderId");
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
      include: {
        orderItems: {
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
        },
      },
    });
    if (!order) {
      console.warn(`No order found for orderId: ${orderId}, clientId: ${clientId}`);
      return null;
    }
    if (!order.orderItems.every((item) => item.product)) {
      console.warn(`Order ${order.id} has invalid order items`);
      return null;
    }
    return order as unknown as Order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

export async function createOrder(data: {
  clientId: string;
  email: string;
  shippingData: {
    fullname: string;
    phone: string;
    company: string;
    country: string;
    state: string;
    address: string;
    apartment: string;
    city: string;
    postalCode: string;
  };
  items: { productId: number; quantity: number; price: number }[];
  subtotal: number;
}): Promise<{ orderId: number }> {
  try {
    // Validate required fields
    if (!data.clientId || !data.email || !data.shippingData.fullname || !data.shippingData.phone || !data.shippingData.country || !data.shippingData.state || !data.shippingData.address || !data.shippingData.city || !data.shippingData.postalCode) {
      throw new Error('Missing required fields');
    }
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      throw new Error('Invalid email address');
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    // Validate products and stock
    for (const item of data.items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
      }
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new Error(`Product with ID ${item.productId} does not exist`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.productId}`);
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          clientId: data.clientId,
          email: data.email,
          fullname: data.shippingData.fullname,
          phone: data.shippingData.phone,
          company: data.shippingData.company || null,
          country: data.shippingData.country,
          state: data.shippingData.state,
          address: data.shippingData.address,
          apartment: data.shippingData.apartment || null,
          city: data.shippingData.city,
          postalCode: data.shippingData.postalCode,
          subtotal: data.subtotal,
          status: 'PENDING',
          orderItems: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          orderItems: {
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
          },
        },
      });

      // Update product stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return { orderId: order.id };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function updateOrder(clientId: string, orderId: number, status: string): Promise<Order> {
  try {
    if (!clientId || !orderId || isNaN(orderId) || !status) {
      throw new Error(`Missing or invalid clientId, orderId, or status`);
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
    });
    if (!order) {
      throw new Error(`Order not found for orderId: ${orderId}, clientId: ${clientId}`);
    }
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: { set: status as unknown as OrderStatus }, updatedAt: new Date() },
      include: {
        orderItems: {
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
        },
      },
    });
    if (!updatedOrder.orderItems.every((item) => item.product)) {
      console.warn(`Updated order ${orderId} has invalid order items`);
      throw new Error(`Invalid order items in updated order ${orderId}`);
    }
    return updatedOrder as unknown as Order;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
}

export async function deleteOrder(clientId: string, orderId: number) {
  try {
    if (!clientId || !orderId || isNaN(orderId)) {
      throw new Error(`Missing or invalid clientId or orderId`);
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
    });
    if (!order) {
      console.warn(`No order found for orderId: ${orderId}, clientId: ${clientId}`);
      throw new Error(`Order not found or unauthorized`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId },
      });
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    return { message: 'Order deleted' };
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}