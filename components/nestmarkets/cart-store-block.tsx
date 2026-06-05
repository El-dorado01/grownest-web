"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { StoreSuggestions } from "./store-suggestions";
import type { CartItem, MarketStoreLite } from "@/types/nestmarkets";

export function CartStoreBlock({
  store, items, onCheckout,
}: { store: MarketStoreLite; items: CartItem[]; onCheckout: (storeId: string) => void }) {
  const { update, remove } = useCart();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        {store.logoUrl && <img src={store.logoUrl} alt="" className="size-6 rounded-full object-cover" />}
        <span className="font-medium">{store.name}</span>
      </div>
      <div className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-4">
            <div className="relative size-14 rounded-lg overflow-hidden bg-muted shrink-0">
              {it.product.imageUrl && <img src={it.product.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{it.product.name}</p>
              <p className="text-sm text-primary font-semibold">₦{(it.product.price * it.quantity).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
              <button onClick={() => update(it.id, it.quantity - 1)} className="p-1"><Minus className="size-3.5" /></button>
              <span className="w-5 text-center text-sm">{it.quantity}</span>
              <button onClick={() => update(it.id, it.quantity + 1)} className="p-1"><Plus className="size-3.5" /></button>
            </div>
            <button onClick={() => remove(it.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
      <StoreSuggestions storeId={store.id} excludeIds={items.map((i) => i.productId)} />
      <div className="flex items-center justify-between p-4 border-t border-border">
        <div className="text-sm text-muted-foreground">Subtotal <span className="font-semibold text-foreground">₦{subtotal.toLocaleString()}</span></div>
        <Button onClick={() => onCheckout(store.id)}>Checkout this store</Button>
      </div>
    </div>
  );
}
