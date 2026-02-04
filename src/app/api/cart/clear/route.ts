/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { clearCart } from "@/lib/api";

export async function DELETE(request: Request) {
  try {
    const { clientId } = await request.json();
    if (!clientId) {
      console.error("DELETE /api/cart/clear: clientId is required");
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    await clearCart(clientId);
    console.log(`Cleared cart for clientId: ${clientId}`);
    return NextResponse.json({ message: "Cart cleared" });
  } catch (error: any) {
    console.error(`DELETE /api/cart/clear failed for clientId:`, error.message);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}