"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center"
        >
          <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No orders here</p>
          <p className="text-sm text-muted-foreground">Orders in this stage will show up here.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {visible.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <SellerOrderRow order={o} onAdvance={onAdvance} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
