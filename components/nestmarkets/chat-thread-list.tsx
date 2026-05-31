"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import type { ChatThreadSummary } from "@/types/nestmarkets";

export function ChatThreadList({
  threads, isLoading, selectedId, onSelect,
}: {
  threads: ChatThreadSummary[]; isLoading: boolean; selectedId: string | null; onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return <div className="space-y-2 p-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <MessageSquare className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {threads.map((t) => {
        const last = t.messages[0];
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "w-full text-left flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors",
              selectedId === t.id && "bg-muted"
            )}
          >
            <div className="size-10 rounded-full bg-muted overflow-hidden shrink-0">
              {t.store.logoUrl && <img src={t.store.logoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{t.store.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{last?.content ?? "No messages yet"}</p>
            </div>
            {t.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shrink-0">
                {t.unreadCount > 99 ? "99+" : t.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
