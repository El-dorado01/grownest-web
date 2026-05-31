"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export const CHAT_THREADS_KEY = "nestmarket-chat-threads";

export function useChat() {
  const { data: res, error, isLoading, mutate } = useSWR(
    [CHAT_THREADS_KEY],
    () => nestMarketsApi.getChatThreads(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000, refreshInterval: 5000 }
  );

  const threads = res?.data?.data ?? [];
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  return {
    threads,
    totalUnread,
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
