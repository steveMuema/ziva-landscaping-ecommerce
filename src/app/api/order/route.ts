import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const ORDER_STATUS = new Set(['PENDING','PROCESSING','COMPLETED','CANCELLED']);

const PRICING_THRESHOLD_KSH = 10_000;
const DOWN_PAYMENT_RATIO = 0.5;

export async function POST(request: Request) {
  try {
    const { clientId, phone, location, items, subtotal, paymentMethod, amountPaid, mpesaReceiptNo } = await request.json();
    if (!clientId || !phone || !location || !items || subtotal == null) {
      return NextResponse.json({ error: 'Missing required fields: clientId, phone, location, items, or subtotal' }, { status: 400 });
    }

    const requiredAmount = subtotal < PRICING_THRESHOLD_KSH ? subtotal : Math.round(subtotal * DOWN_PAYMENT_RATIO * 100) / 100;
    const paid = typeof amountPaid === 'number' ? amountPaid : 0;
    const method = paymentMethod === 'MPESA' || paymentMethod === 'CASH' || paymentMethod === 'PAY_ON_DELIVERY' ? paymentMethod : 'CASH';

    if (method === 'MPESA' && paid < requiredAmount) {
      return NextResponse.json({ error: `M-Pesa payment required: KSH ${requiredAmount.toFixed(2)} (${subtotal < PRICING_THRESHOLD_KSH ? 'full' : '50% down'})` }, { status: 400 });
    }

    const locationTrimmed = String(location).trim();
    if (!locationTrimmed) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
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

    // Create order and update stock in a transaction (only phone + location collected at payment)
    const [orderResult] = await prisma.$transaction([
      prisma.order.create({
        data: {
          clientId,
          phone: String(phone).trim(),
          location: locationTrimmed,
          subtotal,
          currency: 'KSH',
          paymentMethod: method,
          amountPaid: paid,
          mpesaReceiptNo: mpesaReceiptNo || null,
          status: 'PENDING',
          orderItems: {
            create: items.map((item) => ({
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
                select: { id: true, name: true, price: true, imageUrl: true, description: true, stock: true, subCategoryId: true }
              }
            }
          }
        }
      }),
      ...items.map((item) =>
        prisma.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        })
      )
    ]);

    revalidatePath("/admin/finance");
    return NextResponse.json({ orderId: orderResult.id });
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
    const { orderId, status } = await request.json();
    if (!ORDER_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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

    revalidatePath("/admin/finance");
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