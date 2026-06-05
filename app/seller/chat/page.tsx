"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChatThreadList } from "@/components/nestmarkets/chat-thread-list";
import { ChatConversation } from "@/components/nestmarkets/chat-conversation";
import { useMyStore } from "@/hooks/use-my-store";
import { useSellerChat } from "@/hooks/use-seller-chat";

function SellerChatPane({ storeId }: { storeId: string }) {
  const params = useSearchParams();
  const { threads, isLoading } = useSellerChat(storeId);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("thread"));
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || selectedId) return;
    const t = params.get("thread");
    if (t) { applied.current = true; setSelectedId(t); }
  }, [params, selectedId]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const buyerName = selected?.buyer.fullName ?? "Buyer";

  return (
    <div className="flex h-[calc(100svh-4rem)]">
      <div className={cn("w-full md:w-80 md:border-r border-border flex flex-col", selectedId && "hidden md:flex")}>
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-semibold">Messages</h1>
          <p className="text-xs text-muted-foreground">Chat with buyers about their orders.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatThreadList threads={threads} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} perspective="seller" />
        </div>
      </div>
      <div className={cn("flex-1 min-w-0", !selectedId && "hidden md:flex md:items-center md:justify-center")}>
        {selectedId ? (
          <ChatConversation threadId={selectedId} title={buyerName} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-muted">
              <MessageSquare className="size-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground">Pick a buyer from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerChatPage() {
  const { store, hasStore, isLoading } = useMyStore();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/seller">Sell</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Messages</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {isLoading ? (
          <div className="p-4 md:p-6"><Skeleton className="h-[60vh] rounded-2xl" /></div>
        ) : !hasStore || !store ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Store className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium">Create a store first</p>
            <p className="text-sm text-muted-foreground mb-4">Buyers can message you once you have a store.</p>
            <Button asChild><Link href="/seller/store">Create your store</Link></Button>
          </div>
        ) : (
          <Suspense fallback={null}>
            <SellerChatPane storeId={store.id} />
          </Suspense>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
