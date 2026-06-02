"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";

export const SELLER_PRODUCTS_KEY = "seller-products";

export function useMyProducts(enabled: boolean) {
  const { data: res, error, isLoading, mutate } = useSWR(
    enabled ? [SELLER_PRODUCTS_KEY] : null,
    () => sellerApi.getMyProducts(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    products: res?.data?.data ?? [],
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
