import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { OrdersListTable } from "@/components/admin/OrdersListTable";
import { updateOrderStatus } from "../actions";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] as const;

export default async function AdminOrdersListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(typeof params?.page === "string" ? params.page : "1", 10) || 1);
  const phone = typeof params?.phone === "string" ? params.phone.trim() : "";
  const statusFilter = typeof params?.status === "string" && STATUSES.includes(params.status as (typeof STATUSES)[number])
    ? (params.status as (typeof STATUSES)[number])
    : undefined;
  const dateFrom = typeof params?.dateFrom === "string" ? params.dateFrom.trim() : "";
  const dateTo = typeof params?.dateTo === "string" ? params.dateTo.trim() : "";

  const where: {
    status?: { in: (typeof STATUSES)[number][] };
    phone?: { contains: string; mode: "insensitive" };
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (statusFilter) {
    where.status = { in: [statusFilter] };
  } else {
    where.status = { in: [...STATUSES] };
  }
  if (phone) {
    where.phone = { contains: phone, mode: "insensitive" };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      where.createdAt.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      where.createdAt.lte = d;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        orderPaymentRefs: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rows = orders.map((o) => {
    const refsTotal = o.orderPaymentRefs.reduce((s, r) => s + (r.amount ?? 0), 0);
    const totalDue = Number(o.subtotal) + (o.transportFee ?? 0);
    const hasRefs = o.orderPaymentRefs.length > 0 && o.orderPaymentRefs.every((r) => r.amount != null && r.amount > 0);
    const canComplete = hasRefs && refsTotal >= totalDue;
    return {
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      phone: o.phone,
      location: o.location,
      address: o.address ?? undefined,
      city: o.city ?? undefined,
      status: o.status,
      subtotal: Number(o.subtotal),
      transportFee: o.transportFee != null ? Number(o.transportFee) : null,
      canComplete,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders (table)</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search, filter by status and date range, and change status. Up to {PAGE_SIZE} per page, latest first.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <Squares2X2Icon className="h-4 w-4" />
          Board view
        </Link>
      </div>

      <OrdersListTable
        rows={rows}
        totalCount={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        filters={{ phone, status: statusFilter ?? "", dateFrom, dateTo }}
        updateOrderStatus={updateOrderStatus}
      />
    </div>
  );
}
