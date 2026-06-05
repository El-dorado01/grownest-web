"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/context/cart-drawer";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const { count } = useCart();
  const { openDrawer } = useCartDrawer();
  return (
    <button
      type="button"
      onClick={openDrawer}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors",
        className
      )}
      aria-label="Open cart"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
