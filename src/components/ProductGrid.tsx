"use client";
import { motion, useAnimation } from "framer-motion";
import { Product } from "@/types";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { useEffect, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

interface ProductGridProps {
  products: Product[];
  categoryName: string; // Dynamic based on clicked category
  subCategoryName: string; // Dynamic based on clicked subcategory
}

const ProductGridComponent = ({ products: initialProducts, categoryName, subCategoryName }: ProductGridProps) => {
  const cart = useCart();
  const wishlist = useWishlist();
  const controls = useAnimation();

  const memoizedProducts = useMemo(() => initialProducts, [initialProducts]);

  const handleAddToCart = useCallback((productId: number) => {
    cart.addToCart(productId);
  }, [cart]);

  const handleAddToWishlist = useCallback((productId: number) => {
    wishlist.addToWishlist(productId);
  }, [wishlist]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedProducts || memoizedProducts.length === 0) {
    console.log("No products to render:", initialProducts); // Debug log
    return <div className="text-center text-gray-500 py-6 sm:py-8">No products available</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedProducts.map((product) => {
        console.log("Rendering product:", product.name, "Image:", product.imageUrl); // Debug log
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
              href={`/shop/${categoryName.toLowerCase().replace(/\s+/g, '-')}/${subCategoryName.toLowerCase().replace(/\s+/g, '-')}/${product.id}`}
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
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">{product.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 font-[family-name:var(--font-quicksand)]">
                  Kshs. {product.price.toFixed(2)}
                </p>
                <div className="flex justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={(e) => { e.preventDefault(); handleAddToCart(product.id); }}
                    className="bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-green-700 transition-colors duration-200 text-xs sm:text-sm"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleAddToWishlist(product.id); }}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200 text-xs sm:text-sm"
                  >
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </Link>
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