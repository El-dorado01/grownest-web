"use client";

import { useState } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductQuickView({
  product, open, onOpenChange,
}: { product: MarketProduct | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  if (!product) return null;
  const out = product.stockLevel <= 0;

  const handleAdd = async () => {
    setBusy(true);
    const r = await add(product.id, qty);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Added to cart");
    onOpenChange(false);
    setQty(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.store.logoUrl && <img src={product.store.logoUrl} alt="" className="size-4 rounded-full object-cover" />}
            <span>{product.store.name}</span>
            <Star className="size-3 fill-primary text-primary" />
            <span>{product.store.averageRating?.toFixed(1) ?? "—"}</span>
          </div>
          <h2 className="text-lg font-semibold">{product.name}</h2>
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <p className="text-xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{out ? "Out of stock" : `${product.stockLevel} in stock`}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1"><Minus className="size-4" /></button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stockLevel, q + 1))} className="p-1"><Plus className="size-4" /></button>
            </div>
            <Button onClick={handleAdd} disabled={out || busy}>{out ? "Out of stock" : "Add to cart"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
