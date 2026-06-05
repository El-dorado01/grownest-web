import type { ReactNode } from "react";
import { CartDrawerProvider } from "@/context/cart-drawer";
import { CartDrawer } from "@/components/nestmarkets/cart-drawer";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <CartDrawerProvider>
      {children}
      <CartDrawer />
    </CartDrawerProvider>
  );
}
