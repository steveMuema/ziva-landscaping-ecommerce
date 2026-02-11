import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import { getCategories } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Category } from "@/types";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop | Ziva Landscaping Co. — East Africa",
  description: "Shop landscaping and sustainable living products. Kenya, East Africa. Eco-friendly outdoor solutions.",
  keywords: ["shop", "landscaping", "East Africa", "Kenya", "Ziva Landscaping"],
};

export default async function ShopPage() {
  const categories = await getCategories();
  const sortedCategories = categories.sort((a, b) => a.id - b.id);

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop", isCurrent: true },
  ];
  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
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
  );
}