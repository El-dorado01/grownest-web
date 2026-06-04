import { Clock, Wallet } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function EarningsCards({ store }: { store: SellerStore }) {
  const pending = store.pendingBalance ?? 0;
  const earned = store.totalEarned ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Clock className="size-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Pending</p>
        <p className="text-2xl font-semibold">₦{pending.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Held until buyers confirm delivery.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <Wallet className="size-5 text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Total earned</p>
        <p className="text-2xl font-semibold text-primary">₦{earned.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Paid into your NestPurse wallet.</p>
      </div>
    </div>
  );
}
