"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { MarketStore } from "@/types/nestmarkets";

export function VendorCard({ store }: { store: MarketStore }) {
  return (
    <Link href={`/marketplace/store/${store.id}`} className="group block rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all">
      <div className="relative h-24 rounded-t-2xl bg-muted overflow-hidden">
        {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="p-3 -mt-8">
        <div className="size-14 rounded-full bg-muted ring-4 ring-card overflow-hidden shadow-sm">
          {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <p className="mt-2 font-medium line-clamp-1">{store.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1 text-foreground"><Star className="size-3 fill-primary text-primary" />{store.averageRating?.toFixed(1) ?? "—"}</span>
          <span>· {store._count?.products ?? 0} products</span>
          {typeof store._count?.followers === "number" && <span>· {store._count.followers} followers</span>}
          {typeof store.distance === "number" && (
            <span className="flex items-center gap-1"><MapPin className="size-3" />{store.distance.toFixed(1)} km</span>
          )}
        </div>
        <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-medium py-2 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          Visit Store
        </span>
      </div>
    </Link>
  );
}
