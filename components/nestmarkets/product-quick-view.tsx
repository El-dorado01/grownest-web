"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="p-0 overflow-hidden gap-0 w-[calc(100%-2rem)] sm:max-w-2xl sm:grid sm:grid-cols-2">
        <div className="relative aspect-square sm:aspect-auto sm:h-full bg-muted min-h-48">
          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="p-6 flex flex-col gap-3 min-w-0">
          <Link
            href={`/marketplace/store/${product.storeId}`}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-xs text-muted-foreground rounded-full -ml-1 px-1 py-0.5 hover:text-primary transition-colors w-fit max-w-full"
          >
            {product.store.logoUrl && <img src={product.store.logoUrl} alt="" className="size-4 rounded-full object-cover shrink-0" />}
            <span className="truncate font-medium">{product.store.name}</span>
            <Star className="size-3 fill-primary text-primary shrink-0" />
            <span className="shrink-0">{product.store.averageRating?.toFixed(1) ?? "—"}</span>
          </Link>
          <DialogTitle className="text-xl font-semibold tracking-tight">{product.name}</DialogTitle>
          {product.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{product.description}</p>}
          <p className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
          <p className={out ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
            {out ? "Out of stock" : `${product.stockLevel} in stock`}
          </p>
          <div className="flex flex-col gap-3 pt-3 mt-auto sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-3 rounded-full border border-border px-2 py-1 shrink-0">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Minus className="size-4" /></button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stockLevel, q + 1))} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Plus className="size-4" /></button>
            </div>
            <Button onClick={handleAdd} disabled={out || busy} className="flex-1 w-full sm:w-auto">{out ? "Out of stock" : busy ? "Adding…" : "Add to cart"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
