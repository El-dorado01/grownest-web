"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorGrid } from "./vendor-grid";
import type { MarketStore } from "@/types/nestmarkets";

export function NearbySection({
  stores, loading, hasNearby, onLocate,
}: {
  stores: MarketStore[]; loading: boolean; hasNearby: boolean;
  onLocate: (lat: number, lon: number) => void;
}) {
  const [geoState, setGeoState] = useState<"idle" | "asking" | "denied">("idle");

  const locate = () => {
    if (!("geolocation" in navigator)) { setGeoState("denied"); return; }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeoState("idle"); onLocate(pos.coords.latitude, pos.coords.longitude); },
      () => setGeoState("denied"),
      { timeout: 10000 }
    );
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Nearby</h2>
      {!hasNearby ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center flex flex-col items-center">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <MapPin className="size-5" />
          </div>
          {geoState === "denied" ? (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">We couldn’t get your location. Allow location access to see nearby stores.</p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">Find verified stores closest to you.</p>
          )}
          <Button onClick={locate} disabled={geoState === "asking"}>
            {geoState === "asking" ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            Find stores near me
          </Button>
        </div>
      ) : (
        <VendorGrid stores={stores} isLoading={loading} emptyText="No stores near you yet" />
      )}
    </section>
  );
}
