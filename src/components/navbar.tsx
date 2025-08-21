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
import path from "path/win32";

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
        <div className="flex h-10 items-center space-x-6 mb-2 justify-center bg-[#044b3b] px-4 text-sm font-medium text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
          <a
            href="https://facebook.com/zivalandscapingco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">Facebook</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.014467 17.065322 19.313017 13.21875 19.898438 L 13.21875 14.384766 L 15.546875 14.384766 L 15.912109 12.019531 L 13.21875 12.019531 L 13.21875 10.726562 C 13.21875 9.7435625 13.538984 8.8710938 14.458984 8.8710938 L 15.935547 8.8710938 L 15.935547 6.8066406 C 15.675547 6.7716406 15.126844 6.6953125 14.089844 6.6953125 C 11.923844 6.6953125 10.654297 7.8393125 10.654297 10.445312 L 10.654297 12.019531 L 8.4277344 12.019531 L 8.4277344 14.384766 L 10.654297 14.384766 L 10.654297 19.878906 C 6.8702905 19.240845 4 15.970237 4 12 C 4 7.5698774 7.5698774 4 12 4 z"></path>
            </svg>
          </a>
          <a
            href="https://instagram.com/zivalandscapingco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">Instagram</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M 8 3 C 5.243 3 3 5.243 3 8 L 3 16 C 3 18.757 5.243 21 8 21 L 16 21 C 18.757 21 21 18.757 21 16 L 21 8 C 21 5.243 18.757 3 16 3 L 8 3 z M 8 5 L 16 5 C 17.654 5 19 6.346 19 8 L 19 16 C 19 17.654 17.654 19 16 19 L 8 19 C 6.346 19 5 17.654 5 16 L 5 8 C 5 6.346 6.346 5 8 5 z M 17 6 A 1 1 0 0 0 16 7 A 1 1 0 0 0 17 8 A 1 1 0 0 0 18 7 A 1 1 0 0 0 17 6 z M 12 7 C 9.243 7 7 9.243 7 12 C 7 14.757 9.243 17 12 17 C 14.757 17 17 14.757 17 12 C 17 9.243 14.757 7 12 7 z M 12 9 C 13.654 9 15 10.346 15 12 C 15 13.654 13.654 15 12 15 C 10.346 15 9 13.654 9 12 C 9 10.346 10.346 9 12 9 z"></path>
            </svg>
          </a>
          <a
            href="https://x.com/zivalandscapingco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M 2.3671875 3 L 9.4628906 13.140625 L 2.7402344 21 L 5.3808594 21 L 10.644531 14.830078 L 14.960938 21 L 21.871094 21 L 14.449219 10.375 L 20.740234 3 L 18.140625 3 L 13.271484 8.6875 L 9.2988281 3 L 2.3671875 3 z M 6.2070312 5 L 8.2558594 5 L 18.033203 19 L 16.001953 19 L 6.2070312 5 z"></path>
              </svg>
          </a>
          <a
            href="https://pinterest.com/zivalandscapingco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">Pinterest</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M 12 2 C 6.477 2 2 6.477 2 12 C 2 17.523 6.477 22 12 22 C 17.523 22 22 17.523 22 12 C 22 6.477 17.523 2 12 2 z M 12 4 C 16.418 4 20 7.582 20 12 C 20 16.418 16.418 20 12 20 C 11.264382 20 10.555494 19.892969 9.8789062 19.707031 C 10.09172 19.278284 10.282622 18.826454 10.386719 18.425781 C 10.501719 17.985781 10.972656 16.191406 10.972656 16.191406 C 11.278656 16.775406 12.173 17.271484 13.125 17.271484 C 15.958 17.271484 18 14.665734 18 11.427734 C 18 8.3227344 15.467031 6 12.207031 6 C 8.1520313 6 6 8.7215469 6 11.685547 C 6 13.063547 6.73325 14.779172 7.90625 15.326172 C 8.08425 15.409172 8.1797031 15.373172 8.2207031 15.201172 C 8.2527031 15.070172 8.4114219 14.431766 8.4824219 14.134766 C 8.5054219 14.040766 8.4949687 13.958234 8.4179688 13.865234 C 8.0299688 13.394234 7.71875 12.529656 7.71875 11.722656 C 7.71875 9.6496562 9.2879375 7.6445312 11.960938 7.6445312 C 14.268937 7.6445313 15.884766 9.2177969 15.884766 11.466797 C 15.884766 14.007797 14.601641 15.767578 12.931641 15.767578 C 12.009641 15.767578 11.317063 15.006312 11.539062 14.070312 C 11.804063 12.953313 12.318359 11.747406 12.318359 10.941406 C 12.318359 10.220406 11.932859 9.6191406 11.130859 9.6191406 C 10.187859 9.6191406 9.4296875 10.593391 9.4296875 11.900391 C 9.4296875 12.732391 9.7109375 13.294922 9.7109375 13.294922 C 9.7109375 13.294922 8.780375 17.231844 8.609375 17.964844 C 8.5246263 18.326587 8.4963381 18.755144 8.4941406 19.183594 C 5.8357722 17.883113 4 15.15864 4 12 C 4 7.582 7.582 4 12 4 z"></path>
              </svg>
          </a>
          <a
            href="https://youtube.com/zivalandscapingco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">Youtube</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M 12 4 C 12 4 5.7455469 3.9999687 4.1855469 4.4179688 C 3.3245469 4.6479688 2.6479687 5.3255469 2.4179688 6.1855469 C 1.9999687 7.7455469 2 12 2 12 C 2 12 1.9999687 16.254453 2.4179688 17.814453 C 2.6479687 18.675453 3.3255469 19.352031 4.1855469 19.582031 C 5.7455469 20.000031 12 20 12 20 C 12 20 18.254453 20.000031 19.814453 19.582031 C 20.674453 19.352031 21.352031 18.674453 21.582031 17.814453 C 22.000031 16.254453 22 12 22 12 C 22 12 22.000031 7.7455469 21.582031 6.1855469 C 21.352031 5.3255469 20.674453 4.6479688 19.814453 4.4179688 C 18.254453 3.9999687 12 4 12 4 z M 12 6 C 14.882 6 18.490875 6.1336094 19.296875 6.3496094 C 19.465875 6.3946094 19.604391 6.533125 19.650391 6.703125 C 19.891391 7.601125 20 10.342 20 12 C 20 13.658 19.891391 16.397875 19.650391 17.296875 C 19.605391 17.465875 19.466875 17.604391 19.296875 17.650391 C 18.491875 17.866391 14.882 18 12 18 C 9.119 18 5.510125 17.866391 4.703125 17.650391 C 4.534125 17.605391 4.3956094 17.466875 4.3496094 17.296875 C 4.1086094 16.398875 4 13.658 4 12 C 4 10.342 4.1086094 7.6011719 4.3496094 6.7011719 C 4.3946094 6.5331719 4.533125 6.3946094 4.703125 6.3496094 C 5.508125 6.1336094 9.118 6 12 6 z M 10 8.5351562 L 10 15.464844 L 16 12 L 10 8.5351562 z"></path>
              </svg>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-800 transition-colors"
          >
            <span className="sr-only">LinkedIn</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 19 C 3 20.105 3.895 21 5 21 L 19 21 C 20.105 21 21 20.105 21 19 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 5 L 19 5 L 19 19 L 5 19 L 5 5 z M 7.7792969 6.3164062 C 6.9222969 6.3164062 6.4082031 6.8315781 6.4082031 7.5175781 C 6.4082031 8.2035781 6.9223594 8.7167969 7.6933594 8.7167969 C 8.5503594 8.7167969 9.0644531 8.2035781 9.0644531 7.5175781 C 9.0644531 6.8315781 8.5502969 6.3164062 7.7792969 6.3164062 z M 6.4765625 10 L 6.4765625 17 L 9 17 L 9 10 L 6.4765625 10 z M 11.082031 10 L 11.082031 17 L 13.605469 17 L 13.605469 13.173828 C 13.605469 12.034828 14.418109 11.871094 14.662109 11.871094 C 14.906109 11.871094 15.558594 12.115828 15.558594 13.173828 L 15.558594 17 L 18 17 L 18 13.173828 C 18 10.976828 17.023734 10 15.802734 10 C 14.581734 10 13.930469 10.406562 13.605469 10.976562 L 13.605469 10 L 11.082031 10 z"></path>
              </svg>
          </a>
        </div>
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
          <p className="flex h-10 items-center justify-center bg-yellow-500 px-4 text-sm font-bold text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Furniture items have a lead time of 3-4 weeks from order placement date.
          </p>
        )}
        {pathname === "/shop/landscaping/red-soil-and-manure" && (
          <p className="flex lg:h-10 sm:h-16 items-center justify-center bg-yellow-500 px-4 text-sm font-bold text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Available in Sacks, Pick ups, Lorries and Tippers. Depends on location. Call/WhatsApp for prices.
          </p>
        )}
        {pathname === "/shop/landscaping/lawn-care-and-lawn-services" && (
          <p className="flex lg:h-10 sm:h-16 items-center justify-center bg-yellow-500 px-4 text-sm font-bold text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Call/WhatsApp for prices.
          </p>
        )}
        {pathname === "/shop/home-decor-and-furnishing/wall-art" && (
          <p className="flex lg:h-10 sm:h-16 items-center justify-center bg-yellow-500 px-4 text-sm font-bold text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Call/message for prices. Art available in Pencil/Paint framed on Canvas or to customers preference.
          </p>
        )}
        {pathname === "/shop/home-decor-and-furnishing/carpets" && (
          <p className="flex lg:h-10 sm:h-16 items-center justify-center bg-yellow-500 px-4 text-sm font-bold text-white sm:px-2 lg:px-8 font-[family-name:var(--font-quicksand)]">
            Carpets available in size 5ft by 8ft, 6ft by 9ft, 7ft by 10ft,8ft by 11ft
          </p>
        )}
      </header>
      <ShoppingCart open={cartOpen} setOpen={setCartOpen} />
    </div>
  );
}