"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ChartBarIcon,
  FolderIcon,
  Squares2X2Icon,
  CubeIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: ChartBarIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderIcon },
  { href: "/admin/subcategories", label: "Subcategories", icon: Squares2X2Icon },
  { href: "/admin/products", label: "Products", icon: CubeIcon },
  { href: "/admin/orders", label: "Orders", icon: ClipboardDocumentListIcon },
  { href: "/admin/finance", label: "Finance", icon: CurrencyDollarIcon },
  { href: "/admin/payments", label: "Payments", icon: BanknotesIcon },
  { href: "/admin/blog", label: "Blog", icon: DocumentTextIcon },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        style={{ display: sidebarOpen ? "block" : "none" }}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-slate-900 text-white transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4 md:justify-center">
          <span className="text-lg font-semibold tracking-tight">Ziva Admin</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-auto p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-slate-700 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <HomeIcon className="h-5 w-5" />
            View site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
