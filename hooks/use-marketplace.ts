"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useMarketplace(search: string, category: string, page: number, limit = 12) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["nestmarket-browse", search, category, page, limit],
    () => nestMarketsApi.browse({ search, category, page, limit }),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  // Stable category list: derived from an UNFILTERED browse so the chips never
  // collapse when a category is active. Cached separately, fetched once.
  const { data: catRes } = useSWR(
    ["nestmarket-categories"],
    () => nestMarketsApi.browse({ page: 1, limit: 100 }),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const products = res?.data?.data ?? [];
  const pagination = res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 };
  const categories = Array.from(
    new Set((catRes?.data?.data ?? []).map((p) => p.category).filter((c): c is string => !!c))
  ).sort();

  return {
    products,
    pagination,
    categories,
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
