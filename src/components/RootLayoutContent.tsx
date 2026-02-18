"use client";

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/navbar";
import ChatAgent from "@/components/ChatAgent";

/** Paths where the navbar shows an extra banner strip below the main row */
const PATHS_WITH_NAV_BANNER = new Set([
  "/shop/furniture-and-fittings",
  "/shop/landscaping/lawn-designs",
  "/shop/landscaping/red-soil-and-manure",
  "/shop/landscaping/lawn-care-and-lawn-services",
  "/shop/home-decor-and-furnishing/wall-art",
  "/shop/home-decor-and-furnishing/carpets",
]);

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  const hasNavBanner = pathname != null && PATHS_WITH_NAV_BANNER.has(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-20 w-full">
        <NavigationBar />
      </div>
      {/* Spacer so content starts below the fixed navbar (main row + optional banner) */}
      <div
        className={`shrink-0 ${hasNavBanner ? "h-24 sm:h-28 md:h-32" : "h-14 sm:h-16 md:h-20"}`}
        aria-hidden
      />
      <ChatAgent />
      <main className="flex-1 flex flex-col min-h-0 pb-20 sm:pb-24">{children}</main>
    </div>
  );
}
