"use client";

import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayouts } from "@/hooks/use-payouts";

export function PayoutHistory() {
  const { payouts, isLoading } = usePayouts();

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  if (payouts.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No payouts yet</p>;

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {payouts.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-1">{p.narration || "Marketplace payout"}</p>
            <p className="text-xs text-muted-foreground">{p.date ? format(new Date(p.date), "d MMM yyyy, h:mma") : ""}</p>
          </div>
          <span className="text-sm font-semibold text-primary">+₦{p.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
