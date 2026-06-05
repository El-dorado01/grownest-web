"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{product.name}</p>
            <p className="text-base font-semibold text-primary">₦{product.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground truncate">{product.stockLevel} in stock{product.category ? ` · ${product.category}` : ""}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="shrink-0 inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 size-3.5" /> Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 size-3.5" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
