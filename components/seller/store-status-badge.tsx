import { cn } from "@/lib/utils";
import type { SellerStore } from "@/types/seller";

export function StoreStatusBadge({ store }: { store: SellerStore }) {
  const verified = store.isVerified && store.status === "active";
  const label = verified ? "Verified" : store.verificationRequestedAt ? "Pending review" : "Unverified";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
        verified
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-muted text-muted-foreground border-border"
      )}
    >
      {label}
    </span>
  );
}
