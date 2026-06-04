"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

const NEXT: Record<string, { next: TrackingStatus; label: string } | null> = {
  received: { next: "packaged", label: "Mark packaged" },
  packaged: { next: "on_the_way", label: "Mark on the way" },
  on_the_way: { next: "delivered", label: "Mark delivered" },
  delivered: null,
};

export function AdvanceStatusButton({
  order, onAdvance,
}: { order: SellerOrder; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  const [busy, setBusy] = useState(false);

  // Terminal buyer-side states: nothing for the seller to do.
  if (order.status === "accepted") return <span className="text-xs text-primary">Completed · paid out</span>;
  if (order.status === "rejected") return <span className="text-xs text-destructive">Rejected by buyer</span>;
  if (order.trackingStatus === "delivered") return <span className="text-xs text-muted-foreground">Awaiting buyer confirmation</span>;

  const step = NEXT[order.trackingStatus];
  if (!step) return null;

  const go = async () => {
    setBusy(true);
    const r = await onAdvance(order.id, step.next);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success(step.label.replace("Mark", "Marked"));
  };

  return <Button size="sm" onClick={go} disabled={busy}>{step.label}</Button>;
}
