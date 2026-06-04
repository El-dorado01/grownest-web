"use client";

import useSWR from "swr";
import { nestPurseApi } from "@/lib/nestpurse-api";

export function usePayouts(limit = 50) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["seller-payouts", limit],
    () => nestPurseApi.getTransactions({ limit }),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const payouts = (res?.data?.transactions ?? []).filter((t) => t.method === "market_sale");

  return { payouts, isLoading, error: !!(error || res?.error), mutate };
}
