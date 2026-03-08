"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/lib/themeContext";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type Category = {
  id: string;
  name: string;
  sections: { items: { name: string; href: string }[] }[];
};

interface MobileSidebarProps {
  isSidebarOpen: boolean;
  closeSidebar: () => void;
  navigation: { categories: Category[]; pages: { name: string; href: string }[] };
  categoryStates: Record<string, boolean>;
  toggleCategory: (id: string) => void;
  pathname: string | null;
  isSignedIn: boolean;
  isAdmin: boolean;
}

export default function MobileSidebar({
  isSidebarOpen,
  closeSidebar,
  navigation,
  categoryStates,
  toggleCategory,
  pathname,
  isSignedIn,
  isAdmin,
}: MobileSidebarProps) {
  const { theme } = useTheme();
  return (
    <Dialog open={isSidebarOpen} onClose={closeSidebar} className="fixed z-40 inset-0">
      <DialogBackdrop className="fixed inset-0 bg-black/25 transition-opacity duration-300" />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--header-bg)] shadow-lg transform transition-transform duration-300 border-r border-[var(--header-border)]">
        <DialogPanel className="h-full overflow-y-auto p-4">
          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={closeSidebar}
              className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 font-[family-name:var(--font-quicksand)]">
            Categories
          </h2>
          <hr className="mb-4 border-[var(--header-border)]" />
          <ul>
            {navigation.categories.map((category: Category) => {
              const categorySlug = slugify(category.name);
              const subcategories = category.sections[0]?.items || [];
              return (
                <li key={category.id} className="mb-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/shop/${categorySlug}`}
                      className={`font-medium flex-1 text-left font-[family-name:var(--font-quicksand)] transition-colors
                    ${pathname === `/shop/${categorySlug}`
                          ? "text-[var(--accent)] font-bold"
                          : "text-[var(--foreground)] hover:text-[var(--accent)]"
                        }
                  `}
                      onClick={closeSidebar}
                    >
                      {category.name}
                    </Link>
                    {subcategories.length > 0 && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        aria-label={`Toggle ${category.name} subcategories`}
                        tabIndex={0}
                      >
                        {categoryStates[category.id] ? (
                          <ChevronUpIcon className="size-5" />
                        ) : (
                          <ChevronDownIcon className="size-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {categoryStates[category.id] && subcategories.length > 0 && (
                    <ul className="mt-2 space-y-2 pl-4">
                      {subcategories.map((sub: { name: string; href: string }) => {
                        const subcategorySlug = slugify(sub.name);
                        return (
                          <li key={sub.name}>
                            <Link
                              href={`/shop/${categorySlug}/${subcategorySlug}`}
                              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]"
                              onClick={closeSidebar}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <hr className="mb-4 border-gray-200" />
          <Link
            href={`/blog`}
            className={`block font-medium text-[var(--foreground)] hover:text-[var(--accent)] font-[family-name:var(--font-quicksand)] transition-colors
          ${pathname === `/blog`
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--foreground)] hover:text-[var(--accent)]"
              }
        `}
            onClick={closeSidebar}
          >
            Blog
          </Link>
          <hr className="my-4 border-[var(--header-border)]" />
          {isSignedIn ? (
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block font-medium text-[var(--foreground)] hover:text-[var(--accent)] font-[family-name:var(--font-quicksand)]"
                  onClick={closeSidebar}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => { closeSidebar(); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-2 font-medium text-[var(--header-fg)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]"
              >
                <ArrowRightOnRectangleIcon className="size-5" aria-hidden />
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="block font-medium text-[var(--header-fg)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]"
              onClick={closeSidebar}
            >
              Sign in
            </Link>
          )}
          <hr className="my-4 border-[var(--header-border)]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)] font-[family-name:var(--font-quicksand)]">Theme</span>
              {theme === "system" && (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white animate-pulse">
                  Try a theme!
                </span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
