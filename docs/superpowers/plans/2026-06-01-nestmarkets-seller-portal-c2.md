# NestMarkets Seller Portal C2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give sellers an order-fulfilment board (advance tracking) and an earnings view (pending + total earned with payout history), under the existing `/seller/*` area.

**Architecture:** Mostly frontend on the existing seller portal, plus one additive backend change (expose `pendingBalance` + `totalEarned` on `GET /my-store`). Follows the established pattern (`types → lib/seller-api → SWR hooks → components/seller → app/seller/*`). Order data from the existing owner-gated `GET /stores/:id/transactions`; tracking via `PATCH /orders/:id/tracking`; payout history by filtering existing NestPurse `market_sale` transactions.

**Tech Stack:** Backend — Node/Express, Prisma. Frontend — Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, Sonner, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck + lint** + manual; final task `build`. Backend code written by assistant; **user deploys**. All commits go to **`main`** (no feature branch — user preference).

**Reference spec:** `docs/superpowers/specs/2026-06-01-nestmarkets-seller-portal-c2-design.md`

**Key facts (verified against code):**
- `GET /stores/:id/transactions?page&limit` — owner/admin gated; `{ success, data: order[], pagination:{total,page,limit,pages} }`; orders include `items.product`.
- `PATCH /orders/:id/tracking` — owner gated; body `{ status: "received"|"packaged"|"on_the_way"|"delivered" }`; `{ success, data: updatedOrder }`.
- `GET /my-store` (current handler at `src/routes/nestmarkets.ts:46`) returns `{ success, data: store(+_count.products) }` or `404`.
- Seller payout on buyer accept logs `purseTransaction { profileId: ownerId, amount: sellerAmount, type:"credit", method:"market_sale", status:"success" }`.
- `nestPurseApi.getTransactions({ limit?, cursor?, startDate?, endDate? })` (`lib/nestpurse-api.ts:160`) → `{ transactions: [{ id, type, amount, status, method, reference, date, narration? }], pagination:{ hasMore, nextCursor?, limit } }`.
- `MarketOrder` fields: `id, buyerId, storeId, totalAmount, deliveryFee, adminFee, sellerAmount, status, trackingStatus, deliveryProfileId, addressSnapshot, payoutStatus, rejectionReason, createdAt, deliveredAt, acceptedAt, rejectedAt`.
- Existing C1 frontend: `types/seller.ts` (`SellerStore`, `SellerProduct`, responses), `lib/seller-api.ts` (`sellerApi`), `hooks/use-my-store.ts` (`useMyStore`, `SELLER_STORE_KEY`; 404 = no store). Page shell pattern: `app/seller/store/page.tsx` / `app/marketplace/vendors/page.tsx`. Sidebar group "Sell on NestMarket" in `components/app-sidebar.tsx` `navMain` (items: Dashboard, My Store, Products).
- Backend `decryptBalance` already imported in `src/routes/nestmarkets.ts` (from `../utils/crypto.js`).
- Frontend repo `c:\Users\ambal\Desktop\Gigs\grownest-web`, branch **main**. Backend `C:\Users\ambal\Desktop\Gigs\BE\GrowNest.Africa`.

---

## Task 1: Backend — expose pendingBalance + totalEarned on GET /my-store

**Files:**
- Modify: `src/routes/nestmarkets.ts` (the `GET /my-store` handler, ~line 46)

- [ ] **Step 1: Compute and attach the two fields**

In the `GET /my-store` handler, after the `if (!store) {...}` 404 guard and before `createActivityLog`, insert:

```typescript
      // Pending balance (decrypt) + lifetime earned (sum of market_sale payouts)
      const pendingBalance = decryptBalance(store.pendingBalanceEnc);
      const earnedAgg = await prisma.purseTransaction.aggregate({
        where: { profileId: userId, method: "market_sale", status: "success" },
        _sum: { amount: true },
      });
      const totalEarned = earnedAgg._sum.amount ?? 0;
```

Then change the success response to merge them into `data`:

```typescript
      return res.json({
        success: true,
        data: { ...store, pendingBalance, totalEarned },
      });
```

(`decryptBalance` is already imported at the top of this file. `store.pendingBalanceEnc` exists on `MarketStore`.)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `prisma generate && tsc` completes with no errors. (Windows `EPERM` on the Prisma DLL = local file lock from a running dev server, not a code error — stop dev and retry.)

- [ ] **Step 3: Manual verification (server running)**

```bash
curl "localhost:3001/api/nestmarkets/my-store" -H "Authorization: Bearer <SELLER_TOKEN>"
```
Expected: `data` now includes numeric `pendingBalance` and `totalEarned`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/nestmarkets.ts
git commit -m "feat(nestmarkets): expose pendingBalance + totalEarned on GET /my-store"
```

> The USER deploys the backend. The frontend renders `₦0`/`—` gracefully until then (Task 2 makes the fields optional).

---

## Task 2: Frontend types

**Files:**
- Modify: `types/seller.ts`

- [ ] **Step 1: Add earnings fields to `SellerStore` and add order types**

Append to `types/seller.ts` (and add the two optional fields to the existing `SellerStore` interface):

First, inside the existing `SellerStore` interface, add:
```typescript
  pendingBalance?: number;
  totalEarned?: number;
```

Then append at the end of the file:
```typescript
export type TrackingStatus = "received" | "packaged" | "on_the_way" | "delivered";

export interface SellerOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export interface SellerOrder {
  id: string;
  buyerId: string;
  storeId: string;
  totalAmount: number;
  deliveryFee: number;
  adminFee: number;
  sellerAmount: number;
  status: string; // paid | delivered | accepted | rejected
  trackingStatus: TrackingStatus;
  addressSnapshot: Record<string, unknown> | null;
  payoutStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  items: SellerOrderItem[];
}

export interface SellerTransactionsResponse {
  success: boolean;
  data: SellerOrder[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface UpdateTrackingResponse {
  success: boolean;
  data: SellerOrder;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add types/seller.ts
git commit -m "feat(seller): order + earnings types"
```

---

## Task 3: API methods

**Files:**
- Modify: `lib/seller-api.ts`

- [ ] **Step 1: Add transactions + tracking methods**

Update the import block to add the new types:
```typescript
import type {
  SellerStoreResponse,
  SellerProductsResponse,
  SellerProductResponse,
  RequestVerificationBody,
  SellerTransactionsResponse,
  UpdateTrackingResponse,
  TrackingStatus,
} from "@/types/seller";
```

Add these methods inside `sellerApi` (after `deleteProduct`):
```typescript
  getStoreTransactions: (storeId: string, page = 1, limit = 20) =>
    api.get<SellerTransactionsResponse>(`${BASE}/stores/${storeId}/transactions?page=${page}&limit=${limit}`),
  updateTracking: (orderId: string, status: TrackingStatus) =>
    api.patch<UpdateTrackingResponse>(`${BASE}/orders/${orderId}/tracking`, { status }),
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/seller-api.ts
git commit -m "feat(seller): api methods for store transactions + tracking"
```

---

## Task 4: Hooks

**Files:**
- Create: `hooks/use-seller-orders.ts`
- Create: `hooks/use-payouts.ts`

- [ ] **Step 1: Create `hooks/use-seller-orders.ts`**

```typescript
"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";
import type { TrackingStatus } from "@/types/seller";

export function useSellerOrders(storeId: string | null, page = 1, limit = 50) {
  const { data: res, error, isLoading, mutate } = useSWR(
    storeId ? ["seller-orders", storeId, page, limit] : null,
    () => sellerApi.getStoreTransactions(storeId!, page, limit),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const orders = res?.data?.data ?? [];
  const pagination = res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 };

  const advance = async (orderId: string, next: TrackingStatus) => {
    // optimistic: update the order's trackingStatus (and status if delivered) in cache
    await mutate(
      (cur) =>
        cur?.data?.data
          ? {
              ...cur,
              data: {
                ...cur.data,
                data: cur.data.data.map((o) =>
                  o.id === orderId
                    ? { ...o, trackingStatus: next, status: next === "delivered" ? "delivered" : o.status }
                    : o
                ),
              },
            }
          : cur,
      { revalidate: false }
    );
    const r = await sellerApi.updateTracking(orderId, next);
    if (r.error || !r.data?.success) {
      await mutate(); // rollback to server truth
      return { error: r.error || "Could not update order" };
    }
    await mutate();
    return {};
  };

  return { orders, pagination, isLoading, error: !!(error || res?.error), advance, mutate };
}
```

- [ ] **Step 2: Create `hooks/use-payouts.ts`** (filter NestPurse market_sale txns)

```typescript
"use client";

import useSWR from "swr";
import { nestPurseApi } from "@/lib/nestpurse-api";

export function usePayouts(limit = 50) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["seller-payouts", limit],
    () => nestPurseApi.getTransactions({ limit }),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const payouts = (res?.data?.transactions ?? []).filter((t) => t.method === "market_sale");

  return { payouts, isLoading, error: !!(error || res?.error), mutate };
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-seller-orders.ts hooks/use-payouts.ts
git commit -m "feat(seller): hooks for orders + payouts"
```

---

## Task 5: Order board components

**Files:**
- Create: `components/seller/order-status-tabs.tsx`
- Create: `components/seller/advance-status-button.tsx`
- Create: `components/seller/seller-order-row.tsx`
- Create: `components/seller/order-board.tsx`

- [ ] **Step 1: `components/seller/order-status-tabs.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";

export type OrderTabKey = "new" | "packaged" | "on_the_way" | "delivered" | "completed" | "rejected";

export const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "packaged", label: "Packaged" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

export function OrderStatusTabs({
  active, counts, onChange,
}: { active: OrderTabKey; counts: Record<OrderTabKey, number>; onChange: (k: OrderTabKey) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ORDER_TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {t.label}{counts[t.key] ? ` (${counts[t.key]})` : ""}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `components/seller/advance-status-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

const NEXT: Record<string, { next: TrackingStatus; label: string } | null> = {
  received: { next: "packaged", label: "Mark packaged" },
  packaged: { next: "on_the_way", label: "Mark on the way" },
  on_the_way: { next: "delivered", label: "Mark delivered" },
  delivered: null,
};

export function AdvanceStatusButton({
  order, onAdvance,
}: { order: SellerOrder; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  const [busy, setBusy] = useState(false);

  // Terminal buyer-side states: nothing for the seller to do.
  if (order.status === "accepted") return <span className="text-xs text-primary">Completed · paid out</span>;
  if (order.status === "rejected") return <span className="text-xs text-destructive">Rejected by buyer</span>;
  if (order.trackingStatus === "delivered") return <span className="text-xs text-muted-foreground">Awaiting buyer confirmation</span>;

  const step = NEXT[order.trackingStatus];
  if (!step) return null;

  const go = async () => {
    setBusy(true);
    const r = await onAdvance(order.id, step.next);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success(step.label.replace("Mark", "Marked"));
  };

  return <Button size="sm" onClick={go} disabled={busy}>{step.label}</Button>;
}
```

- [ ] **Step 3: `components/seller/seller-order-row.tsx`**

```tsx
"use client";

import { AdvanceStatusButton } from "./advance-status-button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

function addressLine(snap: Record<string, unknown> | null): string {
  if (!snap) return "No address";
  const city = (snap.city as string) || "";
  const state = (snap.state as string) || "";
  const name = (snap.fullName as string) || "";
  return [name, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No address";
}

export function SellerOrderRow({
  order, onAdvance,
}: { order: SellerOrder; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">#{order.id.slice(0, 8)}</span>
        <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{order.status}</span>
        <span className="ml-auto text-sm font-semibold text-primary">₦{order.sellerAmount.toLocaleString()}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 shrink-0 rounded-lg border border-border px-2 py-1">
            <div className="size-8 rounded bg-muted overflow-hidden">
              {it.product?.imageUrl && <img src={it.product.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="text-xs">{it.product?.name ?? "Item"} ×{it.quantity}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{addressLine(order.addressSnapshot)}</span>
        <AdvanceStatusButton order={order} onAdvance={onAdvance} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `components/seller/order-board.tsx`** (tabs + filtered list + skeleton + empty)

```tsx
"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusTabs, type OrderTabKey } from "./order-status-tabs";
import { SellerOrderRow } from "./seller-order-row";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

function tabOf(o: SellerOrder): OrderTabKey {
  if (o.status === "accepted") return "completed";
  if (o.status === "rejected") return "rejected";
  if (o.status === "delivered" || o.trackingStatus === "delivered") return "delivered";
  if (o.trackingStatus === "packaged") return "packaged";
  if (o.trackingStatus === "on_the_way") return "on_the_way";
  return "new"; // paid + received
}

export function OrderBoard({
  orders, isLoading, onAdvance,
}: {
  orders: SellerOrder[]; isLoading: boolean;
  onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }>;
}) {
  const [active, setActive] = useState<OrderTabKey>("new");

  const counts = useMemo(() => {
    const c: Record<OrderTabKey, number> = { new: 0, packaged: 0, on_the_way: 0, delivered: 0, completed: 0, rejected: 0 };
    orders.forEach((o) => { c[tabOf(o)] += 1; });
    return c;
  }, [orders]);

  const visible = orders.filter((o) => tabOf(o) === active);

  return (
    <div className="space-y-4">
      <OrderStatusTabs active={active} counts={counts} onChange={setActive} />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No orders here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => <SellerOrderRow key={o.id} order={o} onAdvance={onAdvance} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/order-status-tabs.tsx components/seller/advance-status-button.tsx components/seller/seller-order-row.tsx components/seller/order-board.tsx
git commit -m "feat(seller): order board components (tabs, row, advance button)"
```

---

## Task 6: Orders page

**Files:**
- Create: `app/seller/orders/page.tsx`

- [ ] **Step 1: Create `app/seller/orders/page.tsx`**

READ `app/seller/store/page.tsx` first to copy the exact shell + no-store handling.

```tsx
"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderBoard } from "@/components/seller/order-board";
import { useMyStore } from "@/hooks/use-my-store";
import { useSellerOrders } from "@/hooks/use-seller-orders";

export default function SellerOrdersPage() {
  const { store, hasStore, isLoading: storeLoading } = useMyStore();
  const { orders, isLoading: ordersLoading, advance } = useSellerOrders(store?.id ?? null);

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
              <BreadcrumbItem><BreadcrumbPage>Orders</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
          {storeLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : !hasStore || !store ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">You need a store before you can receive orders.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <OrderBoard orders={orders} isLoading={ordersLoading} onAdvance={advance} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add "app/seller/orders/page.tsx"
git commit -m "feat(seller): orders page (status-tabbed board)"
```

---

## Task 7: Earnings components + page

**Files:**
- Create: `components/seller/earnings-cards.tsx`
- Create: `components/seller/payout-history.tsx`
- Create: `app/seller/earnings/page.tsx`

- [ ] **Step 1: `components/seller/earnings-cards.tsx`**

```tsx
import { Clock, Wallet } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function EarningsCards({ store }: { store: SellerStore }) {
  const pending = store.pendingBalance ?? 0;
  const earned = store.totalEarned ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Clock className="size-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Pending</p>
        <p className="text-2xl font-semibold">₦{pending.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Held until buyers confirm delivery.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <Wallet className="size-5 text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Total earned</p>
        <p className="text-2xl font-semibold text-primary">₦{earned.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Paid into your NestPurse wallet.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/seller/payout-history.tsx`**

```tsx
"use client";

import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayouts } from "@/hooks/use-payouts";

export function PayoutHistory() {
  const { payouts, isLoading } = usePayouts();

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  if (payouts.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No payouts yet</p>;

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {payouts.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-1">{p.narration || "Marketplace payout"}</p>
            <p className="text-xs text-muted-foreground">{p.date ? format(new Date(p.date), "d MMM yyyy, h:mma") : ""}</p>
          </div>
          <span className="text-sm font-semibold text-primary">+₦{p.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

> NOTE: `date-fns` is already a dependency (used in `app/nestpurse/page.tsx`). If an import error occurs, confirm the import path `import { format } from "date-fns"`.

- [ ] **Step 3: `app/seller/earnings/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EarningsCards } from "@/components/seller/earnings-cards";
import { PayoutHistory } from "@/components/seller/payout-history";
import { useMyStore } from "@/hooks/use-my-store";

export default function SellerEarningsPage() {
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
              <BreadcrumbItem><BreadcrumbPage>Earnings</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
          {isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : !hasStore || !store ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">Earnings appear once you have a store and sales.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <>
              <EarningsCards store={store} />
              <div className="space-y-3">
                <h2 className="font-semibold">Payout history</h2>
                <PayoutHistory />
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/earnings-cards.tsx components/seller/payout-history.tsx "app/seller/earnings/page.tsx"
git commit -m "feat(seller): earnings page (pending/earned cards + payout history)"
```

---

## Task 8: Sidebar entries

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Add Orders + Earnings to the "Sell on NestMarket" group**

In `components/app-sidebar.tsx`, the "Sell on NestMarket" group's `items` array currently is `Dashboard`, `My Store`, `Products`. Add two entries after `Products`:

```tsx
        { title: "Orders", url: "/seller/orders" },
        { title: "Earnings", url: "/seller/earnings" },
```

- [ ] **Step 2: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in new files; build lists `/seller/orders` and `/seller/earnings`.

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat(seller): sidebar Orders + Earnings entries"
```

---

## Task 9: Mock fixtures for C2 preview

**Files:**
- Modify: `lib/dev-mock.ts`

> Gated on `NEXT_PUBLIC_MOCK=1`. This makes `/seller/orders` and `/seller/earnings` previewable without a backend. The seller store mock already exists from C1 (`myStore`, starts `null`). For a useful preview, seed a store + orders.

- [ ] **Step 1: Seed seller orders + earnings in the mock**

In `lib/dev-mock.ts`, near the seller section (after `let myProducts`), add seller orders + earnings figures:

```typescript
// Seller order board fixtures (C2)
const sellerOrders = [
  { id: "so-1001", buyerId: "buyer-x", storeId: "my-st", totalAmount: 4500, deliveryFee: 800, adminFee: 225, sellerAmount: 4275, status: "paid", trackingStatus: "received", addressSnapshot: { fullName: "Ada O.", city: "Ikeja", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-06-01T08:00:00Z", deliveredAt: null, acceptedAt: null, rejectedAt: null, items: [{ id: "soi-1", productId: "p-x", quantity: 1, priceAtPurchase: 4500, product: { id: "p-x", name: "Party Jollof Combo", imageUrl: img("jollof") } }] },
  { id: "so-1002", buyerId: "buyer-y", storeId: "my-st", totalAmount: 2400, deliveryFee: 600, adminFee: 120, sellerAmount: 2280, status: "paid", trackingStatus: "packaged", addressSnapshot: { fullName: "Tunde B.", city: "Surulere", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-05-31T14:00:00Z", deliveredAt: null, acceptedAt: null, rejectedAt: null, items: [{ id: "soi-2", productId: "p-y", quantity: 2, priceAtPurchase: 1200, product: { id: "p-y", name: "Plantain Chips", imageUrl: img("plantain") } }] },
  { id: "so-1003", buyerId: "buyer-z", storeId: "my-st", totalAmount: 9000, deliveryFee: 800, adminFee: 450, sellerAmount: 8550, status: "delivered", trackingStatus: "delivered", addressSnapshot: { fullName: "Ngozi", city: "Lekki", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-05-30T10:00:00Z", deliveredAt: "2026-05-31T16:00:00Z", acceptedAt: null, rejectedAt: null, items: [{ id: "soi-3", productId: "p-z", quantity: 1, priceAtPurchase: 9000, product: { id: "p-z", name: "Ofada Rice 5kg", imageUrl: img("ofada") } }] },
  { id: "so-1004", buyerId: "buyer-w", storeId: "my-st", totalAmount: 1500, deliveryFee: 700, adminFee: 75, sellerAmount: 1425, status: "accepted", trackingStatus: "delivered", addressSnapshot: { fullName: "Bola", city: "Yaba", state: "Lagos" }, payoutStatus: "completed", rejectionReason: null, createdAt: "2026-05-27T10:00:00Z", deliveredAt: "2026-05-28T12:00:00Z", acceptedAt: "2026-05-28T13:00:00Z", rejectedAt: null, items: [{ id: "soi-4", productId: "p-w", quantity: 1, priceAtPurchase: 1500, product: { id: "p-w", name: "Chin Chin 500g", imageUrl: img("chinchin") } }] },
];
const sellerEarnings = { pendingBalance: 15105, totalEarned: 42750 };
```

Then update the existing mock seller helpers so the store carries earnings and the count of products. Find `newStore` and add the earnings fields to its returned object (so a created store shows earnings too):

```typescript
// inside newStore(...), add to the returned object:
//   pendingBalance: sellerEarnings.pendingBalance,
//   totalEarned: sellerEarnings.totalEarned,
```

(Apply that by editing the `newStore` return to include `pendingBalance: sellerEarnings.pendingBalance, totalEarned: sellerEarnings.totalEarned`.)

- [ ] **Step 2: Add the C2 mock routes**

In `mockFetch`, in the seller section, add BEFORE the existing buyer `/stores/:id` reviews/detail handlers (so `/stores/:id/transactions` matches first), and add the tracking PATCH + market_sale payouts:

```typescript
  // ---- Seller: order board + earnings (C2) ----
  if (path.includes("/nestmarkets/stores/") && path.endsWith("/transactions") && m === "GET") {
    return ok({ success: true, data: sellerOrders, pagination: { total: sellerOrders.length, page: 1, limit: 50, pages: 1 } });
  }
  if (path.includes("/nestmarkets/orders/") && path.endsWith("/tracking") && m === "PATCH") {
    const id = path.split("/orders/")[1].replace("/tracking", "");
    const o = sellerOrders.find((x) => x.id === id);
    if (o) { o.trackingStatus = body?.status; if (body?.status === "delivered") o.status = "delivered"; }
    return ok({ success: true, data: o });
  }
```

And ensure the NestPurse transactions mock returns a couple of `market_sale` entries for payout history. Find the existing notifications/fallback area and add a transactions handler (if one doesn't already exist):

```typescript
  if (path.includes("/api/nestpurse/transactions")) {
    return ok({
      transactions: [
        { id: "tx-1", type: "credit", amount: 4275, status: "success", method: "market_sale", reference: "MARKET_SALE_so-1004", date: "2026-05-28T13:00:00Z", narration: "Payout for order so-1004" },
        { id: "tx-2", type: "credit", amount: 8550, status: "success", method: "market_sale", reference: "MARKET_SALE_old", date: "2026-05-20T10:00:00Z", narration: "Payout for order so-0990" },
        { id: "tx-3", type: "debit", amount: 1000, status: "success", method: "nestmarkets_fee", reference: "STORE-CREATION", date: "2026-05-15T09:00:00Z", narration: "Store creation fee" },
      ],
      pagination: { hasMore: false, limit: 50 },
      filters: {},
    });
  }
```

> If a `/api/nestpurse/transactions` handler already exists in the mock, merge the `market_sale` entries into it instead of duplicating.

- [ ] **Step 3: For a richer preview, start with a store**

In `lib/dev-mock.ts`, the C1 mock initializes `let myStore: any = null;`. To preview C2 immediately (orders/earnings need a store), set the initial value to a seeded store:

```typescript
let myStore: any = { id: "my-st", ownerId: ME, name: "Demo Store", description: "My demo shop", logoUrl: img("mystore-logo",100,100), bannerUrl: img("mystore-banner",800,240), isVerified: true, status: "active", latitude: null, longitude: null, averageRating: 4.7, ratingCount: 12, businessAddress: "12 Demo Rd, Lagos", cacNumber: "RC123456", verificationRequestedAt: "2026-05-20T00:00:00Z", createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-20T00:00:00Z", _count: { products: 3 }, pendingBalance: 15105, totalEarned: 42750 };
```

(Leave a comment that flipping it back to `null` previews the C1 create-store flow.)

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors. (Mock is plain TS; not type-checked against the seller types but should be syntactically clean.)

```bash
git add lib/dev-mock.ts
git commit -m "chore(dev-mock): seller order board + earnings fixtures (C2 preview)"
```

> NOTE: `lib/dev-mock.ts` + `lib/api.ts` mock hooks are intentionally uncommitted/optional from earlier. If the working tree shows them modified, committing the mock is fine (it's gated on the env flag and inert in prod). Confirm with the user only if unsure; default to committing the mock fixture so C2 preview persists.

---

## Task 10: Cross-screen QA

- [ ] **Step 1: Manual walkthrough** (`npm run dev`, `NEXT_PUBLIC_MOCK=1` or backend deployed)

1. Sidebar "Sell on NestMarket" shows Orders + Earnings.
2. `/seller/orders`: tabs with counts; "New" shows the paid/received order with "Mark packaged" → advances to Packaged tab; continue → On the way → Delivered ("Awaiting buyer confirmation"); Completed tab shows the accepted order ("Completed · paid out"); Rejected tab if any.
3. `/seller/earnings`: Pending + Total earned cards show figures; payout history lists `market_sale` credits only (no debits/fees).
4. No-store account → both pages show "Create a store first" CTA.

- [ ] **Step 2: Dark mode + responsive** — toggle dark mode; resize to ~375px (tabs scroll, rows stack). Gold tokens only, no emerald/slate.

- [ ] **Step 3: Final build green** — `npm run build` succeeds with `/seller/orders` + `/seller/earnings`.

---

## Self-review notes (coverage map)

- Spec §3 backend (pendingBalance + totalEarned on /my-store) → Task 1. §4.1 routes+sidebar → Tasks 6, 7, 8. §4.2 types → Task 2. §4.3 api → Task 3. §4.4 hooks → Task 4. §4.5 components → Tasks 5, 7. §4.6 flows (board filter/advance, earnings) → Tasks 5, 6, 7. §4.7 errors/states (no store, empty, rollback, undefined-balance → ₦0) → Tasks 4 (rollback), 5 (empty/skeleton), 7 (`?? 0`). §4.8 mock → Task 9.
- §6 open items: `decryptBalance` already imported (Task 1 note); `purseTransaction` fields verified (`profileId`/`method`/`amount`/`status`); "New" tab defined as paid+received (Task 5 `tabOf`).
- Graceful undefined balances: `EarningsCards` uses `?? 0` so it renders before backend deploy.
