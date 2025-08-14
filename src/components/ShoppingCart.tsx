"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/lib/cart";
import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

interface ShoppingCartProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ShoppingCart = ({ open, setOpen }: ShoppingCartProps) => {
  const { items, removeFromCart, clearCart } = useCart();
  const [cartKey, setCartKey] = useState(0);

  useEffect(() => {
    const handleCartUpdate = () => {
      // Increment cartKey to force re-render only if items change
      setCartKey((prev) => prev + 1);
      console.log("ShoppingCart: Received cartUpdated event, items:", items);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []); // Remove `items` from dependencies to avoid re-adding listener

  const handleRemoveFromCart = async (productId: number) => {
    try {
      await removeFromCart(productId);
      console.log(`Removed product ${productId} from cart`);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      console.log("Cleared cart");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const subtotal = items.reduce((total, item) => {
    const product = item.product;
    const quantity = item.quantity || 1;
    return total + (product ? product.price * quantity : 0);
  }, 0);

  return (
    <Dialog key={cartKey} open={open} onClose={setOpen} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-lg font-medium text-gray-900 font-[family-name:var(--font-quicksand)]">
                      Shopping Cart
                    </DialogTitle>
                    <div className="ml-3 flex h-7 items-center space-x-2">
                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCart}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-500 font-[family-name:var(--font-quicksand)]"
                        >
                          Clear Cart
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                      >
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flow-root">
                      {items.length === 0 ? (
                        <p className="text-center text-gray-500 font-[family-name:var(--font-quicksand)]">
                          Your cart is empty
                        </p>
                      ) : (
                        <ul role="list" className="-my-6 divide-y divide-gray-200">
                          {items.map((item) => {
                            const product = item.product;
                            if (!product) {
                              console.warn(`Product missing for cart item ID ${item.id}`);
                              return null;
                            }
                            const quantity = item.quantity || 1;
                            return (
                              <li key={item.id} className="flex py-6">
                                <div className="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
                                  {product.imageUrl ? (
                                    <Image
                                      src={product.imageUrl}
                                      alt={product.name}
                                      width={96}
                                      height={96}
                                      className="size-full object-cover"
                                      loader={cloudinaryLoader}
                                    />
                                  ) : (
                                    <div className="size-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-gray-500 text-sm">No Image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 flex flex-1 flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900 font-[family-name:var(--font-quicksand)]">
                                      <h3>{product.name}</h3>
                                      <p>Kshs. {(product.price * quantity).toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-1 items-end justify-between text-sm">
                                    <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
                                      Qty {quantity}
                                    </p>
                                    <div className="flex">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFromCart(item.productId)}
                                        className="font-medium text-emerald-600 hover:text-emerald-500 font-[family-name:var(--font-quicksand)]"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900 font-[family-name:var(--font-quicksand)]">
                    <p>Subtotal</p>
                    <p>Kshs. {subtotal.toFixed(2)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 font-[family-name:var(--font-quicksand)]">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <div className="mt-6">
                    <a
                      href="/checkout"
                      className="flex items-center justify-center rounded-lg border border-transparent bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 font-[family-name:var(--font-quicksand)]"
                    >
                      Checkout
                    </a>
                  </div>
                  <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                    <p>
                      or{" "}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="font-medium text-emerald-600 hover:text-emerald-500 font-[family-name:var(--font-quicksand)]"
                      >
                        Continue Shopping
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ShoppingCart;