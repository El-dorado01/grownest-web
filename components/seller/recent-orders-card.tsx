"use client";

import Link from "next/link";
import { AdvanceStatusButton } from "./advance-status-button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

export function RecentOrdersCard({
  orders, onAdvance,
}: { orders: SellerOrder[]; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  const recent = [...orders].slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Recent orders</h2>
        <Link href="/seller/orders" className="text-sm text-primary">View all</Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground p-6 text-center">No orders yet</p>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((o) => (
            <div key={o.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">#{o.id.slice(0, 8)}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{o.status}</span>
                <span className="ml-auto text-sm font-semibold text-primary">₦{o.sellerAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
              <AdvanceStatusButton order={o} onAdvance={onAdvance} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
