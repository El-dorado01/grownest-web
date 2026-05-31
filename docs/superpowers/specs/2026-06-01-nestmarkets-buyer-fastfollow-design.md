# NestMarkets — Buyer Fast-Follow (Cycle A): Vendors, Discovery, Ratings

> **Date:** 2026-06-01
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `GrowNest.Africa` (one small backend addition) + `grownest-web` (frontend)
> **Builds on:** the merged NestMarkets buyer portal (browse → cart → checkout → orders).

---

## 1. Goal

Extend the buyer experience with **vendor profiles + follow**, **vendor discovery** (all / top-rated / nearby), and **ratings & reviews** (rate from the order card; read a store's reviews on its profile).

## 2. Scope

### In scope (Cycle A)
- `/marketplace/vendors` discovery page: Top Rated, All Vendors, and opt-in Nearby.
- `/marketplace/store/[id]` vendor profile: header/stats, follow/unfollow, the store's products, and its reviews list.
- Follow / unfollow stores.
- Rate an order (★1–5 + optional review) from the existing order card; surface reviews on the vendor profile.

### Deferred
- **Chat / messaging** (`/marketplace/chat`) → Cycle B.
- Seller Portal, Admin additions, weight-based delivery, seller-payout-of-delivery-fee fix (tracked elsewhere).

## 3. Backend (`GrowNest.Africa`) — one addition

Every other endpoint already exists and is merged: `POST /stores/:id/follow` (toggle), `GET /followed-stores`, `GET /stores`, `GET /stores/:id`, `GET /recommendations/top-rated`, `GET /recommendations/nearby?lat&lon`, `POST /orders/:id/rate`. Stores already carry `averageRating` + `ratingCount`.

**The one gap:** `MarketRating` rows are written by `/orders/:id/rate` but never read back — there is no endpoint to list a store's reviews.

**Add:** `GET /stores/:id/reviews?page&limit` in `src/routes/nestmarkets.ts` (public, like other `/stores` reads).
- Returns paginated `MarketRating` rows for the store, newest first, each with `rating`, `review`, `createdAt`, and buyer `fullName` + `profilePhoto` (via the `buyer` relation `select`).
- Response shape mirrors `/my-orders`: `{ success, data: [...], pagination: { total, page, limit, pages } }`.
- No schema change, no migration. I implement it; user runs nothing.

## 4. Frontend (`grownest-web`)

Follows the established pattern (`types → lib/*-api → SWR hooks → components/nestmarkets → app/marketplace/*`), sidebar shell, gold brand tokens only, `<img>` for remote images, framer-motion + Sonner.

### 4.1 Routes & sidebar
- **New** `app/marketplace/vendors/page.tsx` + new sidebar entry **"Vendors" → `/marketplace/vendors`** (under the NestMarket group, after "My Orders").
- **New** `app/marketplace/store/[id]/page.tsx` — vendor profile.

### 4.2 API service additions (`lib/nestmarkets-api.ts`)
`getStores()`, `getStore(id)`, `topRated(limit?)`, `nearby(lat, lon, limit?)`, `followStore(id)`, `getFollowedStores()`, `getStoreReviews(id, page?, limit?)`, `rateOrder(id, rating, review?)`. All via the existing `api` helper.

### 4.3 Hooks (SWR)
- `hooks/use-vendors.ts` — keys `["nestmarket-top-rated"]` and `["nestmarket-stores"]`; Nearby is lazy (see 4.5) under `["nestmarket-nearby", lat, lon]`. Also exposes followed-store ids from `"nestmarket-followed"` so cards can show follow state.
- `hooks/use-vendor.ts` — `["nestmarket-store", id]` (store + products) and `["nestmarket-store-reviews", id, page]`.
- All use `{ revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }`.

### 4.4 Components (`components/nestmarkets/`)
`vendor-card.tsx` (logo, name, rating, product/follower counts, distance when nearby), `vendor-grid.tsx` (grid + skeletons + empty), `follow-button.tsx` (optimistic toggle), `nearby-section.tsx` (opt-in geolocation), `store-reviews.tsx` (paginated reviews list + empty), `rate-order-dialog.tsx` (★1–5 + optional review). Reuses Cycle A's `ProductCard` + `ProductQuickView` + `useCart` for the profile's product grid.

### 4.5 Data flow
- **Vendors page:** render Top Rated + All Vendors from their SWR keys. **Nearby is opt-in:** a "Find stores near me" button calls `navigator.geolocation.getCurrentPosition`; on success, fetch `["nestmarket-nearby", lat, lon]` and list by distance; on deny/timeout, show a friendly retry message while the other sections remain.
- **Vendor profile:** `use-vendor(id)` loads the store, its products (reuse `ProductCard`/`ProductQuickView` → existing cart/checkout), and `store-reviews`. Follow button reads `"nestmarket-followed"`, toggles optimistically via `POST /stores/:id/follow`, then revalidates `"nestmarket-followed"` and the store.
- **Rating:** `order-card.tsx` (Cycle A) gains a **"Rate order"** button shown when `status` is `accepted` or `delivered` and the order is not yet rated. It opens `rate-order-dialog`; on success revalidate the orders cache (`["nestmarket-orders", …]`) so the button clears, plus `["nestmarket-store-reviews", id]` + `["nestmarket-store", id]` when applicable (updated average).

### 4.6 SWR caching summary
Keyed caches: top-rated, stores, nearby(lat,lon), store(id), store-reviews(id,page), followed. Optimistic mutate (`{revalidate:false}`) for follow toggle; targeted revalidation after follow and after rating (orders + store + reviews).

### 4.7 Error handling
- **Geolocation denied/unavailable/timeout:** caught; inline "Allow location to see nearby stores" + retry; never blocks the page.
- **Follow failure:** roll back optimistic state + Sonner error.
- **Rate ineligible / already rated (`400`):** Sonner error; button only renders when eligible.
- **Empty states:** no vendors, no nearby results, "No reviews yet". Skeletons while loading.

## 5. Build order
1. Backend: add `GET /stores/:id/reviews` (+ deploy).
2. Frontend: `lib` additions → hooks → components → routes → sidebar entry → wire "Rate order" into the existing order card.

## 6. Open items / confirm during implementation
- Confirm `GET /stores/:id` returns the store's products (or fetch products via the browse endpoint filtered by store) — decide in the plan based on the actual response.
- Confirm the `MarketRating.buyer` relation exposes `fullName` + `profilePhoto` for the reviews `select`.
