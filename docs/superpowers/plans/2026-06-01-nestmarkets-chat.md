# NestMarkets Chat (Cycle B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build buyer↔seller chat — a two-pane `/marketplace/chat` (thread list + conversation) with 5s polling, message moderation handling, order context, unread tracking, and a "Message seller" deep-link from the order card.

**Architecture:** Frontend on the merged marketplace, plus one small additive backend change (mark-read endpoint + `unreadCount` on the threads list; no schema change, no migration). Frontend follows the established pattern (`types → lib/*-api → SWR hooks → components/nestmarkets → app/marketplace/*`), reusing the sidebar shell and gold brand tokens.

**Tech Stack:** Backend — Node/Express, Prisma, Zod. Frontend — Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR (with `refreshInterval`), framer-motion, Sonner, Lucide.

**Verification model:** No automated test runner in either repo. Each task verified by **typecheck + build + lint** (frontend) / **tsc/build** (backend) and **manual checks**. The assistant writes backend code; the USER deploys.

**Reference spec:** `docs/superpowers/specs/2026-06-01-nestmarkets-chat-design.md`

**Key facts (verified against code):**
- Chat router: `src/routes/marketChat.ts`, mounted at `/api/nestmarkets/chat`. Existing routes: `GET /threads`, `GET /threads/:id`, `POST /threads/:id/messages`.
- `GET /threads` returns `{ success, data: thread[] }`. Each thread: `id, orderId, buyerId, storeId, createdAt, updatedAt`, plus `store: { name, logoUrl, ownerId }`, `buyer: { fullName, profilePhoto }`, `order: { id, status } | null`, `messages: [lastMessage]` (array, newest, `take:1`).
- `GET /threads/:id` returns `{ success, data: { ...thread, store:{ownerId}, messages: [{ id, threadId, senderId, content, isRead, createdAt, sender:{fullName,profilePhoto}, isSender }] } }` (messages asc; `isSender` computed per message).
- `POST /threads/:id/messages` body `{ content: string (min 1) }`. On moderation block returns `400 { success:false, message, moderated:true }`. On success `201 { success:true, data: message }`.
- `MarketChatMessage`: `id, threadId, senderId, content, isRead (default false), createdAt`. `isRead` is never written yet.
- All chat routes use `authenticateToken`; auth check allows `thread.buyerId === me` OR `thread.store.ownerId === me`.
- FE `api.get/post<T>(endpoint, body?)` → `{ data, error, status }`. SWR convention `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`; add `refreshInterval:5000` for chat. Optimistic `mutate(updater,{revalidate:false})`.
- Repo paths: backend `C:\Users\ambal\Desktop\Gigs\BE\GrowNest.Africa`, frontend `C:\Users\ambal\Desktop\Gigs\grownest-web`. Frontend branch `feat/nestmarkets-chat` (already created).

---

# PART A — BACKEND (`GrowNest.Africa`)

> Branch: `git checkout -b feat/nestmarkets-chat-unread`. Write code only; USER deploys. No schema change / no migration.

## Task 1: Mark-read endpoint + unreadCount on threads

**Files:**
- Modify: `src/routes/marketChat.ts`

- [ ] **Step 1: Add `unreadCount` to `GET /threads`**

In `src/routes/marketChat.ts`, the `GET /threads` handler currently returns `threads` directly. Replace the `return res.json({ success: true, data: threads });` line with a mapped version that computes unread per thread. First, change the `messages` include to also fetch unread info — replace the existing `messages: { orderBy: { createdAt: 'desc' }, take: 1 }` include with:

```typescript
        messages: {
          orderBy: { createdAt: 'desc' },
        },
```

Then replace `return res.json({ success: true, data: threads });` with:

```typescript
    const withUnread = threads.map((t: any) => {
      const unreadCount = t.messages.filter(
        (m: any) => !m.isRead && m.senderId !== userId
      ).length;
      // Keep only the latest message for the list preview
      const lastMessage = t.messages[0] ?? null;
      return { ...t, messages: lastMessage ? [lastMessage] : [], unreadCount };
    });

    return res.json({ success: true, data: withUnread });
```

- [ ] **Step 2: Add `POST /threads/:id/read`**

Add this route AFTER the `POST /threads/:id/messages` handler (before `export default router;`):

```typescript
// Mark all messages in a thread (not sent by me) as read
router.post('/threads/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Thread ID is required' });

    const thread = await prisma.marketChatThread.findUnique({
      where: { id: id as string },
      include: { store: { select: { ownerId: true } } },
    });
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Chat thread not found' });
    }
    if (thread.buyerId !== userId && (thread as any).store?.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.marketChatMessage.updateMany({
      where: { threadId: id as string, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Mark thread read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark thread read' });
  }
});
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `prisma generate && tsc` completes with no errors (no schema change; `isRead`/`senderId` already on the model).
NOTE: if Windows throws an `EPERM` renaming the Prisma engine DLL, that is a local file-lock fluke (a running dev server) — not a code error. Stop any `npm run dev`, retry, or rely on tsc being syntactically valid.

- [ ] **Step 4: Manual verification (server running)**

```bash
curl "localhost:3001/api/nestmarkets/chat/threads" -H "Authorization: Bearer <TOKEN>"   # each thread has unreadCount + messages:[last]
curl -X POST "localhost:3001/api/nestmarkets/chat/threads/<TID>/read" -H "Authorization: Bearer <TOKEN>"   # { success:true }; re-fetch threads -> that unreadCount is 0
```

- [ ] **Step 5: Commit + push**

```bash
git add src/routes/marketChat.ts
git commit -m "feat(nestmarkets): chat unreadCount on threads + mark-read endpoint"
git push -u origin feat/nestmarkets-chat-unread
```

---

# PART B — FRONTEND (`grownest-web`)

> On branch `feat/nestmarkets-chat`. Semantic tokens only (`bg-primary`,`text-primary`,`text-primary-foreground`,`bg-card`,`border-border`,`bg-muted`,`text-muted-foreground`,`text-destructive`,`rounded-lg/xl/2xl`). `<img>` for images. Verify each task with `npm run typecheck`; run `npm run lint` at the end (fix only your files).

## Task 2: Types

**Files:**
- Modify: `types/nestmarkets.ts`

- [ ] **Step 1: Append chat types**

Add to the END of `types/nestmarkets.ts`:

```typescript
export interface ChatLastMessage {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatThreadSummary {
  id: string;
  orderId: string | null;
  buyerId: string;
  storeId: string;
  updatedAt: string;
  store: { name: string; logoUrl: string | null; ownerId: string };
  buyer: { fullName: string | null; profilePhoto: string | null };
  order: { id: string; status: string } | null;
  messages: ChatLastMessage[]; // [lastMessage] or []
  unreadCount: number;
}

export interface ChatThreadsResponse {
  success: boolean;
  data: ChatThreadSummary[];
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { fullName: string | null; profilePhoto: string | null };
  isSender: boolean;
}

export interface ChatThreadDetail {
  id: string;
  orderId: string | null;
  buyerId: string;
  storeId: string;
  updatedAt: string;
  store?: { name?: string; logoUrl?: string | null; ownerId: string };
  order?: { id: string; status: string } | null;
  messages: ChatMessage[];
}

export interface ChatThreadResponse {
  success: boolean;
  data: ChatThreadDetail;
}

export interface SendMessageResponse {
  success: boolean;
  data?: ChatMessage;
  message?: string;
  moderated?: boolean;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add types/nestmarkets.ts
git commit -m "feat(nestmarkets): chat types"
```

---

## Task 3: API methods

**Files:**
- Modify: `lib/nestmarkets-api.ts`

- [ ] **Step 1: Add chat methods**

Update the type import block in `lib/nestmarkets-api.ts` to add the chat response types:

```typescript
import type {
  BrowseResponse,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyOrdersResponse,
  StoresResponse,
  StoreResponse,
  FollowResponse,
  StoreReviewsResponse,
  ChatThreadsResponse,
  ChatThreadResponse,
  SendMessageResponse,
} from "@/types/nestmarkets";
```

Add a chat base constant near the top (after `const BASE = "/api/nestmarkets";`):

```typescript
const CHAT = "/api/nestmarkets/chat";
```

Add these methods inside `nestMarketsApi` (after `rateOrder`):

```typescript
  // Chat
  getChatThreads: () => api.get<ChatThreadsResponse>(`${CHAT}/threads`),
  getChatThread: (id: string) => api.get<ChatThreadResponse>(`${CHAT}/threads/${id}`),
  sendChatMessage: (id: string, content: string) =>
    api.post<SendMessageResponse>(`${CHAT}/threads/${id}/messages`, { content }),
  markThreadRead: (id: string) =>
    api.post<{ success: boolean }>(`${CHAT}/threads/${id}/read`),
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/nestmarkets-api.ts
git commit -m "feat(nestmarkets): chat api methods"
```

---

## Task 4: Hooks

**Files:**
- Create: `hooks/use-chat.ts`
- Create: `hooks/use-chat-thread.ts`

- [ ] **Step 1: Create `hooks/use-chat.ts`** (threads list + total unread, 5s poll)

```typescript
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
```

- [ ] **Step 2: Create `hooks/use-chat-thread.ts`** (one thread, 5s poll, send + markRead)

```typescript
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
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-chat.ts hooks/use-chat-thread.ts
git commit -m "feat(nestmarkets): chat hooks (threads list + thread detail with polling)"
```

---

## Task 5: Presentational chat components

**Files:**
- Create: `components/nestmarkets/chat-message-bubble.tsx`
- Create: `components/nestmarkets/chat-order-context.tsx`
- Create: `components/nestmarkets/chat-composer.tsx`
- Create: `components/nestmarkets/chat-thread-list.tsx`

- [ ] **Step 1: `chat-message-bubble.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/nestmarkets";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.isSender;
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `chat-order-context.tsx`**

```tsx
import Link from "next/link";
import { Package } from "lucide-react";

export function ChatOrderContext({
  order,
}: { order: { id: string; status: string } | null | undefined }) {
  if (!order) return null;
  return (
    <Link
      href="/marketplace/orders"
      className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs"
    >
      <Package className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">Order</span>
      <span className="font-medium">#{order.id.slice(0, 8)}</span>
      <span className="ml-auto capitalize rounded-full bg-card px-2 py-0.5 border border-border">{order.status}</span>
    </Link>
  );
}
```

- [ ] **Step 3: `chat-composer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Type a message..."
        disabled={disabled}
        className="rounded-full bg-card border-border"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()} size="icon" className="rounded-full shrink-0">
        <Send className="size-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: `chat-thread-list.tsx`**

```tsx
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
```

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/chat-message-bubble.tsx components/nestmarkets/chat-order-context.tsx components/nestmarkets/chat-composer.tsx components/nestmarkets/chat-thread-list.tsx
git commit -m "feat(nestmarkets): chat presentational components (bubble, order context, composer, thread list)"
```

---

## Task 6: Conversation pane

**Files:**
- Create: `components/nestmarkets/chat-conversation.tsx`

- [ ] **Step 1: Create `chat-conversation.tsx`** (header + order context + messages + composer; mark-read on open; auto-scroll)

```tsx
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
```

> NOTE: We deliberately do NOT use `useProfile` here. The optimistic bubble hardcodes `isSender: true` and the server recomputes `isSender` on the next revalidate, so the sender's id is never needed for correctness.

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/chat-conversation.tsx
git commit -m "feat(nestmarkets): chat conversation pane with mark-read + auto-scroll"
```

---

## Task 7: Chat page (two-pane) + deep link

**Files:**
- Create: `app/marketplace/chat/page.tsx`

- [ ] **Step 1: Create `app/marketplace/chat/page.tsx`**

Two-pane master-detail. READ `app/marketplace/vendors/page.tsx` first to copy the exact shell. Uses `useSearchParams` for `?thread=` / `?order=` deep links. Wrap the search-params logic in a child component inside `<Suspense>` (Next 15 requirement for `useSearchParams` on a client page).

```tsx
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
```

- [ ] **Step 2: Verify build (route exists)**

Run: `npm run typecheck && npm run build`
Expected: build succeeds; `/marketplace/chat` listed in the route output.

- [ ] **Step 3: Commit**

```bash
git add app/marketplace/chat/page.tsx
git commit -m "feat(nestmarkets): two-pane chat page with deep-link support"
```

---

## Task 8: Sidebar unread badge + "Message seller" on order card

**Files:**
- Create: `components/nestmarkets/chat-nav-badge.tsx`
- Modify: `components/app-sidebar.tsx`
- Modify: `components/nestmarkets/order-card.tsx`

- [ ] **Step 1: Create `chat-nav-badge.tsx`** (small client badge using `useChat`)

```tsx
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
```

- [ ] **Step 2: Render the badge on the "Market Chat" sidebar item**

In `components/app-sidebar.tsx`, the NestMarket group renders sub-items from the `items` array via `NavMain`. The simplest non-invasive approach: the `items` are plain `{title,url}`. To show a badge only on "Market Chat" without refactoring `NavMain`, add an optional `badge` React node to that one item and render it in `NavMain`.

First, in `components/app-sidebar.tsx`, import the badge at the top:
```tsx
import { ChatNavBadge } from "@/components/nestmarkets/chat-nav-badge"
```
Then change the "Market Chat" item in the NestMarket `items` array to include a `badge`:
```tsx
        {
          title: "Market Chat",
          url: "/marketplace/chat",
          badge: <ChatNavBadge />,
        },
```

- [ ] **Step 3: Render `subItem.badge` in `NavMain`**

Open `components/nav-main.tsx`. It has a local `type NavSubItem = { title: string; url: string }`. Make two edits:

1. Add `badge` to the type:
```tsx
type NavSubItem = {
  title: string
  url: string
  badge?: React.ReactNode
}
```

2. In the sub-item map, the link currently renders `<span>{subItem.title}</span>`. Add the badge right after that span, inside the same `<Link>`:
```tsx
                            <Link href={subItem.url} onClick={handleNavClick}>
                              <span>{subItem.title}</span>
                              {subItem.badge}
                            </Link>
```

- [ ] **Step 4: Add "Message seller" to the order card**

In `components/nestmarkets/order-card.tsx`, add the import:
```tsx
import Link from "next/link";
```
Then, inside the card JSX, immediately AFTER the totals row (the `<div className="flex justify-between text-sm">...</div>` block) and BEFORE the `{order.status === "rejected" ...}` block, add a "Message seller" link button:
```tsx
      <Link
        href={`/marketplace/chat?order=${order.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors w-full"
      >
        Message seller
      </Link>
```

- [ ] **Step 5: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in new files; build lists `/marketplace/chat`.

- [ ] **Step 6: Commit**

```bash
git add components/nestmarkets/chat-nav-badge.tsx components/app-sidebar.tsx components/nav-main.tsx components/nestmarkets/order-card.tsx
git commit -m "feat(nestmarkets): sidebar chat unread badge + Message seller on order card"
```

---

## Task 9: Cross-screen QA

- [ ] **Step 1: Manual walkthrough** (`npm run dev`, backend deployed)

1. Sidebar → Market Chat → two-pane: thread list left, "Select a conversation" right (desktop). Mobile: list full-width.
2. Open a thread → messages load, marked read (unread badge on that thread + sidebar clears), auto-scrolls to newest, order context card shows at top.
3. Send a message → appears immediately (optimistic), persists after the 5s poll; a blocked/moderated message shows a Sonner error and rolls back.
4. From `/marketplace/orders`, click "Message seller" → chat opens that order's thread directly.
5. Leave a thread open ~6s with a second account sending a message → it appears via polling.

- [ ] **Step 2: Dark mode + responsive** — toggle dark mode; resize to ~375px (list↔conversation master-detail with back button). All gold tokens, no emerald/slate.

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/nestmarkets-chat
```

---

## Self-review notes (coverage map)

- Spec §3 backend: mark-read endpoint → Task 1 Step 2; `unreadCount` on threads → Task 1 Step 1.
- §4.1 route + two-pane + sidebar badge → Tasks 7 & 8. §4.2 api → Task 3. §4.3 hooks (5s polling) → Task 4. §4.4 components → Tasks 5 & 6. §4.5 data flow (poll, mark-read-on-open, optimistic send, deep link) → Tasks 4, 6, 7. §4.6 order-card button → Task 8 Step 4. §4.7 errors/empties → Tasks 5 (empty list), 6 (empty convo, send error), composer.
- §6 open items: `GET /threads` shape verified (store/buyer/order/messages) and encoded in Task 2 types; timestamp field is `createdAt` (used in hooks/types).
- Polling hygiene: only the open thread key polls (Task 4 keyed on `id`); threads list polls for badges (acceptable, lightweight).
