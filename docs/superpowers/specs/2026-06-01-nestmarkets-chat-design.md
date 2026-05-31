# NestMarkets — Chat (Cycle B): Buyer ↔ Seller Messaging

> **Date:** 2026-06-01
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `GrowNest.Africa` (small additive backend change) + `grownest-web` (frontend)
> **Builds on:** merged buyer portal + vendors/ratings cycles.

---

## 1. Goal

Let buyers message the seller about an order: a two-pane chat at `/marketplace/chat` with thread list + conversation, 5-second polling, message moderation handling, order context, and **unread tracking**. A "Message seller" button on the order card deep-links to the relevant thread.

## 2. Scope

### In scope (Cycle B)
- `/marketplace/chat` two-pane (thread list + conversation; mobile master-detail).
- Send messages (existing endpoint, with moderation-rejection handling).
- 5s polling for thread list and the open conversation.
- **Unread:** mark-read on open + per-thread unread counts + sidebar total badge.
- "Message seller" button on the order card → deep-links to that order's thread.

### Deferred
- Real-time WebSocket (stays HTTP polling).
- Seller-side chat UI (the seller portal is a later cycle; backend `GET /threads` already serves both sides).
- Attachments/images in chat, typing indicators.

## 3. Backend (`GrowNest.Africa`) — additive, no schema change

Existing (mounted at `/api/nestmarkets/chat`): `GET /threads` (both buyer & seller side; includes `store`, `buyer`, `order`, last message), `GET /threads/:id` (full messages + `isSender` + auth), `POST /threads/:id/messages` (send + moderation). Threads are auto-created at checkout. `MarketChatMessage.isRead` exists but is never written.

**Add (uses existing `isRead`; no migration):**
1. **`POST /threads/:id/read`** — auth + existing buyer-or-store-owner check; sets `isRead: true` on all messages in the thread where `senderId !== me`. Returns `{ success: true }`.
2. **`unreadCount` on `GET /threads`** — for each thread, include `unreadCount` = number of messages with `isRead: false` and `senderId !== me`. (Computed per thread in the handler.)

I write this code; the user deploys. No DB migration.

## 4. Frontend (`grownest-web`)

Established pattern (`types → lib/*-api → SWR hooks → components/nestmarkets → app/marketplace/*`), sidebar shell, gold brand tokens only, `<img>` for images, framer-motion + Sonner.

### 4.1 Route & layout
- **New** `app/marketplace/chat/page.tsx` — two-pane master-detail:
  - Desktop: thread list (left, ~320px) + conversation (right).
  - Mobile: thread list full-width; selecting a thread shows the conversation with a back button.
  - Selected thread tracked in page state; supports deep link via query params (see 4.5).
- Sidebar "Market Chat" already exists — add a **total unread badge**.

### 4.2 API additions (`lib/nestmarkets-api.ts`)
`getChatThreads()`, `getChatThread(id)`, `sendChatMessage(id, content)`, `markThreadRead(id)`. Base path `/api/nestmarkets/chat`.

### 4.3 Hooks (SWR)
- `hooks/use-chat.ts` — `["nestmarket-chat-threads"]`, `refreshInterval: 5000` + standard options. Exposes `threads` and `totalUnread` (sum of `unreadCount`).
- `hooks/use-chat-thread.ts` — `["nestmarket-chat-thread", id]`, `refreshInterval: 5000`. Exposes messages + `send` + `markRead`.

### 4.4 Components (`components/nestmarkets/`)
`chat-thread-list.tsx` (rows: store logo/name, last-message preview, time, unread badge; skeleton + empty), `chat-conversation.tsx` (header + order context + scrollable messages + composer), `chat-message-bubble.tsx` (left/right by `isSender`, own messages in `bg-primary text-primary-foreground`), `chat-composer.tsx` (input + send), `chat-order-context.tsx` (store + order status from `thread.order`).

### 4.5 Data flow
- **Threads:** `use-chat` polls every 5s; list + unread badges stay live. Sidebar badge reads the same SWR key (total unread).
- **Open thread:** `use-chat-thread(id)` polls every 5s. On open → `markThreadRead(id)` → `mutate(["nestmarket-chat-threads"])` so the badge clears.
- **Send:** optimistic append (`mutate(updater,{revalidate:false})`) → `POST …/messages` → revalidate; moderation/`400` → Sonner error + roll back optimistic bubble.
- **Deep link:** `/marketplace/chat?thread=<id>` selects directly; `?order=<id>` selects the thread whose `order.id` matches once threads load. Order card "Message seller" → `/marketplace/chat?order=<orderId>`.
- **Polling hygiene:** only the open thread's key polls; SWR dedupes at the 5s interval.

### 4.6 Order card button
Add "Message seller" to `components/nestmarkets/order-card.tsx` → `Link` to `/marketplace/chat?order=${order.id}`.

### 4.7 Error handling & empties
- Send failure / moderation rejection → Sonner error, roll back optimistic bubble.
- Empty thread list ("No conversations yet"), empty conversation, skeletons while loading.
- Deep-link order with no matching thread yet → show list (thread is auto-created at checkout, so this is rare/transient).

## 5. Build order
1. Backend: `POST /threads/:id/read` + `unreadCount` on `GET /threads` (deploy).
2. Frontend: types → api → hooks → components → chat page → sidebar badge → order-card button.

## 6. Open items / confirm during implementation
- Confirm exact field names on `GET /threads` (`store`, `buyer`, `order`, last message) when shaping types — read the handler's `include`/response.
- Confirm the message timestamp field name (`createdAt`) for ordering/time display.
