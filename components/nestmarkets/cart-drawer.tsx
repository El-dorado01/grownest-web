"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CartList } from "./cart-list";
import { CheckoutSheet } from "./checkout-sheet";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/context/cart-drawer";

export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const { count } = useCart();
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const startCheckout = (storeId: string) => {
    setCheckoutStoreId(storeId);
    setOpen(false); // close the cart drawer
    setCheckoutOpen(true); // open the checkout sheet
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 gap-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-lg font-semibold tracking-tight">
              Your basket{count > 0 ? ` (${count})` : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 py-5">
            <CartList onCheckout={startCheckout} />
          </div>
        </SheetContent>
      </Sheet>
      <CheckoutSheet storeId={checkoutStoreId} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
