"use client";

import { TrendingUp } from "lucide-react";
import type { SellerOrder, SellerProduct } from "@/types/seller";

export function TopProductsWidget({
  orders, products,
}: { orders: SellerOrder[]; products: SellerProduct[] }) {
  // Rank by units sold across order items.
  const counts = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((it) => {
    counts.set(it.productId, (counts.get(it.productId) ?? 0) + it.quantity);
  }));
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name ?? "Product", qty }));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Top products</h3>
      </div>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <ul className="space-y-2">
          {ranked.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="line-clamp-1">{i + 1}. {r.name}</span>
              <span className="text-muted-foreground">{r.qty} sold</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
