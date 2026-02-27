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
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/lib/themeContext";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: ChartBarIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderIcon },
  { href: "/admin/subcategories", label: "Subcategories", icon: Squares2X2Icon },
  { href: "/admin/products", label: "Products", icon: CubeIcon },
  { href: "/admin/orders", label: "Orders", icon: ClipboardDocumentListIcon },
  { href: "/admin/finance", label: "Finance", icon: CurrencyDollarIcon },
  { href: "/admin/payments", label: "Payments", icon: BanknotesIcon },
  { href: "/admin/downloads", label: "Downloads", icon: ArrowDownTrayIcon },
  { href: "/admin/blog", label: "Blog", icon: DocumentTextIcon },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Mobile sidebar backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        style={{ display: sidebarOpen ? "block" : "none" }}
      />

      {/* Sidebar - theme-aware */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-[var(--card-bg)] border-r border-[var(--card-border)] text-[var(--foreground)] transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--card-border)] px-4 md:justify-center">
          <span className="text-lg font-semibold tracking-tight">Ziva Admin</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-2 text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] md:hidden"
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
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-[var(--card-border)] p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
          >
            <HomeIcon className="h-5 w-5" />
            View site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="md:pl-64">
        {/* Top bar - theme-aware + theme toggle */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--header-border)] bg-[var(--header-bg)] px-4 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded p-2 text-[var(--foreground)] hover:bg-[var(--muted-bg)] md:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" aria-hidden />
            ) : (
              <MoonIcon className="h-5 w-5" aria-hidden />
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
