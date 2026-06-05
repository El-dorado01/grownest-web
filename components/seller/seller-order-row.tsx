"use client";

import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { AdvanceStatusButton } from "./advance-status-button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

function buyerName(snap: Record<string, unknown> | null): string {
  return (snap?.fullName as string) || "Buyer";
}

function addressLine(snap: Record<string, unknown> | null): string {
  if (!snap) return "No delivery address";
  const street = (snap.street as string) || (snap.address as string) || "";
  const city = (snap.city as string) || "";
  const state = (snap.state as string) || "";
  return [street, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(", ") || "No delivery address";
}

function statusPillClass(order: SellerOrder): string {
  if (order.status === "accepted") return "bg-primary/10 text-primary";
  if (order.status === "rejected") return "text-destructive bg-destructive/10";
  return "bg-muted text-muted-foreground";
}

export function SellerOrderRow({
  order, onAdvance,
}: { order: SellerOrder; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      {/* Header: id + buyer + status + payout */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">#{order.id.slice(0, 8)}</span>
            <span className={`text-[11px] rounded-full px-2 py-0.5 capitalize font-medium ${statusPillClass(order)}`}>
              {order.status === "paid" ? order.trackingStatus.replace(/_/g, " ") : order.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium truncate">{buyerName(order.addressSnapshot)}</p>
          <p className="text-xs text-muted-foreground">
            {order.createdAt ? format(new Date(order.createdAt), "d MMM yyyy, h:mma") : ""} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-semibold text-primary">₦{order.sellerAmount.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">your payout</p>
        </div>
      </div>

      {/* Items */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 shrink-0 rounded-lg border border-border bg-muted/30 px-2 py-1">
            <div className="size-9 rounded-md bg-muted overflow-hidden shrink-0">
              {it.product?.imageUrl && <img src={it.product.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium line-clamp-1 max-w-[10rem]">{it.product?.name ?? "Item"}</p>
              <p className="text-[11px] text-muted-foreground">×{it.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 mt-0.5" />
        <span className="line-clamp-2">{addressLine(order.addressSnapshot)}</span>
      </div>

      {/* Action */}
      <div className="pt-1">
        <AdvanceStatusButton order={order} onAdvance={onAdvance} fullWidth />
      </div>
    </div>
  );
}
