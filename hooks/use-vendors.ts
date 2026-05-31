"use client";

import { useState } from "react";
import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useVendors() {
  const topRated = useSWR(["nestmarket-top-rated"], () => nestMarketsApi.topRated(12), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });
  const all = useSWR(["nestmarket-stores"], () => nestMarketsApi.getStores(), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });
  const followed = useSWR(["nestmarket-followed"], () => nestMarketsApi.getFollowedStores(), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const nearby = useSWR(
    coords ? ["nestmarket-nearby", coords.lat, coords.lon] : null,
    () => nestMarketsApi.nearby(coords!.lat, coords!.lon),
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  const followedIds = new Set((followed.data?.data?.data ?? []).map((s) => s.id));

  return {
    topRated: topRated.data?.data?.data ?? [],
    topRatedLoading: topRated.isLoading,
    allStores: all.data?.data?.data ?? [],
    allLoading: all.isLoading,
    followedIds,
    nearby: nearby.data?.data?.data ?? [],
    nearbyLoading: !!coords && nearby.isLoading,
    setCoords,
    hasNearby: !!coords,
  };
}
