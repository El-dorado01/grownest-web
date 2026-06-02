"use client";

import { PackagePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SellerProductCard } from "./seller-product-card";
import type { SellerProduct } from "@/types/seller";

export function SellerProductGrid({
  products, isLoading, onAdd, onEdit, onDelete,
}: {
  products: SellerProduct[]; isLoading: boolean;
  onAdd: () => void; onEdit: (p: SellerProduct) => void; onDelete: (p: SellerProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackagePlus className="size-8 text-muted-foreground mb-2" />
        <p className="font-medium">No products yet</p>
        <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling.</p>
        <Button onClick={onAdd}>Add product</Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <SellerProductCard key={p.id} product={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
      ))}
    </div>
  );
}
