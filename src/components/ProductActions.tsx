"use client";

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
  const cart = useCart();
  const wishlist = useWishlist();
  const { setCartOpen } = useCartSidebar();

  const isInCart = cart.items.some((item) => item.id === productId);
  const isWishlisted = wishlist.items.some((item) => item.id === productId);

  // Validate quantity for cart
  const effectiveQuantity = quantity > stock ? stock : quantity < 1 ? 1 : quantity;

  console.log(`ProductActions (productId: ${productId}): isInCart=${isInCart}, cartItems=`, cart.items, `effectiveQuantity=${effectiveQuantity}, isWishlisted=${isWishlisted}, wishlistItems=`, wishlist.items);

  const handleToggleCart = () => {
    if (isInCart) {
      cart.removeFromCart(productId);
      // Remove quantity from cartQuantities
      if (typeof window !== "undefined") {
        try {
          const storedQuantities = localStorage.getItem("cartQuantities");
          const quantities = storedQuantities ? JSON.parse(storedQuantities) : {};
          delete quantities[productId];
          localStorage.setItem("cartQuantities", JSON.stringify(quantities));
          console.log(`Removed product ${productId} from cart and cartQuantities`);
        } catch (error) {
          console.error("Error updating cartQuantities:", error);
        }
      }
    } else if (stock >= effectiveQuantity) {
      cart.addToCart(productId);
      // Update cartQuantities
      if (typeof window !== "undefined") {
        try {
          const storedQuantities = localStorage.getItem("cartQuantities");
          const quantities = storedQuantities ? JSON.parse(storedQuantities) : {};
          quantities[productId] = effectiveQuantity;
          localStorage.setItem("cartQuantities", JSON.stringify(quantities));
          console.log(`Added product ${productId} to cart with quantity ${effectiveQuantity}`);
        } catch (error) {
          console.error("Error updating cartQuantities:", error);
        }
      }
      setCartOpen(true); // Open sidebar
    }
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      wishlist.removeFromWishlist(productId);
      console.log(`Removed product ${productId} from wishlist`);
    } else {
      wishlist.addToWishlist(productId);
      console.log(`Added product ${productId} to wishlist`);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleToggleCart}
        disabled={stock < effectiveQuantity}
        className={`w-full py-4 px-8 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 font-[family-name:var(--font-quicksand)] ${
          isInCart
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : stock >= effectiveQuantity
            ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
      >
        {isInCart ? (
          <ShoppingCartSolidIcon className="w-5 h-5" />
        ) : (
          <ShoppingCartOutlineIcon className="w-5 h-5" />
        )}
        <span>{isInCart ? "Remove from Cart" : "Add to Cart"}</span>
      </button>
      <button
        onClick={handleToggleWishlist}
        className={`w-full py-4 px-8 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 font-[family-name:var(--font-quicksand)] ${
          isWishlisted
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
        }`}
        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {isWishlisted ? (
          <HeartSolidIcon className="w-5 h-5" />
        ) : (
          <HeartOutlineIcon className="w-5 h-5" />
        )}
        <span>{isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}</span>
      </button>
    </div>
  );
};

export default ProductActions;