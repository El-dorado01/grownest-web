"use client";

import { AdvanceStatusButton } from "./advance-status-button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

function addressLine(snap: Record<string, unknown> | null): string {
  if (!snap) return "No address";
  const city = (snap.city as string) || "";
  const state = (snap.state as string) || "";
  const name = (snap.fullName as string) || "";
  return [name, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No address";
}

export function SellerOrderRow({
  order, onAdvance,
}: { order: SellerOrder; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">#{order.id.slice(0, 8)}</span>
        <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{order.status}</span>
        <span className="ml-auto text-sm font-semibold text-primary">₦{order.sellerAmount.toLocaleString()}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 shrink-0 rounded-lg border border-border px-2 py-1">
            <div className="size-8 rounded bg-muted overflow-hidden">
              {it.product?.imageUrl && <img src={it.product.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="text-xs">{it.product?.name ?? "Item"} ×{it.quantity}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{addressLine(order.addressSnapshot)}</span>
        <AdvanceStatusButton order={order} onAdvance={onAdvance} />
      </div>
    </div>
  );
}
