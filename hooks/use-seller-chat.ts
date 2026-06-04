"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { CHAT_THREADS_KEY } from "@/hooks/use-chat";

export function useSellerChat(storeId: string | null) {
  const { data: res, error, isLoading, mutate } = useSWR(
    [CHAT_THREADS_KEY],
    () => nestMarketsApi.getChatThreads(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000, refreshInterval: 5000 }
  );

  const all = res?.data?.data ?? [];
  const threads = storeId ? all.filter((t) => t.storeId === storeId) : [];
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  return { threads, totalUnread, isLoading, error: !!(error || res?.error), mutate };
}
