import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { Cart } from '@/types';

export async function POST(request: Request) {
  try {
    const { clientId, productId, quantity } = await request.json();
    if (!clientId || !productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: `Product with ID ${productId} does not exist` }, { status: 404 });
    }

    const item = await prisma.cart.upsert({
      where: { // requires a unique input in Prisma; create a @@unique as above
        clientId_productId: { clientId, productId },
      },
      update: { quantity: { increment: quantity } },
      create: { clientId, productId, quantity },
      include: {
        product: { select: { id: true, name: true, price: true, imageUrl: true, description: true, stock: true, subCategoryId: true } }
      }
    });
    return NextResponse.json(item);

    const newItem = await prisma.cart.create({
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
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { clientId, productId, quantity } = await request.json();
    if (!clientId || !productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingCartItem = await prisma.cart.findFirst({
      where: { clientId, productId },
    });

    if (!existingCartItem) {
      return NextResponse.json({ error: `Cart item with productId ${productId} not found` }, { status: 404 });
    }

    const updatedItem = await prisma.cart.update({
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

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { clientId, productId } = await request.json();
    if (!clientId || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.cart.deleteMany({
      where: { clientId, productId },
    });

    if (result.count === 0) {
      console.warn(`No cart item found for clientId: ${clientId}, productId: ${productId}`);
      return NextResponse.json({ message: 'No cart item found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cart item removed' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
    }

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
      orderBy: { id: 'asc' },
    });

    const validItems = cartItems.filter((item) => {
      if (!item.product) {
        console.warn(`Cart item ${item.id} has no associated product, productId: ${item.productId}`);
        return false;
      }
      return true;
    });

    return NextResponse.json(validItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}