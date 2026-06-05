# NestMarkets Buyer UI Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply "Narrative Flow" polish across the buyer marketplace screens and add a slide-over cart drawer (from the cart badge) with a same-store "you might also like" strip, keeping the full cart page.

**Architecture:** Frontend-only, no new deps. The structural change is a cart-drawer context + drawer mounted via a new `app/marketplace/layout.tsx`, with the cart badge becoming a drawer trigger; drawer and `/marketplace/cart` page share the existing `CartList` body. Everything else is visual polish to match the seller Narrative Flow system, bound to gold/warm tokens with subtle framer-motion.

**Tech Stack:** Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, Sonner, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck** + manual; final task `lint` + `build`. All commits to **`main`** (no feature branch — user preference).

**Reference spec:** `docs/superpowers/specs/2026-06-05-nestmarkets-buyer-ui-revamp-design.md`

**Key facts (verified against code):**
- Cart route is `app/marketplace/cart/page.tsx` (renders `CartList` + `CheckoutSheet`). `CartBadge` currently `<Link href="/marketplace/cart">`.
- `components/nestmarkets/cart-list.tsx`: `CartList({ onCheckout })` → maps `useCart().byStore` to `CartStoreBlock`; has loading + empty states.
- `components/nestmarkets/cart-store-block.tsx`: `CartStoreBlock({ store, items, onCheckout })`; `store: MarketStoreLite`, `items: CartItem[]`; uses `useCart().update/remove`.
- `hooks/use-cart.ts`: `useCart()` → `{ cart, items, count, byStore, isLoading, error, add, update, remove, mutate }`. `add(productId, quantity)`.
- `components/nestmarkets/checkout-sheet.tsx`: `CheckoutSheet({ storeId, open, onOpenChange })` (a shadcn `Dialog` currently, recently polished — has in-progress uncommitted edits).
- `components/nestmarkets/product-quick-view.tsx`: `ProductQuickView({ product, open, onOpenChange })`.
- `lib/nestmarkets-api.ts`: `nestMarketsApi.getStore(id)` → store detail incl. its products (`StoreResponse`, `data.products`). `useVendor(id)` hook wraps it (`hooks/use-vendor.ts`).
- Buyer components in `components/nestmarkets/`: cart-badge, cart-list, cart-store-block, category-filter, search-bar, product-card, product-grid, product-quick-view, vendor-card, vendor-grid, nearby-section, follow-button, store-reviews, order-card, order-tracking, rate-order-dialog, checkout-sheet, chat-*.
- Buyer pages: `app/marketplace/{page,cart/page,vendors/page,store/[id]/page,orders/page,chat/page}.tsx`. Each renders its own `SidebarProvider → AppSidebar → SidebarInset` + header with `<CartBadge />` in `ml-auto`.
- Pre-existing uncommitted edits already in tree (fold into this cycle, don't revert): `components/nestmarkets/checkout-sheet.tsx`, `components/nestmarkets/order-tracking.tsx`, plus `lib/api.ts` (dev-mock hook — leave alone) and untracked `components/ui/tabs.tsx` (leave).
- Token rules: gold `bg-primary`/`text-primary`/`text-primary-foreground`, soft gold `bg-primary/10 text-primary`, gradient `bg-gradient-to-br from-primary to-primary/70`, surfaces `bg-card`/`bg-background`, muted `bg-muted`/`text-muted-foreground`, borders `border-border`, errors `text-destructive`/`bg-destructive/10`. `<img>` for images. NO emerald/slate/amber-N/stone-N/gray-N/green-N/hex. Accept action = gold `bg-primary` (NOT emerald). No wishlist/heart icon.
- Frontend repo `c:\Users\ambal\Desktop\Gigs\grownest-web`, branch **main**.

---

## Task 1: Cart-drawer context + marketplace layout

**Files:**
- Create: `context/cart-drawer.tsx`
- Create: `app/marketplace/layout.tsx`

- [ ] **Step 1: Create `context/cart-drawer.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CartDrawerValue {
  open: boolean;
  setOpen: (o: boolean) => void;
  openDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerValue | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CartDrawerContext.Provider value={{ open, setOpen, openDrawer: () => setOpen(true) }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  // Safe fallback so CartBadge still works if rendered outside the provider.
  if (!ctx) return { open: false, setOpen: () => {}, openDrawer: () => {} } as CartDrawerValue;
  return ctx;
}
```

- [ ] **Step 2: Create `app/marketplace/layout.tsx`** (provider + mounted drawer for all marketplace pages)

```tsx
import type { ReactNode } from "react";
import { CartDrawerProvider } from "@/context/cart-drawer";
import { CartDrawer } from "@/components/nestmarkets/cart-drawer";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <CartDrawerProvider>
      {children}
      <CartDrawer />
    </CartDrawerProvider>
  );
}
```

(Note: `CartDrawer` is created in Task 2. This file will not typecheck until Task 2 lands — implement Task 2 immediately after, or create a stub first. To keep each task green, do Task 2 BEFORE running typecheck/commit here; commit Tasks 1+2 together if needed. Simplest: create the `CartDrawer` stub in Step 3 below.)

- [ ] **Step 3: Temporary stub so this task compiles**

Create a minimal `components/nestmarkets/cart-drawer.tsx` stub now (replaced fully in Task 2):
```tsx
"use client";
export function CartDrawer() { return null; }
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add context/cart-drawer.tsx app/marketplace/layout.tsx components/nestmarkets/cart-drawer.tsx
git commit -m "feat(nestmarkets): cart-drawer context + marketplace layout (drawer mount)"
```

---

## Task 2: Cart drawer component + badge trigger

**Files:**
- Modify: `components/nestmarkets/cart-drawer.tsx` (replace stub)
- Modify: `components/nestmarkets/cart-badge.tsx`

- [ ] **Step 1: Implement `components/nestmarkets/cart-drawer.tsx`**

Reuses `CartList` (shared body) and opens `CheckoutSheet` for a chosen store; closes the drawer when checkout opens.

```tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CartList } from "./cart-list";
import { CheckoutSheet } from "./checkout-sheet";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/context/cart-drawer";

export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const { count } = useCart();
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const startCheckout = (storeId: string) => {
    setCheckoutStoreId(storeId);
    setOpen(false);          // close the cart drawer
    setCheckoutOpen(true);   // open the checkout sheet
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your basket{count > 0 ? ` (${count})` : ""}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 pt-2">
            <CartList onCheckout={startCheckout} />
          </div>
        </SheetContent>
      </Sheet>
      <CheckoutSheet storeId={checkoutStoreId} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
```

- [ ] **Step 2: Make `CartBadge` open the drawer**

Replace `components/nestmarkets/cart-badge.tsx`:
```tsx
"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/context/cart-drawer";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const { count } = useCart();
  const { openDrawer } = useCartDrawer();
  return (
    <button
      type="button"
      onClick={openDrawer}
      className={cn("relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors", className)}
      aria-label="Open cart"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/cart-drawer.tsx components/nestmarkets/cart-badge.tsx
git commit -m "feat(nestmarkets): cart drawer + badge opens drawer"
```

---

## Task 3: "You might also like" same-store strip

**Files:**
- Create: `components/nestmarkets/store-suggestions.tsx`
- Modify: `components/nestmarkets/cart-store-block.tsx`

- [ ] **Step 1: Create `components/nestmarkets/store-suggestions.tsx`**

Fetches the store's products via `nestMarketsApi.getStore(storeId)`, excludes items already in the cart, shows 3–4 mini-cards with a quick add.

```tsx
"use client";

import useSWR from "swr";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { useCart } from "@/hooks/use-cart";

export function StoreSuggestions({ storeId, excludeIds }: { storeId: string; excludeIds: string[] }) {
  const { add } = useCart();
  const { data: res } = useSWR(
    ["nestmarket-store", storeId],
    () => nestMarketsApi.getStore(storeId),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const all = res?.data?.data?.products ?? [];
  const suggestions = all
    .filter((p) => !excludeIds.includes(p.id) && p.isActive && p.stockLevel > 0)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  const quickAdd = async (id: string) => {
    const r = await add(id, 1);
    if (r.error) return toast.error(r.error);
    toast.success("Added to cart");
  };

  return (
    <div className="px-4 pb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">You might also like</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((p) => (
          <div key={p.id} className="w-24 shrink-0">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <button
                onClick={() => quickAdd(p.id)}
                className="absolute bottom-1 right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                aria-label={`Add ${p.name}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] line-clamp-1">{p.name}</p>
            <p className="text-[11px] font-semibold text-primary">₦{p.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> Note: confirm `nestMarketsApi.getStore` response path is `res.data.data.products` (matches `useVendor`/`StoreResponse`). The SWR key `["nestmarket-store", storeId]` is shared with `useVendor` — dedupes nicely.

- [ ] **Step 2: Render the strip inside `CartStoreBlock`**

In `components/nestmarkets/cart-store-block.tsx`, add the import and render the strip between the items list and the subtotal/checkout footer.

Add import:
```tsx
import { StoreSuggestions } from "./store-suggestions";
```
After the items `<div className="divide-y divide-border">...</div>` block and before the subtotal footer `<div className="flex items-center justify-between p-4 border-t border-border">`, insert:
```tsx
      <StoreSuggestions storeId={store.id} excludeIds={items.map((i) => i.productId)} />
```

> `CartItem` has `productId` (verified in types). If TS complains, use `items.map((i) => i.product.id)`.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/store-suggestions.tsx components/nestmarkets/cart-store-block.tsx
git commit -m "feat(nestmarkets): same-store 'you might also like' strip in cart"
```

---

## Task 4: Cart page uses drawer-aligned layout + label fix

**Files:**
- Modify: `app/marketplace/cart/page.tsx`
- Modify: `components/app-sidebar.tsx` (sidebar cart link label/href)

- [ ] **Step 1: Confirm sidebar cart link points to `/marketplace/cart`**

In `components/app-sidebar.tsx`, find the NestMarket group's cart item (currently labeled "My Baskets"). Ensure its `url` is `/marketplace/cart` (not `/marketplace/baskets`). If it reads `/marketplace/baskets`, update the `url` to `/marketplace/cart`. Keep the title "My Baskets".

- [ ] **Step 2: Keep the cart page rendering the shared body**

`app/marketplace/cart/page.tsx` already renders `CartList` + `CheckoutSheet`. No structural change needed; it now also benefits from the suggestions strip (via `CartStoreBlock`). Leave its existing checkout wiring as-is. (The drawer is the primary path; the page remains for direct visits.)

Verify the page still compiles unchanged.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/app-sidebar.tsx
git commit -m "fix(nestmarkets): sidebar cart link -> /marketplace/cart"
```

(If the sidebar already pointed to `/marketplace/cart`, skip the commit and note it.)

---

## Task 5: Buyer Narrative-Flow polish sweep

> This is a visual polish sweep mirroring the seller revamp. Match the seller components' style exactly (rounded-2xl `bg-card`/`border-border`, gold accents, soft pills, subtle framer-motion entrance/stagger, gold-gradient for money emphasis). Preserve ALL functionality, props, hooks, and data flow. Token rules from the header apply. `<img>` only. NO new deps. Fold in the pre-existing `checkout-sheet.tsx` + `order-tracking.tsx` edits (refine, don't revert).

**Files (polish each to match Narrative Flow):**
- `components/nestmarkets/product-card.tsx` — image-forward card (aspect-square image, store badge w/ rating, gold price, hover lift). NO heart/wishlist icon.
- `components/nestmarkets/product-grid.tsx` — `gap-6`, framer-motion stagger, skeleton + empty ("No products found").
- `components/nestmarkets/product-quick-view.tsx` — 2-col dialog on desktop (image | name, store+rating, ₦price, stock, description, qty stepper, gold Add-to-cart).
- `components/nestmarkets/category-filter.tsx` — gold-active pills, horizontal scroll.
- `components/nestmarkets/search-bar.tsx` — rounded input, leading search icon.
- `components/nestmarkets/vendor-card.tsx` — banner + overlapping logo avatar (ring), rating, product/follower counts, distance, "Visit Store" button.
- `components/nestmarkets/vendor-grid.tsx` — grid + stagger + empty.
- `components/nestmarkets/nearby-section.tsx` — polished opt-in geolocation card.
- `components/nestmarkets/follow-button.tsx` — gold/outline states.
- `components/nestmarkets/store-reviews.tsx` — review rows with avatar, stars, date; empty state.
- `components/nestmarkets/order-card.tsx` — Active/History context; read-only stepper (gold completed nodes, pulsing active via `animate-pulse`, muted upcoming; vertical timeline on mobile); Accept (gold `bg-primary`), Reject (outline + reason), Rate (★ modal), Message-seller deep link.
- `components/nestmarkets/order-tracking.tsx` — the stepper styling above (refine the in-progress edits).
- `components/nestmarkets/rate-order-dialog.tsx` — star picker + review polish.
- `components/nestmarkets/checkout-sheet.tsx` — refine in-progress edits: address picker, order summary (items + delivery + total), NestPurse balance card with soft gold tint (`bg-primary/10`), insufficient-balance (destructive + Top-up affordance), PIN, "Pay ₦X".
- `components/nestmarkets/cart-list.tsx` — polish empty state + spacing.
- Buyer pages: `app/marketplace/page.tsx`, `app/marketplace/vendors/page.tsx`, `app/marketplace/store/[id]/page.tsx`, `app/marketplace/orders/page.tsx`, `app/marketplace/chat/page.tsx` — consistent headers, spacing, max-width containers, section titles; ensure `<CartBadge />` remains in each header.

- [ ] **Step 1: Polish browse + product components**

Edit `product-card.tsx`, `product-grid.tsx`, `product-quick-view.tsx`, `category-filter.tsx`, `search-bar.tsx`, `app/marketplace/page.tsx` to the Narrative Flow look. Run `npm run typecheck` after. Then commit:
```bash
git add components/nestmarkets/product-card.tsx components/nestmarkets/product-grid.tsx components/nestmarkets/product-quick-view.tsx components/nestmarkets/category-filter.tsx components/nestmarkets/search-bar.tsx app/marketplace/page.tsx
git commit -m "feat(nestmarkets): browse + quick-view Narrative-Flow polish"
```

- [ ] **Step 2: Polish vendors + vendor profile**

Edit `vendor-card.tsx`, `vendor-grid.tsx`, `nearby-section.tsx`, `follow-button.tsx`, `store-reviews.tsx`, `app/marketplace/vendors/page.tsx`, `app/marketplace/store/[id]/page.tsx`. Typecheck. Commit:
```bash
git add components/nestmarkets/vendor-card.tsx components/nestmarkets/vendor-grid.tsx components/nestmarkets/nearby-section.tsx components/nestmarkets/follow-button.tsx components/nestmarkets/store-reviews.tsx app/marketplace/vendors/page.tsx "app/marketplace/store/[id]/page.tsx"
git commit -m "feat(nestmarkets): vendors + vendor profile Narrative-Flow polish"
```

- [ ] **Step 3: Polish checkout + cart visuals**

Edit `checkout-sheet.tsx` (refine in-progress edits), `cart-list.tsx`. Typecheck. Commit:
```bash
git add components/nestmarkets/checkout-sheet.tsx components/nestmarkets/cart-list.tsx
git commit -m "feat(nestmarkets): checkout sheet + cart list polish"
```

- [ ] **Step 4: Polish orders + tracking + rating**

Edit `order-card.tsx`, `order-tracking.tsx` (refine in-progress edits), `rate-order-dialog.tsx`, `app/marketplace/orders/page.tsx`. Keep Accept gold (not emerald). Typecheck. Commit:
```bash
git add components/nestmarkets/order-card.tsx components/nestmarkets/order-tracking.tsx components/nestmarkets/rate-order-dialog.tsx app/marketplace/orders/page.tsx
git commit -m "feat(nestmarkets): orders + tracking + rating Narrative-Flow polish"
```

- [ ] **Step 5: Polish chat page shell**

Edit `app/marketplace/chat/page.tsx` (and only lightly the shared `chat-*` components if it does NOT change behavior — prefer leaving shared chat components alone). Typecheck. Commit:
```bash
git add app/marketplace/chat/page.tsx
git commit -m "feat(nestmarkets): buyer chat page polish"
```

---

## Task 6: Final verification

- [ ] **Step 1: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in touched files; build lists all `/marketplace*` routes.

- [ ] **Step 2: Token-discipline scan**

Run:
```bash
grep -rnE "emerald|slate-[0-9]|amber-[0-9]|stone-[0-9]|\bgray-[0-9]|\bgreen-[0-9]|#[0-9a-fA-F]{4,6}" components/nestmarkets app/marketplace
```
Expected: no matches. Fix any.

- [ ] **Step 3: Manual walkthrough** (`npm run dev`, `NEXT_PUBLIC_MOCK=1`)

1. Browse: cart badge in header → click → **cart drawer slides in** with items grouped by store + "you might also like" strip; quick-add from the strip increments the badge.
2. "Checkout this store" in the drawer → drawer closes, checkout sheet opens → pay flow works.
3. `/marketplace/cart` page still renders the same grouped cart (+ suggestions) for direct visits; sidebar "My Baskets" → this page.
4. Vendors, vendor profile, orders (stepper + accept/reject/rate/message), chat — all polished, consistent.
5. Dark mode + ~375px reflow; no token violations.

- [ ] **Step 4: Final commit (only if QA fixes needed)**

Stage only buyer files you touched (NOT `lib/api.ts`):
```bash
git add components/nestmarkets app/marketplace
git commit -m "fix(nestmarkets): buyer revamp QA adjustments"
```
(Skip if nothing changed.)

---

## Self-review notes (coverage map)

- Spec §4 cart drawer → Tasks 1 (context+layout), 2 (drawer+badge), 4 (page/link). §4 "you might also like" → Task 3. §3 tokens + §5 screen polish → Task 5 (browse, vendors, profile, checkout, orders, chat). §7 animation → Task 5 (framer-motion). §8 states → preserved in each polished component. §6 components map → Tasks 1–5.
- §9 open items: drawer mechanism = context + `app/marketplace/layout.tsx` (Task 1); suggestions source = `getStore(id).products` excluding in-cart (Task 3); cart route `/marketplace/cart` confirmed + sidebar link fix (Task 4); no wishlist heart (Task 5 product-card note); Accept = gold not emerald (Task 5); in-progress checkout-sheet/order-tracking edits folded (Task 5 Steps 3–4).
- Backward-compat: `useCartDrawer` has a safe fallback so `CartBadge` works even if a page isn't under the marketplace layout. `CartList`/`CartStoreBlock` keep their existing `onCheckout` contract (drawer passes `startCheckout`).
- Pre-existing `lib/api.ts` (mock) + untracked `components/ui/tabs.tsx` left untouched; never `git add -A`.
