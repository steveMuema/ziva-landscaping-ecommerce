import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import {
  FolderIcon,
  Squares2X2Icon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  EyeIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { OrdersCountChart } from "@/components/admin/OrdersCountChart";
import { RevenueBarChart } from "@/components/admin/RevenueBarChart";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  Number(n).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    categoryCount,
    subCategoryCount,
    productCount,
    postCount,
    orders,
    recentCategories,
    recentProducts,
    dailyOrders,
    dailyRevenue,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.product.count(),
    prisma.blogPost.count(),
    prisma.order.findMany({
      select: {
        status: true,
        subtotal: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { subCategories: true } } },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { subCategory: { select: { name: true, category: { select: { name: true } } } } },
    }),
    (async () => {
      const daily: { date: string; count: number }[] = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const count = await prisma.order.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: "COMPLETED",
          },
        });
        daily.push({ date: dateStr, count });
      }
      return daily;
    })(),
    (async () => {
      const daily: { date: string; revenue: number; count: number }[] = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: "COMPLETED",
          },
          select: { subtotal: true },
        });
        const revenue = dayOrders.reduce((s, o) => s + Number(o.subtotal), 0);
        daily.push({ date: dateStr, revenue, count: dayOrders.length });
      }
      return daily;
    })(),
  ]);

  let pageViewsToday = 0;
  let pageViewsLast7 = 0;
  let topPages: { path: string; _count: { path: number } }[] = [];
  try {
    [pageViewsToday, pageViewsLast7, topPages] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.pageView.groupBy({
        by: ["path"],
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
    ]);
  } catch {
    // PageView model/table may be missing; keep defaults (0, 0, [])
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const ordersLast7 = orders.filter(
    (o) => o.createdAt >= sevenDaysAgo && o.status === "COMPLETED"
  ).length;
  const revenueLast7 = orders
    .filter((o) => o.createdAt >= sevenDaysAgo && o.status === "COMPLETED")
    .reduce((s, o) => s + Number(o.subtotal), 0);

  const statCards = [
    { label: "Pending orders", count: pendingOrders, href: "/admin/orders", icon: ShoppingCartIcon, color: "amber" },
    { label: "Orders (7 days)", count: ordersLast7, href: "/admin/orders", icon: ChartBarIcon, color: "emerald" },
    { label: "Revenue (7 days)", value: `KSH ${fmt(revenueLast7)}`, href: "/admin/finance", icon: CurrencyDollarIcon, color: "blue" },
    { label: "Page views today", count: pageViewsToday, href: "#", icon: EyeIcon, color: "violet" },
    { label: "Page views (7 days)", count: pageViewsLast7, href: "#", icon: EyeIcon, color: "slate" },
    { label: "Categories", count: categoryCount, href: "/admin/categories", icon: FolderIcon, color: "blue" },
    { label: "Subcategories", count: subCategoryCount, href: "/admin/subcategories", icon: Squares2X2Icon, color: "emerald" },
    { label: "Products", count: productCount, href: "/admin/products", icon: CubeIcon, color: "violet" },
    { label: "Blog posts", count: postCount, href: "/admin/blog", icon: DocumentTextIcon, color: "slate" },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40",
    violet: "bg-violet-500/10 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40",
    slate: "bg-slate-500/10 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40",
    amber: "bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of catalog, orders, revenue, and site activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map(({ label, count, value, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-[var(--card-bg)]"
          >
            <div className={`inline-flex rounded-lg border p-2 ${colorClasses[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {value ?? (count !== undefined ? fmt(count) : "—")}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            {href !== "#" && (
              <span className="absolute right-3 top-3 text-slate-300 dark:text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </Link>
        ))}
        <Link
          href="/admin/finance"
          className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-[var(--card-bg)]"
        >
          <div className="inline-flex rounded-lg border border-amber-200 bg-amber-500/10 p-2 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300">
            <CurrencyDollarIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Finance</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Orders & payments</p>
          </div>
          <span className="absolute right-3 top-3 text-slate-300 dark:text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
            Orders last 7 days
          </h2>
          <OrdersCountChart data={dailyOrders} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
            Revenue last 7 days
          </h2>
          <RevenueBarChart data={dailyRevenue} />
        </div>
      </div>

      {/* Site activity + Recent content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-600 px-5 py-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Top pages</h2>
          </div>
          <div className="p-5">
            {topPages.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No page views yet. Visit the site to see stats.</p>
            ) : (
              <ul className="space-y-2">
                {topPages.map((p) => (
                  <li
                    key={p.path}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-600 py-2 px-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate font-mono" title={p.path}>
                      {p.path === "/" ? "Home" : p.path}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">{fmt(p._count.path)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-600 px-5 py-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent categories</h2>
            <Link
              href="/admin/categories"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Manage →
            </Link>
          </div>
          <div className="p-5">
            {recentCategories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No categories yet. Create one from Categories.</p>
            ) : (
              <ul className="space-y-3">
                {recentCategories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-600 py-2 px-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-slate-400 dark:text-slate-500">{c._count.subCategories} subcategories</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-600 px-5 py-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent products</h2>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Manage →
            </Link>
          </div>
          <div className="p-5">
            {recentProducts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No products yet. Create one from Products.</p>
            ) : (
              <ul className="space-y-3">
                {recentProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-600 py-2 px-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="truncate pl-2 text-slate-400 dark:text-slate-500 text-xs">
                      {p.subCategory.category.name} / {p.subCategory.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
