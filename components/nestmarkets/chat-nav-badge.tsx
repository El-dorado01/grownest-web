"use client";

import { useChat } from "@/hooks/use-chat";

export function ChatNavBadge() {
  const { totalUnread } = useChat();
  if (totalUnread <= 0) return null;
  return (
    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}
