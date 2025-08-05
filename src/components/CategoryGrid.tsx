"use client";
import { motion, useAnimation } from "framer-motion";
import { Category } from "@/types";
import { useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGridComponent = ({ categories: initialCategories }: CategoryGridProps) => {
  const controls = useAnimation();
  const memoizedCategories = useMemo(() => initialCategories, [initialCategories]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedCategories || memoizedCategories.length === 0) {
    console.log("No categories to render:", initialCategories); // Debug log
    return <div className="text-center text-gray-500 py-6 sm:py-8">No categories available</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedCategories.map((category) => {
        const totalSubcategories = category.subCategories.length;
        console.log("Rendering category:", category.name, "Image:", category.imageUrl); // Debug log
        return (
          <motion.div
            key={category.id}
            className="bg-white shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px]"
            initial={{ opacity: 0 }}
            animate={controls}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/shop/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="relative w-full h-32 sm:h-40 md:h-48">
                  {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        loader={category.imageUrl ? cloudinaryLoader : undefined} 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
              </div>
              <div className="p-2 sm:p-3 text-center">
                <h3 className="text-base sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">{category.name}</h3>
                <p className="text-base sm:text-sm text-gray-600 mb-2 font-[family-name:var(--font-quicksand)]">
                  {totalSubcategories} Categories
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export const CategoryGrid = memo(CategoryGridComponent);