"use client";
import { motion, useAnimation } from "framer-motion";
import { SubCategory } from "@/types";
import { useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

interface SubCategoryGridProps {
  subCategories: SubCategory[];
  categoryName: string;
}

const SubCategoryGridComponent = ({ subCategories: initialSubCategories, categoryName }: SubCategoryGridProps) => {
  const controls = useAnimation();
  const memoizedSubCategories = useMemo(() => initialSubCategories, [initialSubCategories]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedSubCategories || memoizedSubCategories.length === 0) {
    console.log("No subcategories to render:", initialSubCategories); // Debug log
    return <div className="text-center text-gray-500 py-6 sm:py-8">No subcategories available</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedSubCategories.map((subCategory) => {
        // const firstProduct = subCategory.products[0];
        const subCategoryUrl = subCategory.name.toLowerCase().replace(/\s+/g, '-');
        console.log("Rendering subcategory:", subCategory.name, "URL:", `/shop/${categoryName.toLowerCase().replace(/\s+/g, '-')}/${subCategoryUrl}`, "Image:", subCategory.imageUrl); // Debug log
        return (
          <motion.div
            key={subCategory.id}
            className="bg-white shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px]"
            initial={{ opacity: 0 }}
            animate={controls}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/shop/${categoryName.toLowerCase().replace(/\s+/g, '-')}/${subCategoryUrl}`}>
              <div className="relative w-full h-32 sm:h-40 md:h-48">
                {subCategory?.imageUrl ? (
                  <Image
                    src={subCategory.imageUrl}
                    alt={subCategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    loader={subCategory.imageUrl ? cloudinaryLoader : undefined} 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-3 text-center">
                <h3 className="text-base sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">{subCategory.name}</h3>
                <p className="text-base sm:text-sm text-gray-600 mb-2 font-[family-name:var(--font-quicksand)]">
                  {subCategory.products.length} products
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export const SubCategoryGrid = memo(SubCategoryGridComponent);