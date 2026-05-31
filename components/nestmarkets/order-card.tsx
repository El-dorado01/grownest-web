"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { OrderTracking } from "./order-tracking";
import { RateOrderDialog } from "./rate-order-dialog";
import type { MarketOrder } from "@/types/nestmarkets";

export function OrderCard({ order, onChanged }: { order: MarketOrder; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(false);
  const canRate = (order.status === "accepted" || order.status === "delivered") && !order.rating;
  const delivered = order.status === "delivered";

  const accept = async () => {
    setBusy(true);
    const r = await nestMarketsApi.acceptOrder(order.id);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Delivery accepted");
    onChanged();
  };
  const reject = async () => {
    if (reason.trim().length < 5) return toast.error("Please give a reason (min 5 characters)");
    setBusy(true);
    const r = await nestMarketsApi.rejectOrder(order.id, reason.trim());
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Order rejected — an admin will review");
    setRejecting(false);
    onChanged();
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        {order.store.logoUrl && <img src={order.store.logoUrl} alt="" className="size-6 rounded-full object-cover" />}
        <span className="font-medium">{order.store.name}</span>
        <span className="ml-auto text-xs rounded-full bg-muted px-2 py-1 capitalize">{order.status}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {order.items.map((it) => (
          <div key={it.id} className="relative size-12 rounded-lg overflow-hidden bg-muted shrink-0">
            {it.product?.imageUrl && <img src={it.product.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </div>
        ))}
      </div>
      <OrderTracking status={order.trackingStatus} />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total (incl. ₦{order.deliveryFee.toLocaleString()} delivery)</span>
        <span className="font-semibold text-primary">₦{(order.totalAmount + order.deliveryFee).toLocaleString()}</span>
      </div>
      <Link
        href={`/marketplace/chat?order=${order.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors w-full"
      >
        Message seller
      </Link>
      {order.status === "rejected" && order.rejectionReason && (
        <p className="text-xs text-destructive">Rejected: {order.rejectionReason}</p>
      )}
      {delivered && !rejecting && (
        <div className="flex gap-2">
          <Button onClick={accept} disabled={busy} className="flex-1">Accept delivery</Button>
          <Button onClick={() => setRejecting(true)} disabled={busy} variant="outline" className="flex-1">Reject</Button>
        </div>
      )}
      {delivered && rejecting && (
        <div className="space-y-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong? (min 5 characters)" />
          <div className="flex gap-2">
            <Button onClick={reject} disabled={busy} variant="destructive" className="flex-1">Submit rejection</Button>
            <Button onClick={() => setRejecting(false)} variant="ghost" className="flex-1">Cancel</Button>
          </div>
        </div>
      )}
      {canRate && (
        <Button onClick={() => setRating(true)} variant="outline" className="w-full">Rate order</Button>
      )}
      {order.rating && (
        <p className="text-xs text-muted-foreground">You rated this order {order.rating.rating}★</p>
      )}
      <RateOrderDialog orderId={order.id} open={rating} onOpenChange={setRating} onRated={onChanged} />
    </div>
  );
}
