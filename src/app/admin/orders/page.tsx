import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { OrderKanbanBoard } from "@/components/admin/OrderKanbanBoard";

export const dynamic = "force-dynamic";

const COLUMNS: { status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"; label: string; bg: string; headerBg: string }[] = [
  { status: "PENDING", label: "Pending", bg: "bg-slate-50", headerBg: "bg-slate-100" },
  { status: "PROCESSING", label: "Processing", bg: "bg-amber-50/50", headerBg: "bg-amber-100" },
  { status: "COMPLETED", label: "Completed", bg: "bg-emerald-50/50", headerBg: "bg-emerald-100" },
  { status: "CANCELLED", label: "Cancelled", bg: "bg-red-50/50", headerBg: "bg-red-100" },
];

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  async function updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const allowed = new Set(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]);
    if (!allowed.has(status)) return { ok: false, error: "Invalid status" };

    if (status === "COMPLETED") {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { paymentMethod: true, mpesaReceiptNo: true },
      });
      if (!order) return { ok: false, error: "Order not found" };
      const isCash = order.paymentMethod === "CASH";
      const hasPaymentRef =
        order.mpesaReceiptNo != null && String(order.mpesaReceiptNo).trim() !== "";
      if (!isCash && !hasPaymentRef) {
        return {
          ok: false,
          error:
            "Cannot complete: add a payment reference (e.g. M-Pesa receipt) or record as Cash payment first.",
        };
      }
    }

    const data: { status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"; completedAt?: Date } = {
      status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED",
    };
    if (status === "COMPLETED") data.completedAt = new Date();
    await prisma.order.update({ where: { id: orderId }, data });
    revalidatePath("/admin/orders");
    revalidatePath("/admin/finance");
    return { ok: true };
  }

  async function updateOrderCostTransport(formData: FormData) {
    "use server";
    const orderId = parseInt(formData.get("orderId") as string, 10);
    const costRaw = formData.get("costTotal") as string;
    const transportRaw = formData.get("transportFee") as string;
    if (isNaN(orderId)) return;
    const costTotal = costRaw !== "" && costRaw !== null ? parseFloat(costRaw) : null;
    const transportFee = transportRaw !== "" && transportRaw !== null ? parseFloat(transportRaw) : null;
    if (costTotal !== null && (isNaN(costTotal) || costTotal < 0)) return;
    if (transportFee !== null && (isNaN(transportFee) || transportFee < 0)) return;
    await prisma.order.update({
      where: { id: orderId },
      data: {
        costTotal: costTotal ?? undefined,
        transportFee: transportFee ?? undefined,
      },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/admin/finance");
  }

  async function recordCashPayment(formData: FormData) {
    "use server";
    const orderId = parseInt(formData.get("orderId") as string, 10);
    const amount = parseFloat(formData.get("amount") as string);
    if (isNaN(orderId) || isNaN(amount) || amount < 0) return;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    const newStatus = amount >= order.subtotal ? "COMPLETED" : "PROCESSING";
    const data: { amountPaid: number; paymentMethod: "CASH"; status: "COMPLETED" | "PROCESSING"; completedAt?: Date } = {
      amountPaid: amount,
      paymentMethod: "CASH",
      status: newStatus,
    };
    if (newStatus === "COMPLETED") data.completedAt = new Date();
    await prisma.order.update({ where: { id: orderId }, data });
    revalidatePath("/admin/orders");
    revalidatePath("/admin/finance");
  }

  async function setPaymentRef(formData: FormData) {
    "use server";
    const orderId = parseInt(formData.get("orderId") as string, 10);
    const ref = (formData.get("paymentRef") as string)?.trim() || null;
    if (isNaN(orderId)) return;
    await prisma.order.update({
      where: { id: orderId },
      data: { mpesaReceiptNo: ref, paymentMethod: ref ? "MPESA" : undefined },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/admin/finance");
  }

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = orders.filter((o) => o.status === col.status);
    return acc;
  }, {} as Record<string, (typeof orders)[0][]>);

  const serializableOrders = orders.map((o) => ({
    id: o.id,
    status: o.status,
    phone: o.phone,
    location: o.location,
    address: o.address,
    apartment: o.apartment,
    city: o.city,
    state: o.state,
    postalCode: o.postalCode,
    country: o.country,
    subtotal: Number(o.subtotal),
    costTotal: o.costTotal != null ? Number(o.costTotal) : null,
    transportFee: o.transportFee != null ? Number(o.transportFee) : null,
    amountPaid: o.amountPaid != null ? Number(o.amountPaid) : null,
    paymentMethod: o.paymentMethod,
    mpesaReceiptNo: o.mpesaReceiptNo,
    orderItems: o.orderItems.map((item) => ({
      quantity: item.quantity,
      productId: item.productId,
      product: item.product ? { id: item.product.id, name: item.product.name, price: Number(item.product.price) } : null,
    })),
  }));

  const byStatusSerialized = COLUMNS.reduce((acc, col) => {
    acc[col.status] = serializableOrders.filter((o) => o.status === col.status);
    return acc;
  }, {} as Record<string, typeof serializableOrders>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag cards between columns to change status, or use the status dropdown on each card.
          </p>
        </div>
        <Link
          href="/admin/finance"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Finance summary →
        </Link>
      </div>

      <OrderKanbanBoard
        orders={serializableOrders}
        columns={COLUMNS}
        byStatus={byStatusSerialized}
        updateOrderStatus={updateOrderStatus}
        updateOrderCostTransport={updateOrderCostTransport}
        recordCashPayment={recordCashPayment}
        setPaymentRef={setPaymentRef}
      />
    </div>
  );
}
