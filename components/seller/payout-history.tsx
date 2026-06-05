"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayouts } from "@/hooks/use-payouts";

export function PayoutHistory() {
  const { payouts, isLoading } = usePayouts();

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted">
          <Receipt className="size-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No payouts yet</p>
        <p className="text-sm text-muted-foreground">Payouts land here once buyers confirm delivery.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
      {payouts.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="flex items-center gap-3 p-4"
        >
          <div className="grid size-9 place-items-center rounded-full bg-primary/10 shrink-0">
            <Receipt className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium line-clamp-1">{p.narration || "Marketplace payout"}</p>
            <p className="text-xs text-muted-foreground">{p.date ? format(new Date(p.date), "d MMM yyyy, h:mma") : ""}</p>
          </div>
          <span className="text-sm font-semibold text-primary shrink-0">+₦{p.amount.toLocaleString()}</span>
        </motion.div>
      ))}
    </div>
  );
}
