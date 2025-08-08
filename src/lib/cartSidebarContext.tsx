"use client";

import { createContext, useContext, useState, ReactNode, FC } from "react";

interface CartSidebarContextType {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartSidebarContext = createContext<CartSidebarContextType | undefined>(undefined);

export const CartSidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartSidebarContext.Provider value={{ cartOpen, setCartOpen }}>
      {children}
    </CartSidebarContext.Provider>
  );
};

export function useCartSidebar() {
  const context = useContext(CartSidebarContext);
  if (!context) {
    console.error("useCartSidebar: CartSidebarProvider not found in component tree");
    throw new Error("useCartSidebar must be used within a CartSidebarProvider");
  }
  return context;
}