"use client";

import { useState, useEffect } from "react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart";
import { useCartSidebar } from "@/lib/cartSidebarContext";
import { useTheme } from "@/lib/themeContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import dynamic from "next/dynamic";

const MobileSidebar = dynamic(() => import("./MobileSidebar"), { ssr: false });
const ShoppingCart = dynamic(() => import("@/components/ShoppingCart"), { ssr: false });

// Server action to fetch categories
async function getCategories() {
  const res = await fetch("/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

export default function NavigationBar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categoryStates, setCategoryStates] = useState<{ [key: string]: boolean }>({});
  const [navigation, setNavigation] = useState({
    categories: [],
    pages: [
      { name: "Shop", href: "/shop" },
      { name: "Company", href: "/company" },
      { name: "Blog", href: "/blog" },
    ],
  });
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { items } = useCart();
  const { cartOpen, setCartOpen } = useCartSidebar();
  const { } = useTheme();
  const isSignedIn = status === "authenticated" && !!session?.user;
  const isAdmin = isSignedIn && session?.user?.role === "admin";

  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then((data) =>
      setNavigation((prev) => ({ ...prev, categories: data }))
    );
  }, []);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        const url = data?.SITE_LOGO_URL?.trim();
        if (url) setSiteLogoUrl(url);
      })
      .catch(() => { });
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCategoryStates((prev) => {
      if (prev[categoryId]) {
        return { [categoryId]: false };
      }
      return { [categoryId]: true };
    });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="bg-[var(--header-bg)] text-[var(--header-fg)]">
      {/* Sidebar for all screens */}
      <MobileSidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
        navigation={navigation}
        categoryStates={categoryStates}
        toggleCategory={toggleCategory}
        pathname={pathname}
        isSignedIn={isSignedIn}
        isAdmin={isAdmin}
      />

      {/* Header — user nav only; socials are in footer */}
      <header className="bg-[var(--header-bg)] border-b border-[var(--header-border)]">
        <nav aria-label="Main" className="mx-auto max-w-full px-1 sm:px-2 lg:px-1">
          <div className="border-b border-[var(--header-border)]">
            <div className="flex h-14 sm:h-16 md:h-20 items-center gap-1 min-w-0">
              {/* Burger menu: visible on all screens */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="relative shrink-0 rounded-md bg-transparent p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </button>

              {/* Logo — shrinks on small screens */}
              <div className="flex min-w-0 flex-1 md:flex-none md:ml-0">
                <Link href="/" className="flex items-center min-w-0">
                  <span className="sr-only">Ziva Landscaping CO.</span>
                  {siteLogoUrl ? (
                    <Image
                      src={siteLogoUrl}
                      alt="Ziva Landscaping CO."
                      width={150}
                      height={40}
                      className="h-10 w-auto max-w-[140px] object-contain sm:max-w-[160px] md:h-16 md:max-w-none"
                      priority
                      unoptimized={!siteLogoUrl.startsWith("/")}
                    />
                  ) : (
                    <Image
                      src="/Ziva-Logo-02.svg"
                      alt="Ziva Landscaping CO."
                      width={150}
                      height={40}
                      className="h-10 w-auto max-w-[140px] object-contain sm:max-w-[160px] md:h-16 md:max-w-none"
                      priority
                    />
                  )}
                </Link>
              </div>
              {/* Navigation pages — visible from md (tablet/desktop); no burger */}
              <div className="hidden md:flex md:ml-8 md:self-stretch h-full items-center space-x-8">
                {navigation.pages.map((page) => (
                  <Link
                    key={page.name}
                    href={page.href}
                    className={`flex items-center text-base font-medium transition-colors duration-200 ease-out font-[family-name:var(--font-quicksand)] ${pathname === page.href
                      ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                      : "text-[var(--header-fg)] hover:text-[var(--foreground)]"
                      }`}
                    aria-current={pathname === page.href ? "page" : undefined}
                  >
                    {page.name}
                  </Link>
                ))}
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1">
                <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:space-x-6">
                  {isSignedIn ? (
                    <>
                      {isAdmin && (
                        <Link href="/admin" className="text-base font-medium text-[var(--header-fg)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                          Admin
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 text-base font-medium text-[var(--header-fg)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]"
                      >
                        <ArrowRightOnRectangleIcon className="size-5" aria-hidden />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link href="/auth/signin" className="text-base font-medium text-[var(--header-fg)] hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                      Sign in
                    </Link>
                  )}
                  <span aria-hidden="true" className="h-6 w-px bg-[var(--header-border)]" />
                  <div className="flex items-center">
                    <ThemeToggle />
                  </div>
                </div>

                {/* Search */}
                <div className="flex">
                  <Link href="/shop" className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Search">
                    <MagnifyingGlassIcon aria-hidden="true" className="size-5 sm:size-6" />
                  </Link>
                </div>

                {/* Cart */}
                <div className="flow-root">
                  <button
                    onClick={() => setCartOpen(true)}
                    className="group -m-2 flex items-center p-2"
                    aria-label="Open shopping cart"
                  >
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-[var(--muted)] group-hover:text-[var(--foreground)] sm:size-6"
                    />
                    <span className="ml-1 text-sm font-medium text-[var(--header-fg)] group-hover:text-[var(--foreground)] font-[family-name:var(--font-quicksand)] sm:ml-2">
                      {items.length}
                    </span>
                    <span className="sr-only">items in cart, view cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        {pathname === "/shop/furniture-and-fittings" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Furniture items have a lead time of 3-4 weeks from order placement date.
          </p>
        )}
        {pathname === "/shop/landscaping/lawn-designs" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Call/WhatsApp for consultation.
          </p>
        )}
        {pathname === "/shop/landscaping/red-soil-and-manure" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Available in Sacks, Pick ups, Lorries and Tippers. Depends on location. Call/WhatsApp for prices.
          </p>
        )}
        {pathname === "/shop/landscaping/lawn-care-and-lawn-services" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Call/WhatsApp for prices.
          </p>
        )}
        {pathname === "/shop/home-decor-and-furnishing/wall-art" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Call/message for prices. Art available in Pencil/Paint framed on Canvas or to customers preference.
          </p>
        )}
        {pathname === "/shop/home-decor-and-furnishing/carpets" && (
          <p className="flex min-h-10 flex-wrap items-center justify-center bg-yellow-500 px-4 py-2 text-center text-sm font-bold text-white font-[family-name:var(--font-quicksand)]">
            Carpets available in size 5ft by 8ft, 6ft by 9ft, 7ft by 10ft, 8ft by 11ft
          </p>
        )}
      </header>
      <ShoppingCart open={cartOpen} setOpen={setCartOpen} />
    </div>
  );
}
