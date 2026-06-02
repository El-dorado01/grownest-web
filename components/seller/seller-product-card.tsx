"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { SellerProduct } from "@/types/seller";

export function SellerProductCard({
  product, onEdit, onDelete,
}: { product: SellerProduct; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {product.imageUrl && <img src={product.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {product.stockLevel <= 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">Out of stock</span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
        <p className="text-base font-semibold text-primary">₦{product.price.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{product.stockLevel} in stock{product.category ? ` · ${product.category}` : ""}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs hover:bg-muted transition-colors"><Pencil className="size-3.5" /> Edit</button>
          <button onClick={onDelete} className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
