"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CartDrawerValue {
  open: boolean;
  setOpen: (o: boolean) => void;
  openDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerValue | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CartDrawerContext.Provider value={{ open, setOpen, openDrawer: () => setOpen(true) }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  // Safe fallback so CartBadge still works if rendered outside the provider.
  if (!ctx) return { open: false, setOpen: () => {}, openDrawer: () => {} } as CartDrawerValue;
  return ctx;
}
