"use client";

import { createContext, useContext, useState, ReactNode, FC } from "react";

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

export const WishlistProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

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

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  // if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}