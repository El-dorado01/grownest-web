"use client";

import { Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorCard } from "./vendor-card";
import type { MarketStore } from "@/types/nestmarkets";

export function VendorGrid({
  stores, isLoading, emptyText = "No vendors found",
}: { stores: MarketStore[]; isLoading: boolean; emptyText?: string }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <Skeleton className="h-24 w-full" />
            <div className="p-3 space-y-2"><Skeleton className="size-12 rounded-full" /><Skeleton className="h-4 w-2/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Store className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stores.map((s) => <VendorCard key={s.id} store={s} />)}
    </div>
  );
}
