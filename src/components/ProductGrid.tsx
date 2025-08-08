"use client";
import { motion, useAnimation } from "framer-motion";
import { Product } from "@/types";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { useProducts } from "@/lib/productContext";
import { useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import ProductActions from "@/components/ProductActions";

interface ProductGridProps {
  products: Product[];
  categoryName: string;
  subCategoryName: string;
}

const ProductGridComponent = ({ products: initialProducts, categoryName, subCategoryName }: ProductGridProps) => {
  const { setProducts } = useProducts();
  const controls = useAnimation();

  const memoizedProducts = useMemo(() => initialProducts, [initialProducts]);

  useEffect(() => {
    setProducts(memoizedProducts);
  }, [memoizedProducts, setProducts]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedProducts || memoizedProducts.length === 0) {
    console.log("No products to render:", initialProducts);
    return <div className="text-center text-gray-500 py-6 sm:py-8">No products available</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedProducts.map((product) => {
        console.log("Rendering product:", product.name, "Image:", product.imageUrl);
        return (
          <motion.div
            key={product.id}
            className="bg-white shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px]"
            initial={{ opacity: 0 }}
            animate={controls}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href={`/shop/${categoryName.toLowerCase().replace(/\s+/g, "-")}/${subCategoryName
                .toLowerCase()
                .replace(/\s+/g, "-")}/${product.id}`}
              className="block"
            >
              <div className="relative w-full h-32 sm:h-40 md:h-48">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    loader={product.imageUrl ? cloudinaryLoader : undefined}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-3 text-center">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 font-[family-name:var(--font-quicksand)]">
                  Kshs. {product.price.toFixed(2)}
                </p>
              </div>
            </Link>
            <div className="p-2 sm:p-3">
              <ProductActions productId={product.id} stock={product.stock} quantity={1} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const ProductGrid = memo(ProductGridComponent);

export function ProductGridWithProviders({ products, categoryName, subCategoryName }: ProductGridProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ProductGrid products={products} categoryName={categoryName} subCategoryName={subCategoryName} />
      </WishlistProvider>
    </CartProvider>
  );
}