"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useCartSidebar } from "@/lib/cartSidebarContext";
import ShoppingCart from "@/components/ShoppingCart";

// Server action to fetch categories
async function getCategories() {
  const res = await fetch("/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

// Utility to slugify names (matches Breadcrumb logic)
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove non-word chars except spaces/dashes
    .trim()
    .replace(/\s+/g, "-");
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
  const { items } = useCart();
  const { cartOpen, setCartOpen } = useCartSidebar();

  useEffect(() => {
    getCategories().then((data) =>
      setNavigation((prev) => ({ ...prev, categories: data }))
    );
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCategoryStates((prev) => {
      // If the clicked category is already open, close it
      if (prev[categoryId]) {
        return { [categoryId]: false };
      }
      // Otherwise, close all and open the clicked one
      return { [categoryId]: true };
    });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="bg-white">
      {/* Sidebar for all screens */}
      <Dialog open={isSidebarOpen} onClose={closeSidebar} className="fixed z-40 inset-0">
        <DialogBackdrop className="fixed inset-0 bg-black/25 transition-opacity duration-300" />
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">
              Categories
            </h2>
            <hr className="mb-4 border-gray-200" />
            <ul>
              {navigation.categories.map((category: { id: string; name: string; sections: { items: { name: string; href: string }[] }[] }) => {
                const categorySlug = slugify(category.name);
                const subcategories = category.sections[0]?.items || [];
                return (
                  <li key={category.id} className="mb-2">
                    {/* Category element */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/shop/${categorySlug}`}
                        className={`font-medium flex-1 text-left font-[family-name:var(--font-quicksand)] transition-colors
    ${
      pathname === `/shop/${categorySlug}`
        ? "text-emerald-700 font-bold"
        : "text-gray-700 hover:text-emerald-700 hover:font-bold"
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
                    {/* Subcategories nested under category */}
                    {categoryStates[category.id] && subcategories.length > 0 && (
                      <ul className="mt-2 space-y-2 pl-4">
                        {subcategories.map((sub) => {
                          const subcategorySlug = slugify(sub.name);
                          return (
                            <li key={sub.name}>
                              <Link
                                href={`/shop/${categorySlug}/${subcategorySlug}`}
                                className="block text-sm text-gray-500 hover:text-gray-700 font-[family-name:var(--font-quicksand)]"
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
          </DialogPanel>
        </div>
      </Dialog>

      {/* Header */}
      <header className="relative bg-white">
        

        <nav aria-label="Top" className="mx-auto max-w-full px-1 sm:px-2 lg:px-1">
          <div className="border-b border-gray-200">
            <div className="flex h-20 items-center">
              {/* Menu icon always visible */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="relative rounded-md bg-white p-2 text-gray-400"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </button>

              {/* Logo */}
              <div className="flex lg:ml-0">
                <Link href="/">
                  <span className="sr-only">Ziva Landscaping CO.</span>
                  <Image
                    src="/Ziva-Logo-02.svg"
                    alt="Ziva Landscaping CO."
                    width={150}
                    height={40}
                    className="h-24 w-auto"
                  />
                </Link>
              </div>
              <div className=" lg:hidden sm:flex lg:ml-0">
                <Link href="/">
                  <span className="sr-only">Ziva Landscaping CO.</span>
                  <Image
                    src="/Ziva-Logo-01.svg"
                    alt="Ziva Landscaping CO."
                    width={500}
                    height={500}
                    className="h-24 w-auto"
                  />
                </Link>
              </div>
              {/* Navigation pages */}
              <div className="hidden lg:flex lg:ml-8 lg:self-stretch h-full items-center space-x-8">
                {navigation.pages.map((page) => (
                  <Link
                    key={page.name}
                    href={page.href}
                    className={`flex items-center text-base font-medium transition-colors duration-200 ease-out font-[family-name:var(--font-quicksand)] ${
                      pathname === page.href
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-700 hover:text-gray-800"
                    }`}
                    aria-current={pathname === page.href ? "page" : undefined}
                  >
                    {page.name}
                  </Link>
                ))}
              </div>

              <div className="ml-auto flex items-center">
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                  <a href="#" className="text-base font-medium text-gray-700 hover:text-gray-800 font-[family-name:var(--font-quicksand)]">
                    Sign in
                  </a>
                  <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
                  <a href="#" className="text-base font-medium text-gray-700 hover:text-gray-800 font-[family-name:var(--font-quicksand)]">
                    Create account
                  </a>
                </div>

                {/* Search */}
                <div className="ml-4 flex lg:ml-6">
                  <a href="#" className="p-2 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Search</span>
                    <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
                  </a>
                </div>

                {/* Cart */}
                <div className="ml-4 flow-root lg:ml-6">
                  <button
                    onClick={() => setCartOpen(true)}
                    className="group -m-2 flex items-center p-2"
                    aria-label="Open shopping cart"
                  >
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800 font-[family-name:var(--font-quicksand)]">
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
          <p className="flex h-10 items-center justify-center bg-[#044b3b] px-4 text-sm font-medium text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            FURNITURE ITEMS HAVE A LEAD TIME OF 3-4 WEEKS FROM ORDER PLACEMENT DATE.
          </p>
        )}
        {pathname === "/shop/landscaping/red-soil-and-manure" && (
          <p className="flex h-10 items-center justify-center bg-[#044b3b] px-4 text-sm font-medium text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Available in Sacks, Pick ups, Lorries and Tippers. Depends on location. Call/WhatsApp for prices.
          </p>
        )}
        {pathname === "/shop/landscaping/lawn-care-and-lawn-services" && (
          <p className="flex h-10 items-center justify-center bg-[#044b3b] px-4 text-sm font-medium text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Call/WhatsApp for prices.
          </p>
        )}
      </header>
      <ShoppingCart open={cartOpen} setOpen={setCartOpen} />
    </div>
  );
}