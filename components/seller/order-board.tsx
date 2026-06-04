"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusTabs, type OrderTabKey } from "./order-status-tabs";
import { SellerOrderRow } from "./seller-order-row";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

function tabOf(o: SellerOrder): OrderTabKey {
  if (o.status === "accepted") return "completed";
  if (o.status === "rejected") return "rejected";
  if (o.status === "delivered" || o.trackingStatus === "delivered") return "delivered";
  if (o.trackingStatus === "packaged") return "packaged";
  if (o.trackingStatus === "on_the_way") return "on_the_way";
  return "new"; // paid + received
}

export function OrderBoard({
  orders, isLoading, onAdvance,
}: {
  orders: SellerOrder[]; isLoading: boolean;
  onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }>;
}) {
  const [active, setActive] = useState<OrderTabKey>("new");

  const counts = useMemo(() => {
    const c: Record<OrderTabKey, number> = { new: 0, packaged: 0, on_the_way: 0, delivered: 0, completed: 0, rejected: 0 };
    orders.forEach((o) => { c[tabOf(o)] += 1; });
    return c;
  }, [orders]);

  const visible = orders.filter((o) => tabOf(o) === active);

  return (
    <div className="space-y-4">
      <OrderStatusTabs active={active} counts={counts} onChange={setActive} />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No orders here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => <SellerOrderRow key={o.id} order={o} onAdvance={onAdvance} />)}
        </div>
      )}
    </div>
  );
}
