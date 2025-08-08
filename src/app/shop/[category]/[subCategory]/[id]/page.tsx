"use client";
import Footer from "@/components/Footer";
import NavigationBar from "@/components/navbar";
import ProductSection from "@/sections/product.session";
import { useParams } from "next/navigation";
import { ProductProvider, useProducts } from "@/lib/productContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";

// Inner component to use useProducts within ProductProvider
function ProductPageContent() {
  const params = useParams();
  const { category, subCategory, id } = params;
  const { products } = useProducts();

  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500 py-8">Product not found</div>
      </div>
    );
  }

  return (
    <>
      {/* <NavigationBar /> */}
      <ProductSection
        product={product}
        categoryName={category as string}
        subCategoryName={subCategory as string}
      />
      <Footer />
    </>
  );
}

export default function ProductPage() {
  return (
    <ProductProvider>
      <CartProvider>
        <WishlistProvider>
          <ProductPageContent />
        </WishlistProvider>
      </CartProvider>
    </ProductProvider>
  );
}