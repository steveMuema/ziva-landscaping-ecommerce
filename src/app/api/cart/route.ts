import { NextResponse } from "next/server";
import { getCart, addToCart, removeFromCart, clearCart } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  try {
    const cartItems = await getCart(clientId);
    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, productId, quantity } = await request.json();
    if (!clientId || !productId || !quantity) {
      return NextResponse.json({ error: "clientId, productId, and quantity are required" }, { status: 400 });
    }
    const cartItem = await addToCart(clientId, productId, quantity);
    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { clientId, productId } = await request.json();
    if (!clientId || !productId) {
      return NextResponse.json({ error: "clientId and productId are required" }, { status: 400 });
    }
    await removeFromCart(clientId, productId);
    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}

