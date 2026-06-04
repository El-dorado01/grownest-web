"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";
import type { TrackingStatus } from "@/types/seller";

export function useSellerOrders(storeId: string | null, page = 1, limit = 50) {
  const { data: res, error, isLoading, mutate } = useSWR(
    storeId ? ["seller-orders", storeId, page, limit] : null,
    () => sellerApi.getStoreTransactions(storeId!, page, limit),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const orders = res?.data?.data ?? [];
  const pagination = res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 };

  const advance = async (orderId: string, next: TrackingStatus) => {
    // optimistic: update the order's trackingStatus (and status if delivered) in cache
    await mutate(
      (cur) =>
        cur?.data?.data
          ? {
              ...cur,
              data: {
                ...cur.data,
                data: cur.data.data.map((o) =>
                  o.id === orderId
                    ? { ...o, trackingStatus: next, status: next === "delivered" ? "delivered" : o.status }
                    : o
                ),
              },
            }
          : cur,
      { revalidate: false }
    );
    const r = await sellerApi.updateTracking(orderId, next);
    if (r.error || !r.data?.success) {
      await mutate(); // rollback to server truth
      return { error: r.error || "Could not update order" };
    }
    await mutate();
    return {};
  };

  return { orders, pagination, isLoading, error: !!(error || res?.error), advance, mutate };
}
