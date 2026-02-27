import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import { getAgricultureCategories } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Category } from "@/types";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

const DEFAULT_BG_IMAGE = "/landscape.jpeg";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agriculture | Ziva Landscaping Co. — East Africa",
  description:
    "Agriculture products and solutions. Sustainable farming, landscaping, and eco-friendly supplies in Kenya and East Africa.",
  keywords: [
    "agriculture",
    "farming",
    "East Africa",
    "Kenya",
    "sustainable agriculture",
    "Ziva Landscaping",
  ],
};

export default async function AgriculturePage() {
  const [categories, settings] = await Promise.all([
    getAgricultureCategories(),
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
    { name: "Agriculture", href: "/agriculture", isCurrent: true },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-full" style={bgStyle}>
      <div className="flex flex-col flex-1 min-h-full bg-white/82 dark:bg-slate-900/82 backdrop-blur-md">
        <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px] flex-1">
          <Breadcrumb path={breadcrumbPath} />
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
            Agriculture
          </h1>
          <p className="text-center text-[var(--muted)] mb-6 sm:mb-8 font-[family-name:var(--font-quicksand)] max-w-2xl mx-auto">
            Sustainable agriculture and landscaping solutions for East Africa.
          </p>
          <Suspense fallback={<LoadingSkeleton count={4} />}>
            <CategoryGrid categories={sortedCategories as unknown as Category[]} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
