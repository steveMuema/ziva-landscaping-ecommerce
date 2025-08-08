"use client";

import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";

export interface CartItem {
  id: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          setItems(JSON.parse(storedCart));
          console.log("Initialized cart from localStorage:", JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("Error initializing cart from localStorage:", error);
      }
    }
  }, []);

  // Sync cart with localStorage and dispatch custom event on items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cart", JSON.stringify(items));
        console.log("Updated cart in localStorage:", items);
        // Dispatch custom event to notify listeners
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        console.error("Error updating cart in localStorage:", error);
      }
    }
  }, [items]);

  // Listen for storage events to sync cart across tabs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === "cart" && event.newValue) {
          try {
            const updatedCart = JSON.parse(event.newValue);
            setItems(updatedCart);
            console.log("Synced cart from storage event:", updatedCart);
            window.dispatchEvent(new Event("cartUpdated"));
          } catch (error) {
            console.error("Error syncing cart from storage event:", error);
          }
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  const addToCart = (productId: number) => {
    setItems((prevItems) => {
      if (!prevItems.some((item) => item.id === productId)) {
        const newItems = [...prevItems, { id: productId }];
        console.log(`Added product ${productId} to cart`);
        return newItems;
      }
      console.log(`Product ${productId} already in cart`);
      return prevItems;
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId);
      console.log(`Removed product ${productId} from cart`);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    console.log("Cleared cart");
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    console.error("useCart: CartProvider not found in component tree");
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}