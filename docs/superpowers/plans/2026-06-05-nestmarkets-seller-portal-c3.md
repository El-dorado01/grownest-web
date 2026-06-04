# NestMarkets Seller Portal C3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seller chat inbox (`/seller/chat`) and a real seller dashboard (`/seller`), reusing the existing chat backend/components and already-fetched data.

**Architecture:** Frontend-only. Seller chat reuses the buyer chat backend (`GET /chat/threads` already returns seller-owned threads; `isSender` is computed server-side) and the existing chat components, made perspective-aware with a backward-compatible prop. Dashboard computes stat cards from `useMyStore` + `useSellerOrders` (no new fetches). Pattern: `hooks → components → app/seller/*`, gold tokens, on `main`.

**Tech Stack:** Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, Sonner, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck** + manual; final task `lint` + `build`. All commits to **`main`** (no feature branch — user preference).

**Reference spec:** `docs/superpowers/specs/2026-06-05-nestmarkets-seller-portal-c3-design.md`

**Key facts (verified against code):**
- `hooks/use-chat.ts`: `useChat()` → `{ threads, totalUnread, isLoading, error, mutate }`; SWR key `CHAT_THREADS_KEY = "nestmarket-chat-threads"`, `refreshInterval: 5000`. `threads = res?.data?.data ?? []`.
- `hooks/use-chat-thread.ts`: `useChatThread(id)` → `{ thread, messages, isLoading, error, send, markRead, mutate }`. Works for either party.
- `nestMarketsApi.getChatThreads()` (in `lib/nestmarkets-api.ts`) → `ChatThreadsResponse`. `ChatThreadSummary` (in `types/nestmarkets.ts`) has: `id, orderId, buyerId, storeId, updatedAt, store:{name,logoUrl,ownerId}, buyer:{fullName,profilePhoto}, order:{id,status}|null, messages: ChatLastMessage[], unreadCount`.
- `components/nestmarkets/chat-thread-list.tsx` — `ChatThreadList({ threads, isLoading, selectedId, onSelect })`; renders `t.store.name`/`t.store.logoUrl`. **Single caller:** `app/marketplace/chat/page.tsx`.
- `components/nestmarkets/chat-conversation.tsx` — `ChatConversation({ threadId, storeName?, onBack? })`; header shows `thread?.store?.name ?? storeName ?? "Chat"`. **Single caller:** `app/marketplace/chat/page.tsx`.
- `app/marketplace/chat/page.tsx` — two-pane pattern: `Suspense` wrapping a `ChatPane` that uses `useSearchParams`, `useChat()`, `selectedId` state, `cn`-based show/hide for mobile master-detail.
- `hooks/use-my-store.ts`: `useMyStore()` → `{ store, hasStore, isLoading, error, mutate }`; `store.id`, `store.totalEarned?`, `store.pendingBalance?`, `store._count?.products`, `store.averageRating`, `store.ratingCount`, `store.logoUrl`, `store.name`.
- `hooks/use-seller-orders.ts`: `useSellerOrders(storeId | null, page?, limit?)` → `{ orders, pagination, isLoading, error, advance, mutate }`. `SellerOrder` has `id, totalAmount, sellerAmount, status, trackingStatus, createdAt, items`.
- `components/seller/store-status-badge.tsx` exports `StoreStatusBadge`. Current `/seller` page body: store header card + two quick-link cards (Store, Products).
- Sidebar group "Sell on NestMarket" in `components/app-sidebar.tsx` `navMain`: items Dashboard, My Store, Products, Orders, Earnings. `nav-main.tsx` sub-items support optional `badge?: React.ReactNode`.
- Existing seller chat-nav-badge pattern: `components/nestmarkets/chat-nav-badge.tsx` (`ChatNavBadge`, uses `useChat().totalUnread`). Use it as the template for the seller variant.
- Frontend repo `c:\Users\ambal\Desktop\Gigs\grownest-web`, branch **main**.

---

## Task 1: Make chat components perspective-aware (backward-compatible)

**Files:**
- Modify: `components/nestmarkets/chat-thread-list.tsx`
- Modify: `components/nestmarkets/chat-conversation.tsx`

- [ ] **Step 1: Add `perspective` to `ChatThreadList`**

Replace the `ChatThreadList` signature + the row's avatar/name block so it can render the buyer side. Full updated file:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import type { ChatThreadSummary } from "@/types/nestmarkets";

export function ChatThreadList({
  threads, isLoading, selectedId, onSelect, perspective = "buyer",
}: {
  threads: ChatThreadSummary[]; isLoading: boolean; selectedId: string | null;
  onSelect: (id: string) => void; perspective?: "buyer" | "seller";
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
        const name = perspective === "seller" ? (t.buyer.fullName ?? "Buyer") : t.store.name;
        const avatar = perspective === "seller" ? t.buyer.profilePhoto : t.store.logoUrl;
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
              {avatar && <img src={avatar} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{name}</p>
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
```

- [ ] **Step 2: Add a `title` override to `ChatConversation`**

In `components/nestmarkets/chat-conversation.tsx`, change the signature to accept an optional `title` and prefer it in the header. Replace the function signature line and the header line:

Signature:
```tsx
export function ChatConversation({
  threadId, storeName, title, onBack,
}: { threadId: string; storeName?: string; title?: string; onBack?: () => void }) {
```

Header line (replace the existing `<span className="font-medium">...`):
```tsx
        <span className="font-medium">{title ?? thread?.store?.name ?? storeName ?? "Chat"}</span>
```

(Buyer page keeps passing `storeName` — unchanged behavior. Seller page passes `title`.)

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors (buyer chat page still compiles — new props are optional).

```bash
git add components/nestmarkets/chat-thread-list.tsx components/nestmarkets/chat-conversation.tsx
git commit -m "feat(nestmarkets): perspective-aware chat thread list + conversation title override"
```

---

## Task 2: Seller chat hook

**Files:**
- Create: `hooks/use-seller-chat.ts`

- [ ] **Step 1: Create `hooks/use-seller-chat.ts`** (reuse threads SWR, filter to this store)

```typescript
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
```

> Note: shares the `[CHAT_THREADS_KEY]` SWR cache with `useChat` (buyer) — SWR dedupes; both get the same fetched set and filter differently. That's intended.

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-seller-chat.ts
git commit -m "feat(seller): use-seller-chat hook (store-filtered threads)"
```

---

## Task 3: Seller chat page

**Files:**
- Create: `app/seller/chat/page.tsx`

- [ ] **Step 1: Create `app/seller/chat/page.tsx`**

Mirror `app/marketplace/chat/page.tsx` (READ it first for the exact Suspense + two-pane structure), but seller-flavored.

```tsx
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
      <div className={cn("w-full md:w-80 md:border-r border-border overflow-y-auto", selectedId && "hidden md:block")}>
        <ChatThreadList threads={threads} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} perspective="seller" />
      </div>
      <div className={cn("flex-1 min-w-0", !selectedId && "hidden md:flex md:items-center md:justify-center")}>
        {selectedId ? (
          <ChatConversation threadId={selectedId} title={buyerName} onBack={() => setSelectedId(null)} />
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
```

> NOTE: `useSearchParams` must be inside a `<Suspense>` boundary (Next 15). `SellerChatPane` (which calls it) is rendered inside `<Suspense>` — correct. The outer page reads `useMyStore` (no search params) so it's fine outside Suspense.

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add "app/seller/chat/page.tsx"
git commit -m "feat(seller): chat inbox page (two-pane, seller perspective)"
```

---

## Task 4: Seller chat nav badge + sidebar Messages entry

**Files:**
- Create: `components/seller/seller-chat-nav-badge.tsx`
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: `components/seller/seller-chat-nav-badge.tsx`**

```tsx
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
```

- [ ] **Step 2: Add "Messages" to the "Sell on NestMarket" group**

In `components/app-sidebar.tsx`, add the import near the other component imports:
```tsx
import { SellerChatNavBadge } from "@/components/nestmarkets/../seller/seller-chat-nav-badge"
```
(Use the clean path `@/components/seller/seller-chat-nav-badge`.)

Then in the "Sell on NestMarket" group's `items` array, add after "Earnings":
```tsx
        {
          title: "Messages",
          url: "/seller/chat",
          badge: <SellerChatNavBadge />,
        },
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/seller-chat-nav-badge.tsx components/app-sidebar.tsx
git commit -m "feat(seller): Messages sidebar entry with unread badge"
```

---

## Task 5: Dashboard stats component

**Files:**
- Create: `components/seller/dashboard-stats.tsx`

- [ ] **Step 1: Create `components/seller/dashboard-stats.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Wallet, Clock, ShoppingBag, CheckCircle2, Package, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SellerStore, SellerOrder } from "@/types/seller";

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={accent ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className={`text-xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

export function DashboardStats({
  store, orders, ordersLoading,
}: { store: SellerStore; orders: SellerOrder[]; ordersLoading: boolean }) {
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === "accepted").length;
  const active = orders.filter((o) => o.status !== "accepted" && o.status !== "rejected").length;
  const recent = [...orders].slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Wallet className="size-5" />} label="Total earned" value={`₦${(store.totalEarned ?? 0).toLocaleString()}`} accent />
        <StatCard icon={<Clock className="size-5" />} label="Pending" value={`₦${(store.pendingBalance ?? 0).toLocaleString()}`} />
        <StatCard icon={<ShoppingBag className="size-5" />} label="Total orders" value={ordersLoading ? "—" : String(totalOrders)} />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Completed" value={ordersLoading ? "—" : String(completed)} />
        <StatCard icon={<Package className="size-5" />} label="Active orders" value={ordersLoading ? "—" : String(active)} />
        <StatCard icon={<Star className="size-5" />} label="Rating" value={`${store.averageRating?.toFixed(1) ?? "—"} (${store.ratingCount})`} />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/seller/orders" className="text-sm text-primary">View all</Link>
        </div>
        {ordersLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">No orders yet</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((o) => (
              <Link key={o.id} href="/seller/orders" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.status} · {o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
                </div>
                <span className="text-sm font-semibold text-primary">₦{o.sellerAmount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/dashboard-stats.tsx
git commit -m "feat(seller): dashboard stats component (cards + recent orders)"
```

---

## Task 6: Wire dashboard into /seller landing

**Files:**
- Modify: `app/seller/page.tsx`

- [ ] **Step 1: Replace the has-store body with header + stats + quick links**

Edit `app/seller/page.tsx`: add imports and use `useSellerOrders` + `DashboardStats`. Add to imports:
```tsx
import { MessageSquare, ShoppingBag, Wallet } from "lucide-react";
import { DashboardStats } from "@/components/seller/dashboard-stats";
import { useSellerOrders } from "@/hooks/use-seller-orders";
```
(Keep existing `Store, Package, ShieldCheck` imports.)

Change the component body to also load orders. Replace the `const { store, hasStore, isLoading } = useMyStore();` line with:
```tsx
  const { store, hasStore, isLoading } = useMyStore();
  const { orders, isLoading: ordersLoading } = useSellerOrders(store?.id ?? null);
```

Then replace the entire has-store branch (the `<div className="max-w-2xl space-y-4">...</div>`) with:
```tsx
            <div className="max-w-3xl space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-muted overflow-hidden">
                    {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold truncate">{store.name}</h1>
                      <StoreStatusBadge store={store} />
                    </div>
                    <p className="text-xs text-muted-foreground">{store._count?.products ?? 0} products · ⭐ {store.averageRating?.toFixed(1) ?? "—"} ({store.ratingCount})</p>
                  </div>
                </div>
              </div>

              <DashboardStats store={store} orders={orders} ordersLoading={ordersLoading} />

              <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/seller/store" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <ShieldCheck className="size-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Store & verification</p>
                </Link>
                <Link href="/seller/products" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <Package className="size-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Products</p>
                </Link>
                <Link href="/seller/orders" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <ShoppingBag className="size-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Orders</p>
                </Link>
                <Link href="/seller/earnings" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <Wallet className="size-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Earnings</p>
                </Link>
                <Link href="/seller/chat" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <MessageSquare className="size-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Messages</p>
                </Link>
              </div>
            </div>
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add "app/seller/page.tsx"
git commit -m "feat(seller): dashboard landing with stats + recent orders + quick links"
```

---

## Task 7: Mock fixtures for seller chat

**Files:**
- Modify: `lib/dev-mock.ts`

> Gated on `NEXT_PUBLIC_MOCK=1`. The seller order/earnings fixtures + seeded `myStore` (id `"my-st"`) already exist from C2. The existing chat mock (`threadSummaries`, `threadMsgs`, `threadDetail`) is buyer-oriented (storeId `st-1`/`st-2`). Add seller-side threads so `/seller/chat` previews.

- [ ] **Step 1: Add seller-side chat threads to the mock**

In `lib/dev-mock.ts`, find the chat section (`threadSummaries`, `threadMsgs`). Add seller-side message arrays and extend the threads with two entries whose `storeId === "my-st"` and `buyer` populated. Locate `const threadMsgs: Record<string, any[]> = {` and add two entries inside it:
```typescript
  "sth-1": [
    { id: "sm-1", threadId: "sth-1", senderId: "buyer-x", content: "Hi, is the jollof available for today?", isRead: false, createdAt: "2026-06-01T09:00:00Z", sender: { fullName: "Ada O.", profilePhoto: img("ada",80,80) }, isSender: false },
    { id: "sm-2", threadId: "sth-1", senderId: ME, content: "Yes! I can have it ready in an hour.", isRead: true, createdAt: "2026-06-01T09:02:00Z", sender: { fullName: "You", profilePhoto: null }, isSender: true },
  ],
  "sth-2": [
    { id: "sm-3", threadId: "sth-2", senderId: "buyer-y", content: "Please make the chips less salty 🙏", isRead: false, createdAt: "2026-05-31T15:00:00Z", sender: { fullName: "Tunde B.", profilePhoto: null }, isSender: false },
  ],
```

Then find `const threadSummaries = () => [` and add two seller threads to the returned array (storeId `"my-st"`, buyer populated):
```typescript
  { id: "sth-1", orderId: "so-1001", buyerId: "buyer-x", storeId: "my-st", updatedAt: "2026-06-01T09:02:00Z", store: { name: "Demo Store", logoUrl: img("mystore-logo",100,100), ownerId: ME }, buyer: { fullName: "Ada O.", profilePhoto: img("ada",80,80) }, order: { id: "so-1001", status: "paid" }, messages: lastMsg("sth-1"), unreadCount: 1 },
  { id: "sth-2", orderId: "so-1002", buyerId: "buyer-y", storeId: "my-st", updatedAt: "2026-05-31T15:00:00Z", store: { name: "Demo Store", logoUrl: img("mystore-logo",100,100), ownerId: ME }, buyer: { fullName: "Tunde B.", profilePhoto: null }, order: { id: "so-1002", status: "paid" }, messages: lastMsg("sth-2"), unreadCount: 1 },
```

(`lastMsg` + `threadDetail` helpers already handle any thread id, so `GET /chat/threads/sth-1` works without further changes.)

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/dev-mock.ts
git commit -m "chore(dev-mock): seller-side chat threads (C3 preview)"
```

---

## Task 8: Final verification

- [ ] **Step 1: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in new/modified files; build lists `/seller/chat` and `/seller` (updated). All seller routes present.

- [ ] **Step 2: Manual walkthrough** (`npm run dev`, `NEXT_PUBLIC_MOCK=1`)

1. Sidebar "Sell on NestMarket" shows Messages (with unread badge). `/seller` shows stat cards (earned, pending, orders, completed, active, rating) + recent orders + quick links.
2. `/seller/chat`: two-pane; thread list shows **buyers** (Ada O., Tunde B.) with unread badges; open a thread → header shows the buyer name, messages render (their messages left, yours right), mark-read clears the badge, sending a message works + appears.
3. No-store account → both `/seller` and `/seller/chat` show the create-store CTA.
4. Buyer chat at `/marketplace/chat` still shows **stores** (perspective unchanged).

- [ ] **Step 3: Dark mode + responsive** — toggle dark mode; resize to ~375px (chat master-detail with back button; stat grid 2-up). Gold tokens only.

- [ ] **Step 4: Commit any QA fixes (if needed)**

```bash
git add -A
git commit -m "fix(seller): C3 QA adjustments"
```
(Skip if no changes.)

---

## Self-review notes (coverage map)

- Spec §3.1 store filter → Task 2 (`useSellerChat`). §3.2 perspective/title reuse → Task 1. §3.3 hook → Task 2. §3.4 route + sidebar → Tasks 3, 4. §4 dashboard → Tasks 5, 6. §5 files → all tasks. §6 SWR/errors → shared `CHAT_THREADS_KEY` (Task 2), no-store CTAs (Tasks 3, 6), reused chat states. §7 mock → Task 7.
- §8 open items: `ChatThreadSummary.buyer`/`storeId` confirmed present (used in Tasks 1–2); `chat-conversation` single caller confirmed (buyer page keeps `storeName`, seller passes `title` — both optional, Task 1); seller deep-link `?thread=` supported (Task 3), `?order=` intentionally omitted for seller.
- Backward-compat: `ChatThreadList`/`ChatConversation` new props optional → buyer page untouched and still typechecks.
