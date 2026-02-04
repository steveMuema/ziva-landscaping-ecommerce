import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import { getAgricultureCategories } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Category } from "@/types";
import Footer from "@/components/Footer";

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
  const categories = await getAgricultureCategories();
  const sortedCategories = categories.sort((a, b) => a.id - b.id);

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Agriculture", href: "/agriculture", isCurrent: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px]">
        <Breadcrumb path={breadcrumbPath} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-900 font-[family-name:var(--font-quicksand)]">
          Agriculture
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 font-[family-name:var(--font-quicksand)] max-w-2xl mx-auto">
          Sustainable agriculture and landscaping solutions for East Africa.
        </p>
        <Suspense fallback={<LoadingSkeleton count={4} />}>
          <CategoryGrid categories={sortedCategories as unknown as Category[]} />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
