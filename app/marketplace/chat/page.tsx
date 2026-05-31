"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatThreadList } from "@/components/nestmarkets/chat-thread-list";
import { ChatConversation } from "@/components/nestmarkets/chat-conversation";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useChat } from "@/hooks/use-chat";

function ChatPane() {
  const params = useSearchParams();
  const { threads, isLoading } = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep link: ?thread=<id> or ?order=<id>
  useEffect(() => {
    if (selectedId) return;
    const threadParam = params.get("thread");
    const orderParam = params.get("order");
    if (threadParam) { setSelectedId(threadParam); return; }
    if (orderParam && threads.length) {
      const match = threads.find((t) => t.order?.id === orderParam);
      if (match) setSelectedId(match.id);
    }
  }, [params, threads, selectedId]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100svh-4rem)]">
      {/* Thread list — full width on mobile when nothing selected; fixed column on desktop */}
      <div className={cn("w-full md:w-80 md:border-r border-border overflow-y-auto", selectedId && "hidden md:block")}>
        <ChatThreadList threads={threads} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      {/* Conversation */}
      <div className={cn("flex-1 min-w-0", !selectedId && "hidden md:flex md:items-center md:justify-center")}>
        {selectedId ? (
          <ChatConversation threadId={selectedId} storeName={selected?.store.name} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="text-center text-muted-foreground">
            <MessageSquare className="size-10 mx-auto mb-2" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Chat</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <Suspense fallback={null}>
          <ChatPane />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
