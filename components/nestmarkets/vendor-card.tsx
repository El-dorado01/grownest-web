"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { MarketStore } from "@/types/nestmarkets";

export function VendorCard({ store }: { store: MarketStore }) {
  return (
    <Link href={`/marketplace/store/${store.id}`} className="block rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors">
      <div className="relative h-24 bg-muted">
        {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="p-3 -mt-8">
        <div className="size-12 rounded-full bg-muted border-2 border-card overflow-hidden">
          {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <p className="mt-2 font-medium line-clamp-1">{store.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" />{store.averageRating?.toFixed(1) ?? "—"}</span>
          <span>· {store._count?.products ?? 0} products</span>
          {typeof store.distance === "number" && (
            <span className="flex items-center gap-1"><MapPin className="size-3" />{store.distance.toFixed(1)} km</span>
          )}
        </div>
      </div>
    </Link>
  );
}
