# NestMarkets — Seller Portal C3: Chat Inbox + Dashboard

> **Date:** 2026-06-05
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend only)
> **Builds on:** Seller C1 (store + products), C2 (orders + earnings), and the buyer chat cycle.
> **Workflow:** committed directly to `main` (no feature branch).

---

## 1. Goal

Complete the seller experience's communication + at-a-glance pieces: a seller **chat inbox** to reply to buyers, and a real **dashboard** with stats — both reusing data/components we already have.

## 2. Scope

### In scope (C3)
- `/seller/chat` — two-pane seller chat inbox (reply to buyers), reusing the buyer chat backend + components.
- `/seller` dashboard — stat cards + recent orders, computed client-side from existing data.
- Sidebar "Messages" entry (with unread badge) in the "Sell on NestMarket" group.
- Mock fixtures so both preview without a backend.

### Deferred
- 🔴 delivery-fee-payout settlement fix (its own future cycle).
- Charts/analytics-over-time (stat cards only this cycle).
- Real-time chat (stays 5s polling).

### Frontend-only
The chat backend already serves both sides (`GET /chat/threads` returns threads where the user is buyer **or** store owner; `GET /chat/threads/:id` computes `isSender` per message; `POST .../messages` + `.../read` work for either party). Dashboard computes from data already fetched by `useMyStore` + `useSellerOrders`. No backend change, no migration.

## 3. Seller chat

### 3.1 The filtering rule
`GET /chat/threads` returns a mixed set (buyer-side + seller-side threads). The seller inbox shows only **threads for my store**: `threads.filter(t => t.storeId === myStore.id)`. The thread summary carries `storeId` and `store.ownerId`; `myStore.id` comes from `useMyStore`. The buyer chat at `/marketplace/chat` is unchanged.

### 3.2 Component reuse via a `perspective` prop (backward-compatible)
- `components/nestmarkets/chat-thread-list.tsx` — add optional `perspective?: "buyer" | "seller"` (default `"buyer"`). `buyer` renders `t.store.name` + `t.store.logoUrl` (today's behavior, untouched). `seller` renders the **buyer**: `t.buyer.fullName ?? "Buyer"` + `t.buyer.profilePhoto`. Unread badge, last-message preview, selection all identical.
- `components/nestmarkets/chat-conversation.tsx` — generalize the existing `storeName?` fallback to a `title?: string` override used for the header (keep `storeName` working for the buyer page, or replace its single caller). For the seller view the page passes the buyer's name as `title`. Everything else (polling, mark-read on open, optimistic send, order-context card, auto-scroll) is unchanged and already works for either side.

### 3.3 Hook
`hooks/use-seller-chat.ts` — wraps the same threads SWR (reuse `nestMarketsApi.getChatThreads`, key `CHAT_THREADS_KEY`, 5s poll) and returns `{ threads, totalUnread, isLoading, error }` filtered to a given `storeId`. The open conversation reuses `useChatThread` unchanged.

### 3.4 Route + sidebar
- `app/seller/chat/page.tsx` — two-pane master-detail mirroring `app/marketplace/chat/page.tsx` (Suspense + `useSearchParams` for `?thread=`), but: data from `useSellerChat(store.id)`, `perspective="seller"`, conversation `title` = selected thread's buyer name. No-store → CTA to `/seller/store`.
- Sidebar "Sell on NestMarket" group gains **Messages → /seller/chat** with an unread badge (`components/seller/seller-chat-nav-badge.tsx`, using `useSellerChat`). Needs the seller's storeId — the badge calls `useMyStore` + `useSellerChat`.

## 4. Seller dashboard (`/seller`)

Rewrite the `/seller` page body (keep the no-store CTA + store header) to show stat cards computed client-side:
- **Total earned** (`store.totalEarned ?? 0`), **Pending** (`store.pendingBalance ?? 0`) — from `useMyStore`.
- **Total orders**, **Active** (status `paid` or tracking not delivered/accepted/rejected), **Completed** (`status === "accepted"`) — from `useSellerOrders(store.id)`.
- **Products** (`store._count?.products ?? 0`), **Avg rating** (`store.averageRating` + `ratingCount`).
- **Recent orders** — latest 5 from the same orders fetch, each linking to `/seller/orders`.
- Keep the existing store header (logo, name, status badge) + quick links to Store/Products/Orders/Earnings/Messages.

New component `components/seller/dashboard-stats.tsx` (stat-card grid + recent list). No charts library, no backend.

## 5. Files
- Modify: `components/nestmarkets/chat-thread-list.tsx`, `components/nestmarkets/chat-conversation.tsx` (add `perspective`/`title`, backward-compatible).
- Create: `hooks/use-seller-chat.ts`, `components/seller/seller-chat-nav-badge.tsx`, `components/seller/dashboard-stats.tsx`, `app/seller/chat/page.tsx`.
- Modify: `app/seller/page.tsx` (dashboard body), `components/app-sidebar.tsx` (Messages entry), `lib/dev-mock.ts` (seller-side threads + dashboard-supporting data).

## 6. SWR & errors
- Chat reuses `CHAT_THREADS_KEY` (5s poll) + `useChatThread` keys; seller filter is client-side.
- Dashboard reads existing `["seller-store"]` + `["seller-orders", storeId]` — no new server calls.
- No-store → CTA on `/seller` and `/seller/chat`. Empty inbox / zero-stat states handled. Existing chat error/empty/skeleton states reused. Mark-read clears unread for the seller too (endpoint already marks others' messages read).

## 7. Mock
Extend `lib/dev-mock.ts` (gated on `NEXT_PUBLIC_MOCK=1`) so `GET /chat/threads` includes seller-side threads for the seeded `myStore` (storeId = `"my-st"`, with `buyer` populated) and the seeded store carries the dashboard figures (already has `pendingBalance`/`totalEarned`/`_count.products`/`averageRating` from C2). Seller order fixtures already exist (C2) for the dashboard order stats.

## 8. Open items / confirm during implementation
- Confirm `ChatThreadSummary.buyer` (fullName, profilePhoto) and `storeId` are present on the threads payload — verified in `types/nestmarkets.ts` (chat types added in the chat cycle).
- Confirm `chat-conversation.tsx`'s only current caller is the buyer chat page, so generalizing `storeName` → `title` is safe (or keep `storeName` and add `title` as an additional optional override).
- Seller chat deep-link param: support `?thread=<id>` like the buyer page; `?order=` not needed for the seller inbox.
