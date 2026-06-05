# NestMarkets — Buyer UI Revamp: Narrative Flow + Cart Drawer

> **Date:** 2026-06-05
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend only)
> **Builds on:** the merged buyer cycles + the seller "Narrative Flow" revamp.
> **Workflow:** committed directly to `main`. Art direction from the Gemini buyer mockups, bound to GrowNest gold/warm theme tokens.

---

## 1. Goal

Bring the buyer marketplace screens up to the same "Narrative Flow" polish as the seller portal, and make the **cart a slide-over drawer** (opened from the top-bar cart badge) with a **"You might also like" same-store recommendation strip** — while keeping the full cart page for direct visits.

## 2. Scope (frontend-only, no new deps)

Polish + (where noted) restructure these existing buyer surfaces:
1. **Browse** (`/marketplace`) — product grid, category pills, search, quick-view modal.
2. **Vendors** (`/marketplace/vendors`) — discovery (top-rated / nearby / all) vendor cards.
3. **Vendor profile** (`/marketplace/store/[id]`) — banner header, follow, products, reviews.
4. **Cart** — **NEW: primary slide-over drawer** from the cart badge + the existing full page (`/marketplace/cart`), both rendering the same grouped-by-store body, plus a **"You might also like"** strip per store group.
5. **Checkout** (existing slide-over sheet) — polish to match.
6. **Orders + tracking** (`/marketplace/orders`) — order cards, stepper, accept/reject/rate/message.
7. **Chat** (`/marketplace/chat`) — two-pane buyer inbox.

### Deferred / not changing
- No API/data-flow/SWR-key changes. All existing functionality preserved.
- 🔴 delivery-fee-payout (backend handoff, separate).

## 3. Visual system (reuse seller Narrative Flow — translate hex → tokens)
The Gemini mockups use `amber-*`/`stone-*`/`emerald-*` hex names. Translate ALL to our real tokens (as in every prior cycle):
- gold → `bg-primary`/`text-primary`/`text-primary-foreground`; `bg-primary/10 text-primary` for soft gold; gold gradient `bg-gradient-to-br from-primary to-primary/70`.
- surfaces → `bg-card`/`bg-background`; muted → `bg-muted`/`text-muted-foreground`; borders → `border-border`; errors → `text-destructive`/`bg-destructive/10`.
- **Accept/success semantic:** the mockup suggests emerald for "Accept delivery." We DO NOT introduce emerald. Use `bg-primary` (gold) for the primary Accept action, consistent with the rest of the app; "Reject" stays `variant="outline"` with `text-destructive`. (Matches what's already shipped on the order card.)
- rounded-2xl cards, soft shadows, generous spacing, subtle framer-motion entrance animations, gold-active tabs/pills. `<img>` for images. NO emerald/slate/amber-N/stone-N/gray-N/green-N/hex.

## 4. Cart drawer (the one structural change)

Current state (verified): cart badge links to `/marketplace/cart`; `CartList` is already a shared grouped-by-store body (`useCart().byStore`); `CartStoreBlock` renders each store group; checkout is a `Sheet`.

Design:
- **New `components/nestmarkets/cart-drawer.tsx`** — a `Sheet` (right side, `w-full sm:max-w-md`) whose body renders the existing `CartList` (so drawer + page share one component). Header "Your Basket (N items)".
- **Cart badge becomes a drawer trigger**, not a link: `components/nestmarkets/cart-badge.tsx` takes an `onClick` (or wraps a shared open-state). Implement a lightweight cart-drawer open mechanism so the badge (rendered inside page headers) can open the drawer:
  - Approach: a small `CartDrawerProvider` (React context, in `components/nestmarkets/cart-drawer.tsx` or a `context/cart-drawer.tsx`) holding `open`/`setOpen`, wrapped around the marketplace pages (or app shell). `CartBadge` calls `useCartDrawer().open()`; the drawer reads the same context. Keep it minimal. If a provider is too invasive, fall back to: badge opens the drawer via a per-page local state passed down — but the provider is cleaner since the badge sits in every page header. Decide in the plan.
- **"Checkout this store"** inside the drawer opens the existing `CheckoutSheet` for that store (drawer can stay open behind or close first — plan decides; prefer: opening checkout closes the cart drawer).
- **"You might also like"** strip inside each `CartStoreBlock`: a horizontal scroll row of 3–4 more products from that **same store**, each a mini-card (image, ₦price, `+` add button → `useCart().add`). Data source: reuse the browse endpoint filtered to that store, OR the store-detail endpoint (`GET /stores/:id` returns the store's products — already used by the vendor profile). New small hook `use-store-products(storeId)` or reuse `useVendor`. Exclude items already in the cart. Lazy/best-effort; hide the strip if none.
- **Full page** `/marketplace/cart` keeps rendering `CartList` (+ the same recommendation strip via `CartStoreBlock`). Both share the component, so the strip appears in both automatically.
- Empty state: "Your basket is empty" + Start Shopping CTA (already in `CartList`; polish).

## 5. Screen-by-screen polish notes
- **Browse:** image-forward `product-card` (heart/wishlist optional — only if a backend exists; the mockup shows a heart but we have no wishlist API → OMIT the heart to avoid dead UI), store badge w/ rating, gold price; category pills gold-active (already), skeletons, empty state. Quick-view modal: 2-col on desktop (image | details + qty + add).
- **Vendors:** vendor cards with banner + overlapping logo (same pattern as seller store form), rating, product/follower counts, distance on nearby; "Visit Store" button; section tabs (Top Rated / Nearby / All).
- **Vendor profile:** lush banner header + overlapping logo + follow button + stats; Products / Reviews tabs; product grid reuses `product-card`; reviews list.
- **Checkout sheet:** address picker, order summary (items + delivery fee + total), NestPurse balance card (soft gold tint `bg-primary/10`), insufficient-balance state (→ destructive + "Top up" affordance), PIN, "Pay ₦X". (There are in-progress uncommitted edits to `checkout-sheet.tsx` — fold/refine them here.)
- **Orders:** Active / History tabs; order cards with read-only stepper (gold completed nodes, pulsing active, muted upcoming; vertical timeline on mobile); Accept (gold) / Reject (outline, reason) / Rate (★ modal) / Message-seller deep link. (In-progress edits to `order-tracking.tsx` — fold/refine.)
- **Chat:** two-pane; thread list of stores w/ unread badges; conversation bubbles (own vs store), order-context card, composer; mobile master-detail. (Buyer chat already exists — polish only.)

## 6. Components map
- New: `components/nestmarkets/cart-drawer.tsx` (+ a small cart-drawer open context), `use-store-products` hook (or reuse) for the recommendation strip.
- Modify: `cart-badge.tsx` (trigger drawer), `cart-store-block.tsx` (+ recommendation strip), `cart-list.tsx` (polish), `product-card.tsx`, `product-grid.tsx`, `product-quick-view.tsx`, `category-filter.tsx`, `search-bar.tsx`, `vendor-card.tsx`, `vendor-grid.tsx`, `nearby-section.tsx`, `follow-button.tsx`, `store-reviews.tsx`, `order-card.tsx`, `order-tracking.tsx`, `rate-order-dialog.tsx`, `checkout-sheet.tsx`, and the buyer pages (`/marketplace`, `/marketplace/cart`, `/marketplace/vendors`, `/marketplace/store/[id]`, `/marketplace/orders`, `/marketplace/chat`).
- Reuse: `useCart`, `useMarketplace`/browse hooks, `useVendor`, `CheckoutSheet`, chat components.

## 7. Animation
framer-motion entrance (fade/stagger) on grids, cards, drawer content; pulsing active tracking node; respect reduced-motion. Subtle, consistent with seller side.

## 8. Errors & states
Preserve all existing: empty browse/cart/orders/chat, loading skeletons, checkout insufficient-balance + wrong-PIN, geolocation-denied (nearby), follow rollback. Recommendation strip hides gracefully when empty.

## 9. Open items / confirm during implementation
- Cart-drawer open mechanism: context provider vs per-page state — pick the minimal clean option (lean: a small context mounted around the marketplace layout/pages).
- "You might also like" data source: reuse `GET /stores/:id` products (already available) vs browse-by-category; exclude in-cart items; cap 3–4.
- Confirm the cart route is `/marketplace/cart` (current) and the sidebar "My Baskets" link points there (update label/href if drifted).
- Heart/wishlist icon from the mockup is OMITTED (no backend) — revisit if a wishlist API lands.
- Buyer-side `checkout-sheet.tsx` + `order-tracking.tsx` have pre-existing uncommitted edits — this cycle folds them in (they become part of the revamp commit set).
