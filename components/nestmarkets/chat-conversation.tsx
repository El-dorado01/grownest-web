"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatThread } from "@/hooks/use-chat-thread";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatOrderContext } from "./chat-order-context";
import { ChatComposer } from "./chat-composer";

export function ChatConversation({
  threadId, storeName, onBack,
}: { threadId: string; storeName?: string; onBack?: () => void }) {
  const { thread, messages, isLoading, send, markRead } = useChatThread(threadId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark read whenever a thread opens
  useEffect(() => {
    if (threadId) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Auto-scroll to newest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    const r = await send(text);
    if (r.error) toast.error(r.error);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-border p-3">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1"><ArrowLeft className="size-5" /></button>
        )}
        <span className="font-medium">{thread?.store?.name ?? storeName ?? "Chat"}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {thread?.order && <ChatOrderContext order={thread.order} />}
        {isLoading && messages.length === 0 ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-2/3 rounded-2xl" />)}</div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>
      <ChatComposer onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
