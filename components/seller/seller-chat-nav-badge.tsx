"use client";

import { useMyStore } from "@/hooks/use-my-store";
import { useSellerChat } from "@/hooks/use-seller-chat";

export function SellerChatNavBadge() {
  const { store } = useMyStore();
  const { totalUnread } = useSellerChat(store?.id ?? null);
  if (totalUnread <= 0) return null;
  return (
    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}
