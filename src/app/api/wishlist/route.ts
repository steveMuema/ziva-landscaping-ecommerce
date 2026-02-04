import { NextResponse } from "next/server";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  try {
    const wishlistItems = await getWishlist(clientId);
    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, productId } = await request.json();
    if (!clientId || !productId) {
      return NextResponse.json({ error: "clientId and productId are required" }, { status: 400 });
    }
    const wishlistItem = await addToWishlist(clientId, productId);
    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { clientId, productId } = await request.json();
    if (!clientId || !productId) {
      return NextResponse.json({ error: "clientId and productId are required" }, { status: 400 });
    }
    await removeFromWishlist(clientId, productId);
    return NextResponse.json({ message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}