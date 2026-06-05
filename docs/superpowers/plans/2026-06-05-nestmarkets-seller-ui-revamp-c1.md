# NestMarkets Seller UI Revamp C1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the seller `/seller` landing into a rich Narrative-Flow dashboard, move store editing into a tabbed dialog, gate the seller sidebar on store existence, and make `/seller/store` create-only.

**Architecture:** Frontend-only, no new dependencies. New presentational components under `components/seller/`, a store-aware sidebar via `useMyStore`, and `app/seller/page.tsx` recomposed. Reuses existing `StoreForm`, `VerificationPanel`, `ImagePicker`, `StoreStatusBadge`, `CreateStoreWizard`, `useMyStore`, `useSellerOrders`, `useMyProducts`. Revenue chart is CSS/SVG (no chart lib). framer-motion for subtle animation. All bound to GrowNest gold/warm theme tokens.

**Tech Stack:** Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, canvas-confetti, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck** + manual; final task `lint` + `build`. All commits to **`main`** (no feature branch — user preference).

**Reference spec:** `docs/superpowers/specs/2026-06-05-nestmarkets-seller-ui-revamp-c1-design.md`

**Key facts (verified against code):**
- `hooks/use-my-store.ts`: `useMyStore()` → `{ store, hasStore, isLoading, error, mutate }`; `SELLER_STORE_KEY = "seller-store"`. Store fields: `id, name, description, logoUrl, bannerUrl, status, isVerified, businessAddress, cacNumber, verificationRequestedAt, averageRating, ratingCount, _count?.products, pendingBalance?, totalEarned?`.
- `hooks/use-seller-orders.ts`: `useSellerOrders(storeId|null)` → `{ orders, pagination, isLoading, error, advance, mutate }`. `advance(orderId, nextTrackingStatus)` → `{error?}` (optimistic). `SellerOrder`: `id, status, trackingStatus, sellerAmount, totalAmount, items[], createdAt, addressSnapshot, buyerId`.
- `hooks/use-my-products.ts`: `useMyProducts(enabled: boolean)` → `{ products, isLoading, error, mutate }`. `SellerProduct`: `id, name, price, imageUrl, category, stockLevel, isActive`.
- `components/seller/store-form.tsx`: exports `StoreForm` (`{ initial?, value, onChange }`), `StoreFormValue` (`{name,description,businessAddress,logo,banner}`), `emptyStoreForm(initial?)`, `storeFormToFormData(value, includePin?)`.
- `components/seller/verification-panel.tsx`: exports `VerificationPanel({ store })` — self-contained (address+CAC+request+status; verified short-circuit). Reuse as the dialog's Verification tab body.
- `components/seller/store-status-badge.tsx`: `StoreStatusBadge({ store })`.
- `components/seller/create-store-wizard.tsx`: `CreateStoreWizard` — 2-step (details → PIN, ₦1,000), confetti+revalidate+route on success. Used by no-store flow.
- `components/seller/image-picker.tsx`: `ImagePicker({ label, initialUrl?, onChange, aspect })`.
- `lib/seller-api.ts`: `sellerApi.updateStore(formData)`, `requestVerification(body)`, etc.
- `components/app-sidebar.tsx`: client component (`"use client"`, uses `useAuth`, `useSWR`, `React.useState/useEffect`). Static `data.navMain` array; the "Sell on NestMarket" group is the LAST entry in `data.navMain` with `items` = [Dashboard, My Store, Products, Orders, Earnings, Messages]. Rendered via `<NavMain items={data.navMain} />` inside `<React.Suspense>`. `components/nav-main.tsx` sub-items support optional `badge?: React.ReactNode`.
- shadcn present: `dialog`, `tabs`, `card`, `badge`, `button`, `skeleton`, `avatar`, `tooltip`, `pin-input`, `sheet`, `dropdown-menu`. Deps present: `framer-motion`, `canvas-confetti`, `sonner`, `lucide-react`. NO charting lib (use CSS/SVG).
- Current `app/seller/page.tsx`: no-store CTA + has-store (store header card + `DashboardStats` + quick-link cards). `components/seller/dashboard-stats.tsx` will be superseded.
- Current `app/seller/store/page.tsx`: no-store → `CreateStoreWizard`; has-store → `StoreForm` edit + `VerificationPanel`. Will become create-only.
- Frontend repo `c:\Users\ambal\Desktop\Gigs\grownest-web`, branch **main**.

**Token rules:** gold = `bg-primary`/`text-primary`/`text-primary-foreground`; surfaces `bg-card`/`bg-background`; muted `bg-muted`/`text-muted-foreground`; borders `border-border`; errors `text-destructive`. Gold gradient = `bg-gradient-to-br from-primary to-primary/70`. `<img>` for images. NO hex/emerald/slate/gray-N/green-N (status pills may use semantic tones via tokens; keep gold-warm).

---

## Task 1: Store-aware sidebar (gating + drop My Store)

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Compute seller nav items from store existence**

In `components/app-sidebar.tsx`, add the import:
```tsx
import { useMyStore } from "@/hooks/use-my-store"
```

Inside `AppSidebar(...)`, after the existing hooks (near `const { user: authUser, isAuthenticated } = useAuth();`), add:
```tsx
  const { hasStore, isLoading: storeLoading } = useMyStore();
```

The "Sell on NestMarket" group is the last item in `data.navMain`. Build a derived nav array that swaps that group's `items` based on store state. Just before the `return (`, add:
```tsx
  const sellerFullItems = [
    { title: "Dashboard", url: "/seller" },
    { title: "Products", url: "/seller/products" },
    { title: "Orders", url: "/seller/orders" },
    { title: "Earnings", url: "/seller/earnings" },
    { title: "Messages", url: "/seller/chat", badge: <SellerChatNavBadge /> },
  ];
  const navMainItems = data.navMain.map((group) =>
    group.title === "Sell on NestMarket"
      ? { ...group, items: (!storeLoading && !hasStore) ? [{ title: "Dashboard", url: "/seller" }] : sellerFullItems }
      : group
  );
```

Then change the render from `items={data.navMain}` to `items={navMainItems}`:
```tsx
          <NavMain items={navMainItems} />
```

Finally, REMOVE the static "My Store" entry from `data.navMain`'s "Sell on NestMarket" group (the `{ title: "My Store", url: "/seller/store" }` object) so the static source no longer lists it. (The derived `sellerFullItems` above is now the source of truth; keeping the static array tidy avoids confusion.)

> Note: while `storeLoading` is true we show the full list is NOT desired; we default to showing Dashboard-only only when we KNOW there's no store (`!storeLoading && !hasStore`). While loading, `hasStore` is false but `storeLoading` true → condition false → full list shows briefly. To avoid a flash for genuine no-store users, that's acceptable (no store users still see Dashboard which is valid). Keep as written.

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/app-sidebar.tsx
git commit -m "feat(seller): store-aware sidebar gating + drop My Store link"
```

---

## Task 2: Store Edit Dialog

**Files:**
- Create: `components/seller/store-edit-dialog.tsx`

- [ ] **Step 1: Create the tabbed dialog**

Reuses `StoreForm` + `storeFormToFormData` (Details) and `VerificationPanel` (Verification).

```tsx
"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "./store-form";
import { VerificationPanel } from "./verification-panel";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import type { SellerStore } from "@/types/seller";

export function StoreEditDialog({
  store, open, onOpenChange, defaultTab = "details",
}: {
  store: SellerStore; open: boolean; onOpenChange: (o: boolean) => void;
  defaultTab?: "details" | "verification";
}) {
  const [form, setForm] = useState<StoreFormValue>(emptyStoreForm(store));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const r = await sellerApi.updateStore(storeFormToFormData(form));
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not update store");
    toast.success("Store updated");
    globalMutate([SELLER_STORE_KEY]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit store</DialogTitle></DialogHeader>
        <Tabs defaultValue={defaultTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 pt-4">
            <StoreForm initial={store} value={form} onChange={setForm} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
              <Button onClick={save} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save changes
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="verification" className="pt-4">
            <VerificationPanel store={store} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

> Note: confirm `components/ui/tabs.tsx` exports `Tabs/TabsList/TabsTrigger/TabsContent` (it does — used elsewhere). `VerificationPanel` already self-revalidates `SELLER_STORE_KEY`.

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/store-edit-dialog.tsx
git commit -m "feat(seller): store edit dialog (Details | Verification tabs)"
```

---

## Task 3: Create-store landing (no-store hero)

**Files:**
- Create: `components/seller/create-store-landing.tsx`

- [ ] **Step 1: Create the welcoming no-store landing**

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Store, CheckCircle2, Zap, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateStoreLanding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl mx-auto text-center py-16 md:py-24"
    >
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
        <Store className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">Start selling on NestMarket</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Turn your GrowNest audience into customers. List products, manage orders, and get paid directly into your NestPurse.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left space-y-3">
        {[
          { icon: <CheckCircle2 className="size-4 text-primary" />, text: "Reach thousands of local buyers" },
          { icon: <Zap className="size-4 text-primary" />, text: "Instant payouts to your NestPurse wallet" },
          { icon: <Boxes className="size-4 text-primary" />, text: "Easy order & inventory management" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">{f.icon}<span>{f.text}</span></div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        One-time setup fee: <span className="font-semibold text-foreground">₦1,000</span> (deducted from NestPurse)
      </div>
      <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
        <Link href="/seller/store">Create your store now</Link>
      </Button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/create-store-landing.tsx
git commit -m "feat(seller): create-store landing (no-store hero)"
```

---

## Task 4: Dashboard hero + verification banner

**Files:**
- Create: `components/seller/dashboard-hero.tsx`
- Create: `components/seller/verification-banner.tsx`

- [ ] **Step 1: `components/seller/dashboard-hero.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function DashboardHero({ store }: { store: SellerStore }) {
  const pending = store.pendingBalance ?? 0;
  const earned = store.totalEarned ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 md:p-8"
    >
      <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
        <TrendingUp className="size-4" /> Earnings
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-primary-foreground/80">Total earned</p>
          <p className="text-3xl font-bold">₦{earned.toLocaleString()}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Paid into your NestPurse</p>
        </div>
        <div>
          <p className="text-sm text-primary-foreground/80">Pending</p>
          <p className="text-3xl font-bold">₦{pending.toLocaleString()}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Held until buyers confirm delivery</p>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: `components/seller/verification-banner.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function VerificationBanner({ store, onReview }: { store: SellerStore; onReview: () => void }) {
  if (store.isVerified && store.status === "active") return null;
  const pending = !!store.verificationRequestedAt;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-muted px-4 py-3 flex items-center gap-3"
    >
      <ShieldAlert className="size-5 text-primary shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">
        {pending
          ? "Your store is pending verification. Products stay hidden from buyers until it's approved."
          : "Verify your store to make your products visible in the marketplace."}
      </p>
      <button onClick={onReview} className="text-sm font-medium text-primary shrink-0">
        {pending ? "View" : "Verify now"}
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/dashboard-hero.tsx components/seller/verification-banner.tsx
git commit -m "feat(seller): dashboard hero + verification banner"
```

---

## Task 5: KPI row + revenue bars

**Files:**
- Create: `components/seller/kpi-row.tsx`
- Create: `components/seller/revenue-bars.tsx`

- [ ] **Step 1: `components/seller/kpi-row.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Activity, CheckCircle2, Package, Star, Receipt } from "lucide-react";
import type { SellerStore, SellerOrder } from "@/types/seller";

export function KpiRow({
  store, orders, ordersLoading,
}: { store: SellerStore; orders: SellerOrder[]; ordersLoading: boolean }) {
  const total = orders.length;
  const completed = orders.filter((o) => o.status === "accepted").length;
  const active = orders.filter((o) => o.status !== "accepted" && o.status !== "rejected").length;
  const aov = total ? Math.round(orders.reduce((s, o) => s + o.sellerAmount, 0) / total) : 0;

  const cards = [
    { icon: <ShoppingBag className="size-4" />, label: "Total orders", value: ordersLoading ? "—" : String(total) },
    { icon: <Activity className="size-4" />, label: "Active", value: ordersLoading ? "—" : String(active) },
    { icon: <CheckCircle2 className="size-4" />, label: "Completed", value: ordersLoading ? "—" : String(completed) },
    { icon: <Package className="size-4" />, label: "Products", value: String(store._count?.products ?? 0) },
    { icon: <Star className="size-4" />, label: "Rating", value: `${store.averageRating?.toFixed(1) ?? "—"}` },
    { icon: <Receipt className="size-4" />, label: "Avg order", value: ordersLoading ? "—" : `₦${aov.toLocaleString()}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          className="rounded-2xl border border-border bg-card p-3"
        >
          <div className="text-primary">{c.icon}</div>
          <p className="text-xs text-muted-foreground mt-2">{c.label}</p>
          <p className="text-lg font-semibold">{c.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `components/seller/revenue-bars.tsx`** (CSS/SVG bars, last 7 days)

```tsx
"use client";

import { motion } from "framer-motion";
import type { SellerOrder } from "@/types/seller";

export function RevenueBars({ orders }: { orders: SellerOrder[] }) {
  // Bucket sellerAmount by day for the last 7 days.
  const days: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const total = orders
      .filter((o) => o.createdAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.sellerAmount, 0);
    days.push({ label, total });
  }
  const max = Math.max(1, ...days.map((d) => d.total));
  const hasData = days.some((d) => d.total > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Revenue · last 7 days</h2>
      </div>
      {!hasData ? (
        <div className="h-40 flex flex-col items-center justify-center text-center">
          <div className="w-full border-t border-dashed border-border mb-3" />
          <p className="text-sm text-muted-foreground">Your growth story starts here</p>
        </div>
      ) : (
        <div className="flex items-end gap-2 h-40">
          {days.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.total / max) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="w-full rounded-t-md bg-primary min-h-[2px]"
                  title={`₦${d.total.toLocaleString()}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/kpi-row.tsx components/seller/revenue-bars.tsx
git commit -m "feat(seller): KPI row + CSS revenue bars"
```

---

## Task 6: Recent orders card + widgets

**Files:**
- Create: `components/seller/recent-orders-card.tsx`
- Create: `components/seller/low-stock-widget.tsx`
- Create: `components/seller/top-products-widget.tsx`

- [ ] **Step 1: `components/seller/recent-orders-card.tsx`**

Reuses the existing `AdvanceStatusButton` (from C2) for the advance action.

```tsx
"use client";

import Link from "next/link";
import { AdvanceStatusButton } from "./advance-status-button";
import type { SellerOrder, TrackingStatus } from "@/types/seller";

export function RecentOrdersCard({
  orders, onAdvance,
}: { orders: SellerOrder[]; onAdvance: (id: string, next: TrackingStatus) => Promise<{ error?: string }> }) {
  const recent = [...orders].slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Recent orders</h2>
        <Link href="/seller/orders" className="text-sm text-primary">View all</Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground p-6 text-center">No orders yet</p>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((o) => (
            <div key={o.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">#{o.id.slice(0, 8)}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{o.status}</span>
                <span className="ml-auto text-sm font-semibold text-primary">₦{o.sellerAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
              <AdvanceStatusButton order={o} onAdvance={onAdvance} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `components/seller/low-stock-widget.tsx`**

```tsx
"use client";

import { AlertTriangle } from "lucide-react";
import type { SellerProduct } from "@/types/seller";

export function LowStockWidget({ products }: { products: SellerProduct[] }) {
  const low = products.filter((p) => p.stockLevel <= 3).slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Low stock</h3>
      </div>
      {low.length === 0 ? (
        <p className="text-sm text-muted-foreground">All products well stocked.</p>
      ) : (
        <ul className="space-y-2">
          {low.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="line-clamp-1">{p.name}</span>
              <span className={p.stockLevel === 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {p.stockLevel === 0 ? "Out" : `${p.stockLevel} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `components/seller/top-products-widget.tsx`**

```tsx
"use client";

import { TrendingUp } from "lucide-react";
import type { SellerOrder, SellerProduct } from "@/types/seller";

export function TopProductsWidget({
  orders, products,
}: { orders: SellerOrder[]; products: SellerProduct[] }) {
  // Rank by units sold across order items.
  const counts = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((it) => {
    counts.set(it.productId, (counts.get(it.productId) ?? 0) + it.quantity);
  }));
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name ?? "Product", qty }));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Top products</h3>
      </div>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <ul className="space-y-2">
          {ranked.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="line-clamp-1">{i + 1}. {r.name}</span>
              <span className="text-muted-foreground">{r.qty} sold</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

> Note: `SellerOrderItem` has `productId` and `quantity` (verified in `types/seller.ts`). If the type lacks `productId` on items, fall back to ranking by `product?.name` — confirm during implementation.

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/recent-orders-card.tsx components/seller/low-stock-widget.tsx components/seller/top-products-widget.tsx
git commit -m "feat(seller): recent orders card + low-stock & top-products widgets"
```

---

## Task 7: Compose the dashboard page

**Files:**
- Modify: `app/seller/page.tsx`

- [ ] **Step 1: Rebuild `app/seller/page.tsx`**

Full replacement:

```tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { StoreStatusBadge } from "@/components/seller/store-status-badge";
import { CreateStoreLanding } from "@/components/seller/create-store-landing";
import { DashboardHero } from "@/components/seller/dashboard-hero";
import { VerificationBanner } from "@/components/seller/verification-banner";
import { KpiRow } from "@/components/seller/kpi-row";
import { RevenueBars } from "@/components/seller/revenue-bars";
import { RecentOrdersCard } from "@/components/seller/recent-orders-card";
import { LowStockWidget } from "@/components/seller/low-stock-widget";
import { TopProductsWidget } from "@/components/seller/top-products-widget";
import { StoreEditDialog } from "@/components/seller/store-edit-dialog";
import { useMyStore } from "@/hooks/use-my-store";
import { useSellerOrders } from "@/hooks/use-seller-orders";
import { useMyProducts } from "@/hooks/use-my-products";

export default function SellerDashboardPage() {
  const { store, hasStore, isLoading } = useMyStore();
  const { orders, isLoading: ordersLoading, advance } = useSellerOrders(store?.id ?? null);
  const { products } = useMyProducts(hasStore);
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<"details" | "verification">("details");

  const openEdit = (tab: "details" | "verification") => { setEditTab(tab); setEditOpen(true); };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Sell on NestMarket</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="max-w-5xl mx-auto space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            </div>
          ) : !hasStore || !store ? (
            <CreateStoreLanding />
          ) : (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted overflow-hidden">
                  {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-lg font-semibold truncate">{store.name}</h1>
                  <StoreStatusBadge store={store} />
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => openEdit("details")}>
                  <Pencil className="size-4" /> Edit store
                </Button>
              </div>

              <DashboardHero store={store} />
              <VerificationBanner store={store} onReview={() => openEdit("verification")} />
              <KpiRow store={store} orders={orders} ordersLoading={ordersLoading} />

              <div className="grid gap-5 lg:grid-cols-2">
                <RevenueBars orders={orders} />
                <RecentOrdersCard orders={orders} onAdvance={advance} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <LowStockWidget products={products} />
                <TopProductsWidget orders={orders} products={products} />
              </div>

              <StoreEditDialog store={store} open={editOpen} onOpenChange={setEditOpen} defaultTab={editTab} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

> Note: `StoreEditDialog` uses `defaultTab` on shadcn `Tabs` `defaultValue`; since `defaultValue` only applies on mount, the dialog content is always mounted. To make the verification banner reliably open on the Verification tab, the dialog is keyed by `editTab` so it remounts. Add `key={editTab}` to `<StoreEditDialog ... />` in this file so switching the requested tab re-mounts it with the right `defaultValue`.

Apply that note — the dialog render line should be:
```tsx
              <StoreEditDialog key={editTab} store={store} open={editOpen} onOpenChange={setEditOpen} defaultTab={editTab} />
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add "app/seller/page.tsx"
git commit -m "feat(seller): compose rich dashboard (hero, KPIs, revenue, orders, widgets, edit dialog)"
```

---

## Task 8: Make /seller/store create-only

**Files:**
- Modify: `app/seller/store/page.tsx`

- [ ] **Step 1: Redirect to /seller when a store already exists**

`/seller/store` should now only host the create flow. Replace its has-store branch with a redirect. Edit `app/seller/store/page.tsx`:

Add imports:
```tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
```

Inside the component (after `useMyStore()`):
```tsx
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && hasStore) router.replace("/seller");
  }, [isLoading, hasStore, router]);
```

Then change the has-store branch of the render to a brief redirecting placeholder instead of the old `StoreForm` + `VerificationPanel` edit UI:
```tsx
          ) : hasStore ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Redirecting…</div>
          ) : (
            <CreateStoreWizard />
          )}
```

Keep the no-store → `CreateStoreWizard` branch. Remove now-unused imports (`StoreForm`, `VerificationPanel`, `StoreStatusBadge`, `sellerApi`, etc.) if they become unused — let typecheck/lint guide which to drop.

- [ ] **Step 2: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in your files; build lists `/seller`, `/seller/store`, and the other seller routes.

- [ ] **Step 3: Commit**

```bash
git add "app/seller/store/page.tsx"
git commit -m "feat(seller): /seller/store is create-only (edit moved to dashboard dialog)"
```

---

## Task 9: Remove superseded DashboardStats + QA

**Files:**
- Delete: `components/seller/dashboard-stats.tsx` (superseded)

- [ ] **Step 1: Confirm no remaining importers, then delete**

Search for importers of `dashboard-stats`:
```bash
grep -rn "dashboard-stats" app components
```
Expected: no matches (the old `/seller` page was the only importer; Task 7 replaced it). If clean, delete the file:
```bash
git rm components/seller/dashboard-stats.tsx
```
If anything still imports it, switch that import to the new components first.

- [ ] **Step 2: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: clean; all seller routes present.

- [ ] **Step 3: Manual walkthrough** (`npm run dev`, `NEXT_PUBLIC_MOCK=1`)

1. No-store account: sidebar "Sell on NestMarket" shows only **Dashboard**; `/seller` shows the create landing → "Create your store" → wizard.
2. Has store: `/seller` shows the full dashboard — gold hero (earned/pending), verification banner if unverified (→ opens dialog Verification tab), KPI row, revenue bars (or "growth story" baseline), recent-order cards (advance works), low-stock + top-products widgets. Sidebar shows all links, **no "My Store"**.
3. "Edit store" → dialog opens on Details; tab to Verification; save updates + toast.
4. `/seller/store` with a store → redirects to `/seller`.
5. Dark mode + ~375px: hero stacks, KPI grid 2-up, no token violations.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(seller): remove superseded DashboardStats + revamp QA"
```

---

## Self-review notes (coverage map)

- Spec §2 scope → Tasks cover all four. §4.1 no-store → Task 3 (+ Task 7 wiring). §4.2 dashboard pieces → Tasks 4 (hero+banner), 5 (kpi+revenue), 6 (recent+widgets), 7 (compose). §5 store dialog → Task 2. §6 sidebar gating + create-only store page → Tasks 1, 8. §7 components map → Tasks 2–7; superseded DashboardStats removed in Task 9. §8 animation → framer-motion in Tasks 3–5. §9 tokens → enforced throughout (no hex/emerald/slate). §10 errors/states → no-store (3), zero-data (5 revenue baseline, 6 widget empties), skeletons (7), dialog errors (2).
- §11 open items: sidebar gating done client-side via `useMyStore` in `app-sidebar.tsx` (Task 1, with loading-flash note); `/seller/store` redirect via `router.replace` (Task 8); revenue bucketing = last 7 days daily (Task 5).
- Reuse confirmed: `StoreForm`/`storeFormToFormData`/`emptyStoreForm` (Task 2), `VerificationPanel` (Task 2), `AdvanceStatusButton` (Task 6), `CreateStoreWizard` (Task 8), `StoreStatusBadge` (Task 7), `ImagePicker` (via StoreForm). No new deps. Switch/products polish intentionally deferred to C2.
