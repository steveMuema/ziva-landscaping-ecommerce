import { getCategoryByName } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import {SubCategoryGrid} from "@/components/SubCategoryGrid";
import NavigationBar from "@/components/navbar";
import {  SubCategory } from "@/types";
import Footer from "@/components/Footer";

export const revalidate = 10;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>; // params is now a Promise
}) {
  // Await the params Promise
  const resolvedParams = await params;
  const categoryName = resolvedParams.category
    ? resolvedParams.category.replace(/-/g, ' ').toLowerCase()
    : "";
  console.log("Resolved Params:", resolvedParams); // Debug log

  if (!categoryName) {
    return <div className="text-center text-gray-500 py-8">Invalid category</div>;
  }

  const category = await getCategoryByName(categoryName);
  console.log("Category fetched:", category); // Debug log
  if (!category) {
    return <div className="text-center text-gray-500 py-8">Category not found</div>;
  }

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: category.name, href: `/shop/${categoryName.toLowerCase().replace(/\s+/g, '-')}` },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px]">
        <Breadcrumb path={breadcrumbPath} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">
          {category.name} Categories
        </h1>
        <Suspense fallback={<LoadingSkeleton count={category.subCategories.length || 4} />}>
          <SubCategoryGrid subCategories={category.subCategories as SubCategory[]} categoryName={category.name} />
        </Suspense>
      </div>
      <Footer/>
    </div>
  );
}