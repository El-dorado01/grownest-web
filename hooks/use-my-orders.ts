"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useMyOrders(page = 1, limit = 10) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["nestmarket-orders", page, limit],
    () => nestMarketsApi.myOrders(page, limit),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    orders: res?.data?.data ?? [],
    pagination: res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 },
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
