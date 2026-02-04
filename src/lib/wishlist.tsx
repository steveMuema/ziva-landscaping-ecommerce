"use client";

import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";
import { Wishlist } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface WishlistContextType {
  items: Wishlist[];
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Wishlist[]>([]);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("clientId");
      if (!id) {
        id = uuidv4();
        localStorage.setItem("clientId", id);
        console.log("Generated new clientId:", id);
      }
      setClientId(id);

      const fetchWishlist = async () => {
        try {
          const response = await fetch(`/api/wishlist?clientId=${id}`);
          const wishlistItems = await response.json();
          setItems(Array.isArray(wishlistItems) ? wishlistItems : []);
          console.log("Initialized wishlist from API:", wishlistItems);
        } catch (error) {
          console.error("Error initializing wishlist from API:", error);
        }
      };
      fetchWishlist();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && clientId) {
      const handleWishlistUpdate = () => {
        const fetchWishlist = async () => {
          try {
            const response = await fetch(`/api/wishlist?clientId=${clientId}`);
            const wishlistItems = await response.json();
            if (Array.isArray(wishlistItems)) {
              setItems(wishlistItems);
              console.log("Synced wishlist from wishlistUpdated event:", wishlistItems);
            }
          } catch (error) {
            console.error("Error syncing wishlist from wishlistUpdated event:", error);
          }
        };
        fetchWishlist();
      };
      window.addEventListener("wishlistUpdated", handleWishlistUpdate);
      return () => window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    }
  }, [clientId]);

  const addToWishlist = async (productId: number) => {
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, productId }),
      });
      if (!response.ok) throw new Error("Failed to add to wishlist");
      const newItem = await response.json();
      setItems((prevItems) => {
        if (!prevItems.some((item) => item.productId === productId)) {
          const newItems = [...prevItems, newItem];
          console.log(`Added product ${productId} to wishlist, new items:`, newItems);
          window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: { items: newItems } }));
          return newItems;
        }
        return prevItems;
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, productId }),
      });
      if (!response.ok) throw new Error("Failed to remove from wishlist");
      setItems((prevItems) => {
        const newItems = prevItems.filter((item) => item.productId !== productId);
        console.log(`Removed product ${productId} from wishlist, new items:`, newItems);
        window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: { items: newItems } }));
        return newItems;
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    console.error("useWishlist: WishlistProvider not found in component tree");
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}