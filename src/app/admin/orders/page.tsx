import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { updateOrderStatus, addPaymentRef } from "./actions";
import { OrderKanbanBoard } from "@/components/admin/OrderKanbanBoard";
import { OrdersBoardErrorBoundary } from "@/components/admin/OrdersBoardErrorBoundary";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const COLUMNS: { status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"; label: string; bg: string; headerBg: string }[] = [
  { status: "PENDING", label: "Pending", bg: "bg-slate-50", headerBg: "bg-slate-100" },
  { status: "PROCESSING", label: "Processing", bg: "bg-amber-50/50", headerBg: "bg-amber-100" },
  { status: "COMPLETED", label: "Completed", bg: "bg-emerald-50/50", headerBg: "bg-emerald-100" },
  { status: "CANCELLED", label: "Cancelled", bg: "bg-red-50/50", headerBg: "bg-red-100" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const phoneQuery = typeof params?.phone === "string" ? params.phone.trim() : "";

  // Search in the backend: when phone is provided, filter by phone in DB so all matching orders (any status) are returned and appear in their columns
  const where: { status?: { in: ("PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED")[] }; phone?: { contains: string; mode: "insensitive" } } = {
    status: { in: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] },
  };
  if (phoneQuery) {
    where.phone = { contains: phoneQuery, mode: "insensitive" };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true, price: true } },
        },
      },
      orderPaymentRefs: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

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
    paymentRefs: o.orderPaymentRefs.map((r) => ({ value: r.value, amount: r.amount != null ? Number(r.amount) : null })),
    orderItems: o.orderItems.map((item) => ({
      quantity: item.quantity,
      productId: item.productId,
      product: item.product ? { id: item.product.id, name: item.product.name, price: Number(item.product.price) } : null,
    })),
  }));

  // Group by status so each order appears in its relevant card column (Pending / Processing / Completed / Cancelled)
  const byStatusSerialized = COLUMNS.reduce((acc, col) => {
    acc[col.status] = serializableOrders.filter((o) => o.status === col.status);
    return acc;
  }, {} as Record<string, typeof serializableOrders>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Drag cards between columns to change status, or use the status dropdown on each card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form method="GET" action="/admin/orders" className="flex items-center gap-2">
            <label htmlFor="orders-phone-search" className="sr-only">
              Search by phone number
            </label>
            <span className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="orders-phone-search"
                type="search"
                name="phone"
                placeholder="Search by phone"
                defaultValue={phoneQuery}
                className="rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-52 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </span>
            <button
              type="submit"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
            >
              Search
            </button>
          </form>
          {phoneQuery && (
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </Link>
          )}
          <Link
            href="/admin/orders/list"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Table view →
          </Link>
          <Link
            href="/admin/finance"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Finance summary →
          </Link>
        </div>
      </div>

      {phoneQuery && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Showing {serializableOrders.length} order{serializableOrders.length !== 1 ? "s" : ""} matching &quot;{phoneQuery}&quot;
        </p>
      )}

      <OrdersBoardErrorBoundary>
        <OrderKanbanBoard
          orders={serializableOrders}
          columns={COLUMNS}
          byStatus={byStatusSerialized}
          updateOrderStatus={updateOrderStatus}
          addPaymentRef={addPaymentRef}
        />
      </OrdersBoardErrorBoundary>
    </div>
  );
}
