"use client";

import { useState } from "react";
import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useVendor(id: string) {
  const store = useSWR(
    id ? ["nestmarket-store", id] : null,
    () => nestMarketsApi.getStore(id),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const [reviewsPage, setReviewsPage] = useState(1);
  const reviews = useSWR(
    id ? ["nestmarket-store-reviews", id, reviewsPage] : null,
    () => nestMarketsApi.getStoreReviews(id, reviewsPage),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    store: store.data?.data?.data ?? null,
    products: store.data?.data?.data?.products ?? [],
    isLoading: store.isLoading,
    error: !!(store.error || store.data?.error),
    mutateStore: store.mutate,
    reviews: reviews.data?.data?.data ?? [],
    reviewsPagination: reviews.data?.data?.pagination ?? { total: 0, page: 1, limit: 10, pages: 1 },
    reviewsLoading: reviews.isLoading,
    reviewsPage,
    setReviewsPage,
    mutateReviews: reviews.mutate,
  };
}
