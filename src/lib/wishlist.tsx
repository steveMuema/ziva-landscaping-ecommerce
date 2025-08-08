"use client";

import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";

interface WishlistItem {
  id: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export { WishlistContext };

// eslint-disable-next-line react/display-name
export const WishlistProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedWishlist = localStorage.getItem("wishlist");
      const parsed = storedWishlist ? JSON.parse(storedWishlist) : [];
      if (Array.isArray(parsed) && parsed.every(item => typeof item.id === "number")) {
        console.log("Initialized wishlist from localStorage:", parsed);
        return parsed;
      }
      console.warn("Invalid wishlist data in localStorage, resetting to empty");
      return [];
    } catch (error) {
      console.error("Error parsing wishlist from localStorage:", error);
      return [];
    }
  });

  // Sync with localStorage on mount and window focus
  useEffect(() => {
    const syncWishlist = () => {
      if (typeof window !== "undefined") {
        try {
          const storedWishlist = localStorage.getItem("wishlist");
          const parsed = storedWishlist ? JSON.parse(storedWishlist) : [];
          if (Array.isArray(parsed) && parsed.every(item => typeof item.id === "number")) {
            setItems(parsed);
            console.log("Synced wishlist from localStorage on focus:", parsed);
          }
        } catch (error) {
          console.error("Error syncing wishlist from localStorage:", error);
        }
      }
    };

    syncWishlist(); // Initial sync
    window.addEventListener("focus", syncWishlist);
    return () => window.removeEventListener("focus", syncWishlist);
  }, []);

  // Save to localStorage on items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("wishlist", JSON.stringify(items));
        localStorage.setItem("wishlistTimestamp", Date.now().toString());
        console.log("Saved wishlist to localStorage:", items);
      } catch (error) {
        console.error("Error saving wishlist to localStorage:", error);
      }
    }
  }, [items]);

  const addToWishlist = (productId: number) => {
    setItems((prev) => {
      if (!prev.some((item) => item.id === productId)) {
        return [...prev, { id: productId }];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearWishlist = () => {
    setItems([]);
  };

  console.log("WishlistProvider rendering with items:", items);
  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, clearWishlist }}>
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