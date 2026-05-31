"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { CHAT_THREADS_KEY } from "./use-chat";
import type { ChatMessage } from "@/types/nestmarkets";

export function useChatThread(id: string | null) {
  const { data: res, error, isLoading, mutate } = useSWR(
    id ? ["nestmarket-chat-thread", id] : null,
    () => nestMarketsApi.getChatThread(id!),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000, refreshInterval: 5000 }
  );

  const thread = res?.data?.data ?? null;
  const messages = thread?.messages ?? [];

  const send = async (content: string) => {
    if (!id) return { error: "No thread" };
    // optimistic append (isSender hardcoded true; server recomputes on revalidate)
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      threadId: id,
      senderId: "me",
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { fullName: null, profilePhoto: null },
      isSender: true,
    };
    await mutate(
      (cur) =>
        cur?.data?.data
          ? { ...cur, data: { ...cur.data, data: { ...cur.data.data, messages: [...cur.data.data.messages, optimistic] } } }
          : cur,
      { revalidate: false }
    );
    const r = await nestMarketsApi.sendChatMessage(id, content);
    if (r.error || !r.data?.success) {
      await mutate(); // roll back to server truth
      return { error: r.data?.message || r.error || "Failed to send" };
    }
    await mutate();
    globalMutate([CHAT_THREADS_KEY]); // refresh list preview/order
    return {};
  };

  const markRead = async () => {
    if (!id) return;
    await nestMarketsApi.markThreadRead(id);
    globalMutate([CHAT_THREADS_KEY]); // clear unread badge
  };

  return {
    thread,
    messages,
    isLoading,
    error: !!(error || res?.error),
    send,
    markRead,
    mutate,
  };
}
