# NestMarkets — Buyer Portal (Browse → Cart → Checkout → Orders) Design

> **Date:** 2026-05-31
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `GrowNest.Africa` (backend) + `grownest-web` (frontend)

---

## 1. Goal

Build the **buyer side** of NestMarkets: browse verified products, view a product in a quick-view modal, add to a **server-side cart**, check out (with a flat delivery fee + PIN, paid from NestPurse), and track placed orders end-to-end (accept / reject delivery).

NestMarkets as a whole is three sub-products (Buyer Portal, Seller Portal, Admin). This spec covers **only the Buyer Portal**. Seller and Admin portals are separate, later cycles.

---

## 2. Scope

### In scope (this cycle)
- Browse products (search + category filter + **pagination**)
- Product quick-view modal (no dedicated product page, no vendor profile page)
- **Server-side cart** (replaces any localStorage idea), grouped by store in the UI
- Checkout with delivery-profile selection, **flat delivery fee**, PIN, NestPurse debit
- Order list + tracking (read-only stages) with buyer **Accept** / **Reject (reason required)**

### Deferred (explicitly NOT this cycle)
- Vendor profile pages, see-all-vendors, follow/unfollow
- Chat / messaging (`/marketplace/chat`)
- Ratings & reviews
- GPS nearby / top-rated discovery
- Weight-based delivery pricing (needs product weight + Seller Portal)
- **Entire Seller Portal and Admin additions**

---

## 3. 🔴 IMPORTANT — Known issue to resolve later (Seller payout vs. delivery fee)

> **🔴🔴 RED FLAG — DO NOT TREAT AS FINAL 🔴🔴**
>
> In this cycle the buyer pays `items + deliveryFee`, but `sellerAmount` is computed from **items only** — i.e. the delivery fee is retained by the platform and the **seller is NOT paid the delivery fee**. There is currently **no delivery-partner / logistics payout** path, so that money has no proper destination yet.
>
> **This is a deliberate stopgap, not the intended end state.** Before NestMarkets goes to real money/production we MUST decide and implement:
> - Who receives the delivery fee (platform? seller? a delivery partner?), and
> - The payout/settlement flow for it (mirroring the seller `pending → wallet` flow on order acceptance).
>
> Until resolved, the delivery fee accumulates implicitly on the platform side with no ledger entry of its own. **Flagged here so it is not forgotten.** See also the matching `🔴` comment to be left in the `/checkout` handler in code.

---

## 4. Backend changes (`GrowNest.Africa`)

All endpoints mounted under the existing NestMarkets prefix (confirm exact prefix — almost certainly `/api/nestmarkets` — against the app entry file as the first implementation task).

### 4.1 Server-side cart (new)

**Prisma models** (`prisma/schema.prisma`):

```prisma
model MarketCart {
  id        String           @id @default(uuid())
  buyerId   String           @unique
  buyer     Profile          @relation(fields: [buyerId], references: [supabaseUserId], onDelete: Cascade)
  items     MarketCartItem[]
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}

model MarketCartItem {
  id        String        @id @default(uuid())
  cartId    String
  cart      MarketCart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   MarketProduct @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  @@unique([cartId, productId])
}
```
(Add the inverse `cartItems MarketCartItem[]` relation on `MarketProduct`, and `marketCart MarketCart?` on `Profile`.)

**Endpoints:**

| Method | Endpoint | Body / Query | Behaviour |
|--------|----------|--------------|-----------|
| `GET` | `/cart` | — | Returns the buyer's cart items, each with `product` + `product.store` embedded (so the FE can group by store with no extra calls). Auto-creates an empty cart if none exists. |
| `POST` | `/cart/items` | `{ productId, quantity }` | Upsert into cart. Validates: product `isActive`, store `isVerified` + `status:"active"`, not the buyer's own store, and `stockLevel >= quantity`. Increments quantity if the item already exists. |
| `PATCH` | `/cart/items/:id` | `{ quantity }` | Set quantity (re-check stock). `quantity <= 0` → delete the item. |
| `DELETE` | `/cart/items/:id` | — | Remove one item. |
| `DELETE` | `/cart` | `?storeId=` (optional) | Clear whole cart, or just one store's items. Called after a successful per-store checkout. |

A single cart holds items from **multiple stores**. The single-store-per-order rule still lives at `/checkout`; the FE groups the cart by store and checks out one store at a time.

### 4.2 Delivery fee (flat `baseFee`)

Decision: **flat zone `baseFee`** this cycle (products have no `weight` field, and the Seller Portal where weight would be entered is deferred → weight-based pricing is a later cycle).

- **Schema:** add `deliveryFee Float @default(0)` to `MarketOrder`.
- **`/checkout`** (`src/routes/nestmarkets.ts`):
  - Make `deliveryProfileId` required (a zone is needed to price delivery). Update `CheckoutSchema` accordingly.
  - Look up the delivery profile's `deliveryZone`; `deliveryFee = zone.baseFee` (the existing fee formula `baseFee + totalWeight * extraWeightFee` collapses to `baseFee` while `totalWeight = 0`).
  - **Buyer is charged `chargeTotal = itemsTotal + deliveryFee`.** Balance check and purse debit use `chargeTotal`. Buyer's `purseTransaction.amount = chargeTotal`.
  - Persist `totalAmount = itemsTotal` and `deliveryFee` separately on the order (so item revenue and delivery are distinguishable).
  - `adminFee` = `feePercentage%` of `itemsTotal` (unchanged). `sellerAmount = itemsTotal - adminFee` (**items only — see §3 red flag; seller is NOT credited the delivery fee**).
  - `addressSnapshot` already captured — keep.

### 4.3 Browse pagination

- `/browse` gains `page` (default 1) + `limit` (default 10) query params; keep `search` + `category`.
- Return shape mirrors `/my-orders`:
  ```json
  { "success": true, "data": [...], "pagination": { "total", "page", "limit", "pages" } }
  ```

---

## 5. Frontend (`grownest-web`)

Follows the established NestEggs pattern: `types → lib/*-api → hooks (SWR) → components/<feature> → app/<route>`, inside the sidebar shell (`SidebarProvider → AppSidebar → SidebarInset`), with framer-motion + Sonner + shadcn/ui.

### 5.1 File map

```
types/nestmarkets.ts            MarketStore, MarketProduct, MarketOrder, Cart,
                                CartItem, tracking enums, checkout/browse req+res
lib/nestmarkets-api.ts          browse(paged), cart CRUD, checkout, myOrders,
                                accept, reject  (uses lib/api.ts helper)
hooks/use-marketplace.ts        browse list — SWR keyed on [search, category, page]
hooks/use-cart.ts               GET /cart — SWR + optimistic add/update/remove
hooks/use-my-orders.ts          orders — SWR, paginated
components/nestmarkets/
  search-bar.tsx                debounced search input
  category-filter.tsx           chips/select; options derived client-side from results
  product-grid.tsx              responsive grid + skeletons + pagination control
  product-card.tsx              image, name, price, store badge, opens quick-view
  product-quick-view.tsx        modal: image, description, stock, qty stepper, add-to-cart
  cart-badge.tsx                header item-count from use-cart
  cart-list.tsx                 the cart page body, grouped by store
  cart-store-block.tsx          one store's items + subtotal + "Checkout this store"
  checkout-sheet.tsx            delivery-profile picker → items + deliveryFee + PIN → pay
  order-card.tsx                one order summary
  order-tracking.tsx            read-only stage stepper + Accept / Reject(reason)
app/marketplace/page.tsx              Browse (search + filter + grid)
app/marketplace/baskets/page.tsx      The cart, grouped by store (sidebar: "My Baskets")
app/marketplace/orders/page.tsx       Placed orders + tracking  (NEW — add to sidebar)
```

Add the new **"My Orders" → `/marketplace/orders`** entry to `components/app-sidebar.tsx` under the existing NestMarket group.

### 5.2 SWR caching (use everywhere we read server state)

Match existing conventions (`hooks/use-nesteggs.ts`, `hooks/use-nestegg-detail.ts`):

- **`use-marketplace`** — `useSWR(["nestmarket-browse", search, category, page], ...)`, `{ revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }`. Key includes filters so each filter/page combination is cached independently.
- **`use-cart`** — `useSWR("nestmarket-cart", ...)`, same options. Mutations (`add/update/remove`) do **optimistic `mutate`** with `{ revalidate: false }` then revalidate on settle (pattern from `useNestEggDetail.updateEgg`). The header `cart-badge` reads the same SWR key, so it updates instantly everywhere.
- **`use-my-orders`** — `useSWR(["nestmarket-orders", page], ...)`, same options.
- After a successful **checkout**: `mutate("nestmarket-cart")` (cart cleared for that store), `mutate(["nestmarket-orders", ...])`, and the NestPurse balance SWR key (reuse whatever `use-profile`/purse hook exposes) so the wallet reflects the debit.
- After **accept/reject**: optimistically update the order in the `nestmarket-orders` cache, then revalidate; also revalidate purse on accept (no buyer balance change, but keep consistent).

### 5.3 Data flow

- **Browse:** `use-marketplace` → `GET /browse?search&category&page` → `product-grid`. Category options derived client-side from the returned products (server-side categories a later enhancement).
- **Quick-view → add:** `product-card` opens `product-quick-view`; "Add to cart" → `use-cart` optimistic `POST /cart/items` → badge updates → revalidate.
- **Cart page (`/marketplace/baskets`):** `GET /cart`, render one `cart-store-block` per store (each = one future order). Per-block quantity edit / remove via `use-cart`.
- **Checkout:** `cart-store-block` "Checkout" opens `checkout-sheet` → pick a saved delivery profile (from existing `nestBasketsApi.getDeliveryProfiles()` / `nesttrails`) → show `items + deliveryFee (zone.baseFee)` = total → PIN → `POST /checkout { items, pin, deliveryProfileId }` → on success: clear that store's cart items, toast, route to `/marketplace/orders`.
- **Orders (`/marketplace/orders`):** `use-my-orders` → `order-card` list; `order-tracking` shows read-only stages (`received → packaged → on_the_way → delivered`). When `delivered`: **Accept** (`POST /orders/:id/accept`) or **Reject** (`POST /orders/:id/reject { reason }`, reason ≥ 5 chars).

### 5.4 Error handling

- **Insufficient balance:** `/checkout` returns `{ message, shortfall }`. Block pay, surface shortfall, link to top-up via existing `AddMoneyDialog` (from `components/purse/`).
- **Stock / unavailable:** API `400` → inline error in checkout/cart, revalidate cart + browse to refresh stock.
- **Wrong PIN:** `400 "Incorrect PIN"` → Sonner error, stay in the sheet.
- **Concurrency `409`:** "Please try again" toast, revalidate.
- **Empty states:** no products / empty cart / no orders, each with a friendly empty component. Skeletons while loading (NestEggs pattern).

---

## 6. Build order

1. **Backend:** cart models + endpoints → `deliveryFee` on order + `/checkout` change (with §3 red-flag comment in code) → `/browse` pagination.
2. **Frontend:** `types` → `lib/nestmarkets-api` → hooks (SWR) → components → routes → sidebar entry.

Backend first so the frontend builds against real endpoints.

---

## 7. Visual design pass

After this spec is approved, generate visual mockups (Gemini) for: browse grid, product quick-view modal, cart (grouped by store), checkout sheet, and orders/tracking. Fold the resulting layouts into the §5.1 component sections before writing the implementation plan.

---

## 8. Open items / confirm during implementation

- Confirm the NestMarkets router **mount prefix** against the backend app entry file.
- Confirm the exact NestPurse balance **SWR key** to revalidate post-checkout.
- §3 seller-payout-vs-delivery-fee resolution (tracked, deferred).
