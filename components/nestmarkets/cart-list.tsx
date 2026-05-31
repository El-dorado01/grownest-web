"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { CartStoreBlock } from "./cart-store-block";

export function CartList({ onCheckout }: { onCheckout: (storeId: string) => void }) {
  const { byStore, isLoading, count } = useCart();

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium">Your basket is empty</p>
        <Button asChild className="mt-4"><Link href="/marketplace">Browse products</Link></Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {Object.values(byStore).map((g) => (
        <CartStoreBlock key={g.store.id} store={g.store} items={g.items} onCheckout={onCheckout} />
      ))}
    </div>
  );
}
