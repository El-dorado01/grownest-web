"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatThreadList } from "@/components/nestmarkets/chat-thread-list";
import { ChatConversation } from "@/components/nestmarkets/chat-conversation";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useChat } from "@/hooks/use-chat";
import { DashboardHeader } from "@/components/dashboard-header";

function ChatPane() {
  const params = useSearchParams();
  const { threads, isLoading } = useChat();
  // Initialise directly from ?thread=<id> so we avoid a setState-in-effect.
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("thread"));

  // Deep link via ?order=<id> needs the fetched threads to resolve, so it runs
  // in an effect once the list arrives. Latched so it applies only once —
  // otherwise tapping mobile back (which nulls selectedId) would re-select it.
  const appliedOrderDeepLink = useRef(false);
  useEffect(() => {
    if (appliedOrderDeepLink.current || selectedId) return;
    const orderParam = params.get("order");
    if (!orderParam || !threads.length) return;
    const match = threads.find((t) => t.order?.id === orderParam);
    if (match) {
      appliedOrderDeepLink.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(match.id);
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
        <DashboardHeader rightActions={<CartBadge />}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Chat</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>
        <Suspense fallback={null}>
          <ChatPane />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
