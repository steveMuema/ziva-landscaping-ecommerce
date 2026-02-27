import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ProductPieChart } from "@/components/admin/ProductPieChart";
import { SalesProfitLineChart } from "@/components/admin/SalesProfitLineChart";
import { RevenueBarChart } from "@/components/admin/RevenueBarChart";
import { RevenueRangeSelect } from "@/components/admin/RevenueRangeSelect";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  Number(n).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const VALID_DAYS = [7, 14, 30] as const;
const DEFAULT_DAYS = 14;

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  const allOrders = await prisma.order.findMany({
    select: {
      status: true,
      subtotal: true,
      costTotal: true,
      transportFee: true,
      amountPaid: true,
      createdAt: true,
      completedAt: true,
      orderItems: {
        select: { quantity: true, productId: true, product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Revenue and profit: only COMPLETED orders (not shown until complete)
  const orders = allOrders.filter((o) => o.status === "COMPLETED");

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalCost = orders.reduce((sum, o) => sum + (o.costTotal ?? 0), 0);
  const totalTransport = orders.reduce((sum, o) => sum + (o.transportFee ?? 0), 0);
  const totalProfit = totalRevenue - totalCost - totalTransport;
  const totalPaid = orders.reduce((sum, o) => sum + (o.amountPaid ?? 0), 0);

  // Average TAT (order to delivery): completedAt - createdAt for completed orders
  const completedWithTat = orders.filter((o) => o.completedAt != null);
  const tatHours =
    completedWithTat.length > 0
      ? completedWithTat.reduce((sum, o) => sum + (o.completedAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60), 0) / completedWithTat.length
      : 0;
  const tatDays = tatHours / 24;
  const tatLabel = tatHours < 24 ? `${tatHours.toFixed(1)}h` : `${tatDays.toFixed(1)} days`;

  // Top products by quantity ordered (for pie) — sales only
  const productMap = new Map<number, { name: string; quantity: number }>();
  for (const order of orders) {
    for (const item of order.orderItems) {
      const name = item.product?.name ?? `Product #${item.productId}`;
      const existing = productMap.get(item.productId);
      if (existing) existing.quantity += item.quantity;
      else productMap.set(item.productId, { name, quantity: item.quantity });
    }
  }
  const productTotals = [...productMap.entries()]
    .map(([id, { name, quantity }]) => ({ productId: id, productName: name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  const totalQty = productTotals.reduce((s, p) => s + p.quantity, 0);
  const pieSlices = totalQty > 0 ? productTotals.map((p) => ({ productName: p.productName, quantity: p.quantity, percent: (p.quantity / totalQty) * 100 })) : [];

  // Days for revenue/profit charts: from ?days=7|14|30
  const resolvedSearchParams = await searchParams;
  const daysParam = resolvedSearchParams?.days;
  const daysNum = typeof daysParam === "string" ? parseInt(daysParam, 10) : DEFAULT_DAYS;
  const chartDays: (typeof VALID_DAYS)[number] = (VALID_DAYS as readonly number[]).includes(daysNum)
    ? (daysNum as (typeof VALID_DAYS)[number])
    : DEFAULT_DAYS;

  // Daily data: revenue + profit by completion date (last N days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyData: { date: string; revenue: number; profit: number; count: number }[] = [];
  for (let d = chartDays - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOrders = orders.filter(
      (o) => o.completedAt != null && o.completedAt >= dayStart && o.completedAt <= dayEnd
    );
    const revenue = dayOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
    const profit = dayOrders.reduce(
      (sum, o) => sum + Number(o.subtotal) - (o.costTotal ?? 0) - (o.transportFee ?? 0),
      0
    );
    dailyData.push({ date: dateStr, revenue, profit, count: dayOrders.length });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Finance</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revenue and profit from completed orders only. Set delivery cost and payment refs on Orders to complete.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Manage orders →
        </Link>
      </div>

      {/* Summary cards + TAT */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">KSH {fmt(totalRevenue)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Sale total</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cost</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">KSH {fmt(totalCost)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Goods cost</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transport</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">KSH {fmt(totalTransport)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Delivery</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Profit</p>
          <p className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-700 dark:text-red-400"}`}>
            KSH {fmt(totalProfit)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Revenue − cost − transport</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Received</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">KSH {fmt(totalPaid)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Payments received</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sales</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{orders.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Processing + completed (pending excluded)</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">Avg TAT</p>
          <p className="mt-1 text-lg font-bold text-violet-800 dark:text-violet-200">
            {completedWithTat.length === 0 ? "—" : tatLabel}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Order → delivery ({completedWithTat.length} completed)</p>
        </div>
      </div>

      {/* Sales & profit line chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sales & profit over time</h2>
          <RevenueRangeSelect currentDays={chartDays} />
        </div>
        <SalesProfitLineChart data={dailyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue by day</h2>
            <RevenueRangeSelect currentDays={chartDays} />
          </div>
          <RevenueBarChart data={dailyData} />
        </div>

        {/* Pie: most ordered products */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">Most ordered products (top 10)</h2>
          <ProductPieChart slices={pieSlices} />
        </div>
      </div>
    </div>
  );
}
