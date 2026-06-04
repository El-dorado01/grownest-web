# NestMarkets — Seller Portal C2: Order Board + Earnings

> **Date:** 2026-06-01
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend) + `GrowNest.Africa` (one small additive backend change)
> **Builds on:** Seller Portal C1 (store + products), and the merged buyer cycles.
> **Workflow:** committed directly to `main` (no feature branch).

---

## 1. Goal

Let a seller fulfil orders and see their money: an order board that advances tracking, plus an earnings view (pending + total earned) with payout history.

## 2. Scope

### In scope (C2)
- `/seller/orders` — status-tabbed order board; advance tracking (`received → packaged → on_the_way → delivered`).
- `/seller/earnings` — pending balance + total earned cards; payout history list.
- Sidebar entries "Orders" and "Earnings" in the existing "Sell on NestMarket" group.
- One additive backend change: expose `pendingBalance` + `totalEarned` on `GET /my-store`.

### Deferred (C3+)
- Dashboard analytics (charts, top products, trends).
- Seller-side chat UI (backend already serves both sides via `GET /chat/threads`).
- 🔴 delivery-fee-payout settlement fix (still flagged; not addressed here).

## 3. Backend (`GrowNest.Africa`) — additive, no migration

Existing (verified):
- `GET /stores/:id/transactions?page&limit` — owner-gated; returns `{ success, data: order[], pagination }`; orders include `items.product`. **Order board data source.**
- `PATCH /orders/:id/tracking` — owner-gated; body `{ status: "received"|"packaged"|"on_the_way"|"delivered" }`; sets `trackingStatus` (+ `status`/`deliveredAt` when delivered); notifies buyer. **Fulfilment action.**
- Buyer `accept` already moves `sellerAmount` from store `pendingBalanceEnc` → seller NestPurse and logs a `market_sale` `purseTransaction`. **Payouts already happen.**
- `nestPurseApi.getTransactions({limit,cursor,startDate,endDate})` → `{ transactions: [{ id, type, amount, status, method, reference, date, narration }], pagination:{hasMore,nextCursor,limit} }`. Payouts are `method === "market_sale"`. **Payout history source (client-side filter).**

**The gap:** the store's pending balance is encrypted (`pendingBalanceEnc`) and never exposed; there's no "total earned" figure.

**Add — extend `GET /my-store`** to include two computed fields in its `data`:
- `pendingBalance: number` — `decryptBalance(store.pendingBalanceEnc)`.
- `totalEarned: number` — sum of `amount` from `purseTransaction` where `profileId === ownerId && method === "market_sale" && status === "success"`.

One handler edit in `src/routes/nestmarkets.ts` (the `GET /my-store` route). No schema change, no migration. I write it; user deploys. (Chosen over a separate `/seller/earnings` endpoint because the seller pages already load `/my-store`.)

## 4. Frontend (`grownest-web`)

Pattern: `types → lib/seller-api → SWR hooks → components/seller → app/seller/*`. Sidebar shell, gold tokens, `<img>`, SWR conventions.

### 4.1 Routes & sidebar
- Add to the "Sell on NestMarket" group: `Orders → /seller/orders`, `Earnings → /seller/earnings` (after Products).
- Both pages: no store (`useMyStore` 404) → CTA to `/seller/store`.

### 4.2 Types (`types/seller.ts`, extend)
- `SellerStore` gains optional `pendingBalance?: number` and `totalEarned?: number`.
- `SellerOrderItem` (`id, productId, quantity, priceAtPurchase, product`), `SellerOrder` (`id, buyerId, totalAmount, deliveryFee, adminFee, sellerAmount, status, trackingStatus, addressSnapshot, createdAt, deliveredAt, acceptedAt, rejectedAt, rejectionReason, items`), `SellerTransactionsResponse` (`{ success, data: SellerOrder[], pagination }`).

### 4.3 API (`lib/seller-api.ts`, extend)
- `getStoreTransactions(storeId, page = 1, limit = 20)` → `GET /stores/:id/transactions`.
- `updateTracking(orderId, status)` → `PATCH /orders/:id/tracking`.
- (Earnings come from the extended `getMyStore`; payout history from `nestPurseApi.getTransactions`.)

### 4.4 Hooks (SWR)
- `hooks/use-seller-orders.ts` — given `storeId`, `["seller-orders", storeId, page]`; returns orders + pagination + `advance(orderId, nextStatus)` (optimistic mutate then revalidate). Null key when no storeId. `{dedupingInterval:2000, revalidateOnFocus/IfStale}`.
- `hooks/use-payouts.ts` — wraps `nestPurseApi.getTransactions`, exposes `payouts` = txns filtered to `method === "market_sale"`, plus load-more via cursor.

### 4.5 Components (`components/seller/`)
`order-status-tabs.tsx` (tab bar + counts), `seller-order-row.tsx` (order summary + items + buyer address snapshot + status badge + advance button), `advance-status-button.tsx` (computes next stage from `trackingStatus`; hidden once `delivered`/terminal), `order-board.tsx` (tabs + filtered list + skeleton + empty), `earnings-cards.tsx` (Pending + Total earned), `payout-history.tsx` (list + load-more + empty).

### 4.6 Flows
- **Order board:** `useMyStore` → storeId → `getStoreTransactions`. Tabs filter the loaded set by `status`/`trackingStatus`: New = `status:"paid"` & tracking `received`; Packaged = tracking `packaged`; On the way = `on_the_way`; Delivered = `status:"delivered"` (awaiting buyer); Completed = `status:"accepted"`; Rejected = `status:"rejected"`. Advance button maps `received→packaged→on_the_way→delivered` via `updateTracking`; after delivered shows "Awaiting buyer confirmation" (read-only). Optimistic + revalidate; Sonner errors.
- **Earnings:** read `pendingBalance` + `totalEarned` from `useMyStore`; show two cards (Pending = "held until buyers confirm delivery"). Payout history from `use-payouts` (`market_sale` txns: amount, narration/reference, date).

### 4.7 Errors & states
- No store → CTA to create (both pages).
- Empty tab / no payouts → friendly empty states; skeletons while loading.
- Tracking update failure → toast + rollback. `pendingBalance`/`totalEarned` may be `undefined` until backend deployed → render `₦0`/`—` gracefully (don't crash).

### 4.8 Mock
Extend `lib/dev-mock.ts` (gated on `NEXT_PUBLIC_MOCK=1`) with seller orders across statuses, `pendingBalance`/`totalEarned` on the mock store, `PATCH /orders/:id/tracking` mutation, and `market_sale` entries in the transactions response — so C2 is previewable without a backend.

## 5. Build order
1. Backend: extend `GET /my-store` with `pendingBalance` + `totalEarned` (deploy).
2. Frontend: types → api → hooks → components → `/seller/orders` → `/seller/earnings` → sidebar → mock fixtures.

## 6. Open items / confirm during implementation
- Confirm `decryptBalance` import + `purseTransaction` model field names (`profileId`, `method`, `amount`, `status`) in the `/my-store` handler — verified against checkout/accept code (`method: "market_sale"`, `status: "success"`).
- Confirm `MarketOrder` fields available from `/stores/:id/transactions` for the row UI (addressSnapshot, deliveryFee, sellerAmount) — present on the model.
- Tab definition for "New": treat `status==="paid" && trackingStatus==="received"` as New; if a paid order already advanced, it appears under its tracking tab.
