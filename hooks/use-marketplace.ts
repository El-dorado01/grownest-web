"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useMarketplace(search: string, category: string, page: number, limit = 12) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["nestmarket-browse", search, category, page, limit],
    () => nestMarketsApi.browse({ search, category, page, limit }),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const products = res?.data?.data ?? [];
  const pagination = res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 };
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c))
  );

  return {
    products,
    pagination,
    categories,
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
