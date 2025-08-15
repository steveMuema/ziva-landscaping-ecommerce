import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { clientId, email, shippingData, items, subtotal } = await request.json();
    if (!clientId || !email || !shippingData || !items || !subtotal) {
      return NextResponse.json({ error: 'Missing required fields: clientId, email, shippingData, items, or subtotal' }, { status: 400 });
    }

    // Validate shippingData fields
    if (
      !shippingData.fullname ||
      !shippingData.phone ||
      !shippingData.country ||
      !shippingData.state ||
      !shippingData.address ||
      !shippingData.city ||
      !shippingData.postalCode
    ) {
      return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items must be a non-empty array' }, { status: 400 });
    }

    // Validate products and stock
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json({ error: `Invalid item data: ${JSON.stringify(item)}` }, { status: 400 });
      }
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ID ${item.productId}` }, { status: 404 });
      }
      if (item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for product ID ${item.productId}. Available: ${product.stock}` },
          { status: 400 }
        );
      }
    }

    // Create order and update stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          clientId,
          email,
          fullname: shippingData.fullname,
          phone: shippingData.phone,
          company: shippingData.company || null,
          country: shippingData.country,
          state: shippingData.state,
          address: shippingData.address,
          apartment: shippingData.apartment || null,
          city: shippingData.city,
          postalCode: shippingData.postalCode,
          subtotal,
          status: 'PENDING',
          orderItems: {
            create: items.map((item: { productId: number; quantity: number; price: number }) => ({
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
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    console.log('Order created with ID:', order.id);
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const orderId = parseInt(searchParams.get('orderId') || '0', 10);
    if (!clientId || !orderId || isNaN(orderId)) {
      return NextResponse.json({ error: 'Missing or invalid clientId or orderId' }, { status: 400 });
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
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    if (!order.orderItems.every((item) => item.product)) {
      console.warn(`Order ${order.id} has invalid order items`);
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { clientId, orderId, status } = await request.json();
    if (!clientId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields: clientId, orderId, or status' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status, updatedAt: new Date() },
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
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { clientId, orderId } = await request.json();
    if (!clientId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields: clientId or orderId' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete order items first due to foreign key constraints
      await tx.orderItem.deleteMany({
        where: { orderId },
      });
      // Delete the order
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    return NextResponse.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}