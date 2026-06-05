"use client";

import { AlertTriangle } from "lucide-react";
import type { SellerProduct } from "@/types/seller";

export function LowStockWidget({ products }: { products: SellerProduct[] }) {
  const low = products.filter((p) => p.stockLevel <= 3).slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Low stock</h3>
      </div>
      {low.length === 0 ? (
        <p className="text-sm text-muted-foreground">All products well stocked.</p>
      ) : (
        <ul className="space-y-2">
          {low.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="line-clamp-1">{p.name}</span>
              <span className={p.stockLevel === 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {p.stockLevel === 0 ? "Out" : `${p.stockLevel} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
