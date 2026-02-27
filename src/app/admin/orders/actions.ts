"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const allowed = new Set(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]);
  if (!allowed.has(status)) return { ok: false, error: "Invalid status" };

  if (status === "COMPLETED") {
    const [order, refs] = await Promise.all([
      prisma.order.findUnique({ where: { id: orderId }, select: { subtotal: true, transportFee: true } }),
      prisma.orderPaymentRef.findMany({ where: { orderId }, select: { amount: true } }),
    ]);
    if (!order || refs.length === 0) {
      return {
        ok: false,
        error:
          "Cannot complete without a payment reference. Add at least one M-Pesa ref or receipt with amount > 0.",
      };
    }
    const allHaveAmount = refs.every((r) => r.amount != null && r.amount > 0);
    if (!allHaveAmount) {
      return {
        ok: false,
        error: "Every M-Pesa ref and receipt must have an amount greater than 0.",
      };
    }
    const totalDue = Number(order.subtotal) + (order.transportFee ?? 0);
    const refsTotal = refs.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    if (refsTotal < totalDue) {
      return {
        ok: false,
        error: `Total of ref amounts (${refsTotal.toFixed(0)} KSH) is less than order total (${totalDue.toFixed(0)} KSH). Add refs so their total is at least the sale + delivery amount.`,
      };
    }
  }

  const data: { status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"; completedAt?: Date } = {
    status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED",
  };
  if (status === "COMPLETED") data.completedAt = new Date();
  await prisma.order.update({ where: { id: orderId }, data });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/list");
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function addPaymentRef(formData: FormData): Promise<void> {
  const orderId = parseInt(formData.get("orderId") as string, 10);
  const value = (formData.get("paymentRef") as string)?.trim() || null;
  const amountRaw = formData.get("refAmount") as string;
  const amount = amountRaw !== "" && amountRaw != null ? parseFloat(amountRaw) : null;
  if (isNaN(orderId) || !value) return;
  if (amount == null || isNaN(amount) || amount <= 0) return;
  await prisma.orderPaymentRef.create({ data: { orderId, value, amount } });
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { subtotal: true, transportFee: true } });
  if (!order) return;
  const refs = await prisma.orderPaymentRef.findMany({ where: { orderId }, select: { amount: true } });
  const refsTotal = refs.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalDue = Number(order.subtotal) + (order.transportFee ?? 0);
  const allHaveAmount = refs.every((r) => r.amount != null && r.amount > 0);
  const canComplete = refs.length > 0 && allHaveAmount && refsTotal >= totalDue;
  await prisma.order.update({
    where: { id: orderId },
    data: {
      amountPaid: refsTotal,
      ...(canComplete ? { status: "COMPLETED" as const, completedAt: new Date() } : {}),
    },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/list");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/payments");
}
