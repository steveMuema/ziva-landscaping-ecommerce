"use client";
import { motion, useAnimation } from "framer-motion";
import { Product } from "@/types";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { useProducts } from "@/lib/productContext";
import { useState, useCallback, useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import ProductActions from "@/components/ProductActions";
import { normalizeSlug, slugify } from "@/lib/slug";
import { getMoreProducts } from "@/lib/actions/shop";
import { LoadMore } from "@/components/LoadMore";
import { PAGE_SIZE } from "@/lib/pagination";

interface ProductGridProps {
  products: Product[];
  categoryName: string;
  subCategoryName: string;
  categorySlug?: string;
  subCategorySlug?: string;
  tag?: string;
}

const ProductGridComponent = ({ products: initialProducts, categoryName, subCategoryName, categorySlug, subCategorySlug, tag }: ProductGridProps) => {
  const catSlug = categorySlug != null ? normalizeSlug(categorySlug) : slugify(categoryName);
  const subSlug = subCategorySlug != null ? normalizeSlug(subCategorySlug) : slugify(subCategoryName);
  const { setProducts } = useProducts();
  const controls = useAnimation();

  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [appendedProducts, setAppendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const newProducts = await getMoreProducts({
        categorySlug: catSlug,
        subCategorySlug: subSlug,
        tag,
        page: nextPage,
      }) as Product[];

      if (newProducts.length > 0) {
        setAppendedProducts((prev) => [...prev, ...newProducts]);
        setPage(nextPage);
      }
      setHasMore(newProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, catSlug, subSlug, tag]);

  const memoizedProducts = useMemo(() => {
    return [...initialProducts, ...appendedProducts];
  }, [initialProducts, appendedProducts]);

  useEffect(() => {
    setProducts(memoizedProducts);
  }, [memoizedProducts, setProducts]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedProducts || memoizedProducts.length === 0) {
    return <div className="text-center text-[var(--muted)] py-6 sm:py-8">No products available</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedProducts.map((product) => (
        <motion.div
          key={product.id}
          className="bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px] flex flex-col border border-[var(--card-border)]"
          initial={{ opacity: 0 }}
          animate={controls}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        >
          {product.stock < 1 && (
            <span
              className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium rounded-full px-2 py-1 z-10 font-[family-name:var(--font-quicksand)]"
              aria-label="Out of Stock"
            >
              Out of Stock
            </span>
          )}
          <Link
            href={`/shop/${catSlug}/${subSlug}/${product.id}`}
            className="block flex-1 min-h-0"
            prefetch={true}
          >
            <div className="relative w-full h-32 sm:h-40 md:h-48">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  loader={product.imageUrl?.startsWith("https://res.cloudinary.com") ? cloudinaryLoader : undefined}
                />
              ) : (
                <div className="w-full h-full bg-[var(--muted-bg)] flex items-center justify-center">
                  <span className="text-[var(--muted)] text-sm">No Image</span>
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3 text-center">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">
                {product.name}
              </h3>
              <p className="text-sm sm:text-base text-[var(--muted)] mb-2 font-[family-name:var(--font-quicksand)]">
                Kshs. {product.price.toFixed(2)}
              </p>
            </div>
          </Link>
          <div className="p-2 sm:p-3 shrink-0">
            <ProductActions productId={product.id} stock={product.stock} quantity={1} />
          </div>
        </motion.div>
      ))}

      <LoadMore hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore} />
    </div>
  );
};

export const ProductGrid = memo(ProductGridComponent);

export function ProductGridWithProviders({ products, categoryName, subCategoryName, categorySlug, subCategorySlug, tag }: ProductGridProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ProductGrid
          products={products}
          categoryName={categoryName}
          subCategoryName={subCategoryName}
          categorySlug={categorySlug}
          subCategorySlug={subCategorySlug}
          tag={tag}
        />
      </WishlistProvider>
    </CartProvider>
  );
}