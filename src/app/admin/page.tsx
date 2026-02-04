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
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  const [categoryCount, subCategoryCount, productCount, postCount, recentCategories, recentProducts] =
    await Promise.all([
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.product.count(),
      prisma.blogPost.count(),
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
    ]);

  const statCards = [
    { label: "Categories", count: categoryCount, href: "/admin/categories", icon: FolderIcon, color: "blue" },
    { label: "Subcategories", count: subCategoryCount, href: "/admin/subcategories", icon: Squares2X2Icon, color: "emerald" },
    { label: "Products", count: productCount, href: "/admin/products", icon: CubeIcon, color: "violet" },
    { label: "Blog posts", count: postCount, href: "/admin/blog", icon: DocumentTextIcon, color: "slate" },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-200",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    violet: "bg-violet-500/10 text-violet-700 border-violet-200",
    slate: "bg-slate-500/10 text-slate-700 border-slate-200",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your catalog and content. Changes appear on the main shop and home.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, count, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex rounded-lg border p-2.5 ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{count}</p>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <span className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </span>
          </Link>
        ))}
        <Link
          href="/admin/finance"
          className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="inline-flex rounded-lg border border-amber-200 bg-amber-500/10 p-2.5 text-amber-700">
            <CurrencyDollarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Finance</p>
            <p className="text-sm text-slate-600">Orders & payments</p>
          </div>
          <span className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent categories</h2>
            <Link
              href="/admin/categories"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Manage →
            </Link>
          </div>
          <div className="p-5">
            {recentCategories.length === 0 ? (
              <p className="text-sm text-slate-500">No categories yet. Create one from Categories.</p>
            ) : (
              <ul className="space-y-3">
                {recentCategories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 py-2 px-3 text-sm text-slate-700"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-slate-400">{c._count.subCategories} subcategories</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent products</h2>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Manage →
            </Link>
          </div>
          <div className="p-5">
            {recentProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No products yet. Create one from Products.</p>
            ) : (
              <ul className="space-y-3">
                {recentProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 py-2 px-3 text-sm text-slate-700"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="truncate pl-2 text-slate-400">
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
