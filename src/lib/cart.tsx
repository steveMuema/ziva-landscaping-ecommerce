"use client";

import { createContext, useContext, useState, ReactNode, FC, memo } from "react";

// Define the shape of a cart item
interface CartItem {
  productId: number;
  quantity: number;
}

// Define the context value type
interface CartContextType {
  items: CartItem[];
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

export { CartContext };

// Memoize CartProvider to prevent unnecessary re-renders
// eslint-disable-next-line react/display-name
export const CartProvider: FC<{ children: ReactNode }> = memo(({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (productId: number) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.productId === productId);
      if (existingItem) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  console.log("CartProvider rendering with items length:", items.length);
  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
});

export function useCart() {
  const context = useContext(CartContext);
  console.log("useCart context:", context ? "defined" : "undefined", "at", new Date().toISOString());
  if (!context) {
    console.error("CartProvider not found in the component tree ");
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}