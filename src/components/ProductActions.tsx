"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useCartSidebar } from "@/lib/cartSidebarContext";
import { ShoppingCartIcon as ShoppingCartOutlineIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon as ShoppingCartSolidIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

interface ProductActionsProps {
  productId: number;
  stock: number;
  quantity?: number;
}

const ProductActions = ({ productId, stock, quantity = 1 }: ProductActionsProps) => {
  const { items: cartItems, addToCart, removeFromCart } = useCart();
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const { setCartOpen } = useCartSidebar();
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const isInCart = cartItems.some((item) => item.productId === productId);
  const isWishlisted = wishlistItems.some((item) => item.productId === productId);
  const effectiveQuantity = quantity > stock ? stock : quantity < 1 ? 1 : quantity;

  const handleToggleCart = async () => {
    if (isCartLoading) return;
    setIsCartLoading(true);
    try {
      if (isInCart) {
        await removeFromCart(productId);
      } else if (stock >= effectiveQuantity) {
        await addToCart(productId, effectiveQuantity);
        setCartOpen(true); // Open sidebar on add to cart
      }
    } catch (error) {
      console.error(`Error handling cart for product ${productId}:`, error);
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error(`Error handling wishlist for product ${productId}:`, error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <button
        onClick={handleToggleCart}
        disabled={stock < 1 || isCartLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-[family-name:var(--font-quicksand)] ${
          isCartLoading
            ? "bg-gray-500 text-white cursor-wait"
            : isInCart
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : stock >= effectiveQuantity
            ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
      >
        {isCartLoading ? (
          <svg
            className="animate-spin w-5 h-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : isInCart ? (
          <ShoppingCartSolidIcon className="w-5 h-5" />
        ) : (
          <ShoppingCartOutlineIcon className="w-5 h-5" />
        )}
        <span>{isCartLoading ? "Processing..." : isInCart ? "Remove from Cart" : "Add to Cart"}</span>
      </button>
      <button
        onClick={handleToggleWishlist}
        disabled={isWishlistLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-[family-name:var(--font-quicksand)] ${
          isWishlistLoading
            ? "bg-gray-200 text-gray-400 cursor-wait"
            : isWishlisted
            ? "bg-red-100 text-red-600 hover:bg-red-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {isWishlistLoading ? (
          <svg
            className="animate-spin w-5 h-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : isWishlisted ? (
          <HeartSolidIcon className="w-5 h-5" />
        ) : (
          <HeartOutlineIcon className="w-5 h-5" />
        )}
        <span>
          {isWishlistLoading ? "Processing..." : isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        </span>
      </button>
    </div>
  );
};

export default ProductActions;