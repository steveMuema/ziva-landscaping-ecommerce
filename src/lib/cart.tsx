"use client";

import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";
import { Cart } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface CartContextType {
  items: Cart[];
  addToCart: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateCart: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Cart[]>([]);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("clientId");
      if (!id) {
        id = uuidv4();
        localStorage.setItem("clientId", id);
        // Set clientId in a cookie for server-side access
        document.cookie = `clientId=${id}; path=/; max-age=31536000; SameSite=Lax`;
        console.log("Generated new clientId:", id);
      } else {
        // Ensure cookie is set for existing clientId
        document.cookie = `clientId=${id}; path=/; max-age=31536000; SameSite=Lax`;
        console.log("Retrieved existing clientId:", id);
      }
      setClientId(id);

      const fetchCart = async () => {
        try {
          const response = await fetch(`/api/cart?clientId=${id}`, {
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
          }
          const cartItems = await response.json();
          if (!Array.isArray(cartItems)) {
            console.warn("Received non-array cart response:", cartItems);
            setItems([]);
            return;
          }
          const validItems = cartItems.filter((item: Cart) => {
            if (!item.product) {
              console.warn(`Cart item ${item.id} missing product data`, item);
              return false;
            }
            return true;
          });
          setItems(validItems);
          console.log("Initialized cart from API:", validItems);
        } catch (error) {
          console.error("Error initializing cart from API:", error);
          setItems([]);
        }
      };
      fetchCart();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && clientId) {
      const handleCartUpdate = async () => {
        try {
          const response = await fetch(`/api/cart?clientId=${clientId}`, {
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            throw new Error(`Failed to sync cart: ${response.status} ${response.statusText}`);
          }
          const cartItems = await response.json();
          if (!Array.isArray(cartItems)) {
            console.warn("Received non-array cart response in cartUpdated:", cartItems);
            setItems([]);
            return;
          }
          const validItems = cartItems.filter((item: Cart) => {
            if (!item.product) {
              console.warn(`Cart item ${item.id} missing product data`, item);
              return false;
            }
            return true;
          });
          setItems(validItems);
          console.log("Synced cart from cartUpdated event:", validItems);
        } catch (error) {
          console.error("Error syncing cart from cartUpdated event:", error);
          setItems([]);
        }
      };
      window.addEventListener("cartUpdated", handleCartUpdate);
      return () => window.removeEventListener("cartUpdated", handleCartUpdate);
    }
  }, [clientId]);

  const addToCart = async (productId: number, quantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, productId, quantity }),
      });
      if (!response.ok) throw new Error(`Failed to add to cart: ${response.status} ${response.statusText}`);
      const newItem = await response.json();
      if (!newItem.product) {
        console.warn(`Added cart item ${newItem.id} missing product data`, newItem);
        return;
      }
      setItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.productId === productId);
        if (existingItem) {
          return prevItems.map((item) =>
            item.productId === productId ? { ...item, quantity: newItem.quantity, product: newItem.product } : item
          );
        }
        return [...prevItems, newItem];
      });
      console.log(`Added product ${productId} to cart with quantity ${quantity}`);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, productId }),
      });
      if (!response.ok) throw new Error(`Failed to remove from cart: ${response.status} ${response.statusText}`);
      
      const fetchResponse = await fetch(`/api/cart?clientId=${clientId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch cart after removal: ${fetchResponse.status} ${response.statusText}`);
      }
      const cartItems = await fetchResponse.json();
      if (!Array.isArray(cartItems)) {
        console.warn("Received non-array cart response after removal:", cartItems);
        setItems([]);
        return;
      }
      const validItems = cartItems.filter((item: Cart) => {
        if (!item.product) {
          console.warn(`Cart item ${item.id} missing product data`, item);
          return false;
        }
        return true;
      });
      setItems(validItems);
      console.log(`Removed product ${productId} from cart, new items:`, validItems);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateCart = async (productId: number, quantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, productId, quantity }),
      });
      if (!response.ok) throw new Error(`Failed to update cart: ${response.status} ${response.statusText}`);
      
      const fetchResponse = await fetch(`/api/cart?clientId=${clientId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch cart after update: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      const cartItems = await fetchResponse.json();
      if (!Array.isArray(cartItems)) {
        console.warn("Received non-array cart response after update:", cartItems);
        setItems([]);
        return;
      }
      const validItems = cartItems.filter((item: Cart) => {
        if (!item.product) {
          console.warn(`Cart item ${item.id} missing product data`, item);
          return false;
        }
        return true;
      });
      setItems(validItems);
      console.log(`Updated product ${productId} quantity to ${quantity}, new items:`, validItems);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!response.ok) throw new Error(`Failed to clear cart: ${response.status} ${response.statusText}`);
      const fetchResponse = await fetch(`/api/cart?clientId=${clientId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch cart after clearing: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      setItems([]);
      console.log("Cleared cart for clientId:", clientId);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateCart, clearCart }}>
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