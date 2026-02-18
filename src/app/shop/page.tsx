import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import { getCategories } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Category } from "@/types";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

const DEFAULT_BG_IMAGE = "/landscape.jpeg";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop | Ziva Landscaping Co. — East Africa",
  description: "Shop landscaping and sustainable living products. Kenya, East Africa. Eco-friendly outdoor solutions.",
  keywords: ["shop", "landscaping", "East Africa", "Kenya", "Ziva Landscaping"],
};

export default async function ShopPage() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getSettings([SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]),
  ]);
  const sortedCategories = categories.sort((a, b) => a.id - b.id);
  const bgImageUrl =
    settings[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]?.trim() || DEFAULT_BG_IMAGE;
  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.25)), url(${bgImageUrl})`,
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop", isCurrent: true },
  ];
  return (
    <div className="relative flex flex-col flex-1 min-h-full">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={bgStyle}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col flex-1 min-h-full bg-white/82 dark:bg-slate-900/82 backdrop-blur-md">
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px] flex-1">
        <Breadcrumb path={breadcrumbPath} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
          Shop Our Collections
        </h1>
        <Suspense fallback={<LoadingSkeleton count={4} />}>
          <CategoryGrid categories={sortedCategories as unknown as Category[]} />
        </Suspense>
      </div>
      <Footer />
      </div>
    </div>
  );
}