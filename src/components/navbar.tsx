"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Server action to fetch categories
async function getCategories() {
  const res = await fetch("/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

export default function NavigationBar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categoryStates, setCategoryStates] = useState({});
  const [navigation, setNavigation] = useState({
    categories: [],
    pages: [
      { name: "Shop", href: "/shop" },
      { name: "Company", href: "/company" },
      { name: "Blog", href: "/blog" },
    ],
  });
  const pathname = usePathname();

  useEffect(() => {
    getCategories().then((data) =>
      setNavigation((prev) => ({ ...prev, categories: data }))
    );
  }, []);

  const toggleCategory = (categoryId) => {
    setCategoryStates((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <div className="bg-white">
      {/* Mobile menu */}
      <Dialog open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} className="relative z-40 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
          <DialogPanel className="h-full overflow-y-auto p-4">
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            {navigation.categories.map((category) => (
              <div key={category.id} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-left font-medium text-gray-700 hover:text-gray-900 flex justify-between items-center"
                >
                  {category.name}
                  <span>{categoryStates[category.id] ? "−" : "+"}</span>
                </button>
                {categoryStates[category.id] && (
                  <ul className="mt-2 space-y-2 pl-4">
                    {category.sections[0].items.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="block text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </DialogPanel>
        </div>
      </Dialog>

      <header className="relative bg-white">
        <p className="flex h-10 items-center justify-center bg-emerald-700 px-4 text-sm font-medium text-white sm:px-2 lg:px-8">
          FURNITURE ITEMS HAVE A LEAD TIME OF 3-4WEEKS FROM ORDER PLACEMENT DATE.
        </p>

        <nav aria-label="Top" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <div className="flex h-16 items-center">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="relative rounded-md bg-white p-2 text-gray-400 lg:hidden"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </button>

              {/* Logo */}
              <div className="ml-4 flex lg:ml-0">
                <Link href="/">
                  <span className="sr-only">Ziva Landscaping CO.</span>
                  <Image
                    alt="Ziva Landscaping Co."
                    src="/Ziva_Logo.svg"
                    className="h-15 w-auto"
                    width={255}
                    height={80}
                  />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <PopoverGroup className="hidden lg:ml-8 lg:block lg:self-stretch">
                <div className="flex h-full space-x-8">
                  <Popover className="flex">
                    <div className="relative flex">
                      <PopoverButton className="group relative flex items-center justify-center text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:text-gray-800">
                        Categories
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-px z-30 h-0.5 transition duration-200 ease-out group-data-open:bg-emerald-700"
                        />
                      </PopoverButton>
                    </div>

                    <PopoverPanel
                      transition
                      className="absolute inset-x-0 top-full z-20 w-full bg-white text-sm text-gray-500 transition data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                    >
                      <div aria-hidden="true" className="absolute inset-0 top-1/2 bg-white shadow-sm" />
                      <div className="relative bg-white">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                          <div className="grid grid-cols-1 gap-y-10 py-16">
                            {navigation.categories.map((category) => (
                              <div key={category.id}>
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="w-full text-left font-medium text-gray-900 flex justify-between items-center"
                                >
                                  {category.name}
                                  <span>{categoryStates[category.id] ? "−" : "+"}</span>
                                </button>
                                {categoryStates[category.id] && (
                                  <ul
                                    role="list"
                                    className="mt-6 space-y-6"
                                  >
                                    {category.sections[0].items.map((item) => (
                                      <li key={item.name} className="flex">
                                        <Link
                                          href={item.href}
                                          className="hover:text-gray-800"
                                        >
                                          {item.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverPanel>
                  </Popover>

                  {navigation.pages.map((page) => (
                    <Link
                      key={page.name}
                      href={page.href}
                      className={`flex items-center text-sm font-medium transition-colors duration-200 ease-out ${
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
              </PopoverGroup>

              <div className="ml-auto flex items-center">
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                  <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                    Sign in
                  </a>
                  <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
                  <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                    Create account
                  </a>
                </div>

                {/* Cart */}
                <div className="ml-4 flow-root lg:ml-6">
                  <a href="#" className="group -m-2 flex items-center p-2">
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">0</span>
                    <span className="sr-only">items in cart, view bag</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}