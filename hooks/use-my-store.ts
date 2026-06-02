"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";
import type { SellerStore } from "@/types/seller";

export const SELLER_STORE_KEY = "seller-store";

export function useMyStore() {
  const { data: res, error, isLoading, mutate } = useSWR(
    [SELLER_STORE_KEY],
    () => sellerApi.getMyStore(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000, shouldRetryOnError: false }
  );

  // 404 means "no store yet" — a normal state, not an error.
  const noStore = res?.status === 404;
  const store: SellerStore | null = res?.data?.data ?? null;
  const realError = !!(error || (res?.error && !noStore));

  return {
    store,
    hasStore: !!store,
    isLoading,
    error: realError,
    mutate,
  };
}
