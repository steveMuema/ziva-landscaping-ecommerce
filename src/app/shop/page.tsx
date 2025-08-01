import NavigationBar from "@/components/navbar";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import { getCategories } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Category } from "@/types";
import Footer from "@/components/Footer";

export const revalidate = 10;

export default async function ShopPage() {
  const categories = await getCategories();
  
  // Sort categories by id in ascending order
  const sortedCategories = categories.sort((a, b) => a.id - b.id);
  console.log("Categories fetched:", sortedCategories); // Debug log

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar />
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px]">
        <Breadcrumb path={[{ name: "Home", href: "/" }, { name: "Shop", href: "/shop" }]} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">
          Shop Our Collections
        </h1>
        <Suspense fallback={<LoadingSkeleton count={4} />}>
          <CategoryGrid categories={sortedCategories as Category[]} />
        </Suspense>
      </div>
      <Footer/>
    </div>
  );
}