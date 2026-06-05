# NestMarkets — Seller UI Revamp Cycle 1: Dashboard + Store Dialog + Sidebar Gating

> **Date:** 2026-06-05
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend only)
> **Builds on:** Seller C1/C2/C3 (all merged on `main`).
> **Workflow:** committed directly to `main`. Art direction: "Narrative Flow" (from Gemini/Grok mockups), bound to GrowNest gold/warm theme tokens.

---

## 1. Goal

Turn the thin, router-like seller landing into a rich full-screen dashboard, move store editing into a tabbed dialog, gate the seller sidebar on store existence, and make the no-store experience a proper "create your store" entry point.

## 2. Scope

### In scope (Cycle 1) — frontend-only, no new deps
- **Rich dashboard** at `/seller` ("Narrative Flow": gold hero, verification banner, KPI row, CSS/SVG revenue bars, recent-order cards, low-stock + top-products widgets), animated with framer-motion.
- **Store Edit Dialog** — tabbed (Details | Verification), opened from the dashboard header "Edit Store" button. Replaces the standalone My Store page as the editing surface.
- **Sidebar gating** — seller group shows only "Dashboard" when the user has no store; full list otherwise. "My Store" link removed permanently (editing is the dialog).
- **No-store experience** — `/seller` renders a full-screen "Start Selling" landing → existing create-store wizard.

### Deferred (Cycle 2)
- Visual polish of `/seller/products`, `/seller/orders`, `/seller/earnings`, `/seller/chat` to match Narrative Flow (incl. the product active `Switch` → needs `components/ui/switch.tsx` + backend `isActive` support check).

### Chart decision
Revenue trend = **CSS/SVG bars** (divs/inline SVG, framer-motion grow-in). **No charting dependency.**

## 3. Existing toolbox (reuse — do NOT recreate)
- shadcn present: `dialog`, `tabs`, `sheet`, `dropdown-menu`, `avatar`, `badge`, `card`, `tooltip`, `skeleton`, `input`, `textarea`, `select`, `combobox`, `popover`, `pin-input`, `sidebar`. Deps: `framer-motion`, `canvas-confetti`, `sonner`, `lucide-react`.
- App code present: `ImagePicker`, `StoreForm` (+ `emptyStoreForm`, `storeFormToFormData`), `VerificationPanel`, `StoreStatusBadge`, `CreateStoreWizard`, `useMyStore` (`{store,hasStore,isLoading,mutate}`; `SELLER_STORE_KEY`), `useSellerOrders(storeId)`, `useMyProducts(enabled)`, `sellerApi`.
- `MarketStore` fields available: name, description, logoUrl, bannerUrl, status, isVerified, businessAddress, cacNumber, verificationRequestedAt, averageRating, ratingCount, `_count.products`, `pendingBalance`, `totalEarned`.
- `SellerOrder` fields: id, status, trackingStatus, sellerAmount, totalAmount, items, createdAt, addressSnapshot.

## 4. Dashboard (`/seller`)

### 4.1 No-store state
Full-screen centered "Start Selling on NestMarket" landing: storefront icon, headline, value props (reach buyers, instant NestPurse payouts, easy management), a soft (not-red) **₦1,000 one-time fee** note, primary gold CTA → routes to the create flow. (The create wizard itself already exists — `CreateStoreWizard`; this landing is its entry. Wizard step 2 PIN uses `pin-input`; success fires `canvas-confetti`.)

### 4.2 Has-store dashboard (vertical flow)
1. **Header row:** store logo + name + `StoreStatusBadge` + **"Edit Store"** button (opens §5 dialog).
2. **Earnings hero** (`dashboard-hero.tsx`): gold-gradient card (`from-primary` → deeper warm tone), Pending Balance + Total Earned, white/warm text, subtle framer-motion fade/scale-in. "Held until buyers confirm delivery" caption on pending.
3. **Verification banner** (`verification-banner.tsx`): only when `!(isVerified && status==="active")`. Soft warm banner — "Your store is pending verification. Products are hidden from buyers." with a link/button to open the dialog's Verification tab. slide-down animation.
4. **KPI row** (`kpi-row.tsx`): compact cards — Total Orders, Active, Completed, Products, Avg Rating, Avg Order Value (computed from orders + store). Stagger-in. Computed: active = status not in {accepted,rejected}; completed = accepted; avg order value = total sellerAmount / order count (guard /0).
5. **Revenue bars** (`revenue-bars.tsx`): CSS/SVG bar strip bucketing recent orders' `sellerAmount` by day/week (client-side from the orders we already fetch), framer-motion grow-in, gold bars on muted track. Empty → "Your growth story starts here" flat baseline.
6. **Recent orders** (`recent-orders-card.tsx`): stacked actionable cards (buyer, items summary, sellerAmount, status pill, full-width "Advance to <next>" button reusing `useSellerOrders().advance`). Latest 5. "View all" → `/seller/orders`.
7. **Widgets row:** `low-stock-widget.tsx` (products at/near 0 — uses `useMyProducts`) + `top-products-widget.tsx` (from products/orders). Each with empty states.

Replaces the current `DashboardStats` component (superseded by these focused pieces).

## 5. Store Edit Dialog

`components/seller/store-edit-dialog.tsx` — shadcn `Dialog` (max-w-2xl) + `Tabs`:
- **Details tab:** `ImagePicker` logo + banner, name, description, business address (reuse `StoreForm` + `storeFormToFormData`) → `sellerApi.updateStore` → revalidate `SELLER_STORE_KEY`, toast, close. Save button shows `Loader2` while busy.
- **Verification tab:** reuse `VerificationPanel` internals (business address + CAC + request + status indicator; CAC read-only/disabled when verified) → `sellerApi.requestVerification`.
- Controlled `open`/`onOpenChange` from the dashboard. Opening from the verification banner deep-selects the Verification tab (via a `defaultTab` prop).

## 6. Sidebar gating + route cleanup

- `components/app-sidebar.tsx`: the "Sell on NestMarket" group items become **store-aware**. Add a small client wrapper/logic using `useMyStore`: when `!hasStore`, render only `{ Dashboard }`; else the full list (Dashboard, Products, Orders, Earnings, Messages). **Remove "My Store"** from the list entirely. (Implementation: compute items in the sidebar component from `useMyStore`, or a dedicated `SellerNavGroup` that swaps items — keep it minimal and within existing `NavMain` rendering.)
- `app/seller/store/page.tsx`: becomes **create-only**. If a store already exists, redirect to `/seller` (editing now lives in the dialog). No-store → the create wizard (unchanged).

## 7. Components map
- New: `components/seller/dashboard-hero.tsx`, `verification-banner.tsx`, `kpi-row.tsx`, `revenue-bars.tsx`, `recent-orders-card.tsx`, `low-stock-widget.tsx`, `top-products-widget.tsx`, `store-edit-dialog.tsx`, `create-store-landing.tsx` (the no-store hero).
- Modify: `app/seller/page.tsx` (compose dashboard / no-store), `app/seller/store/page.tsx` (create-only + redirect), `components/app-sidebar.tsx` (gating + drop My Store).
- Remove/supersede: `components/seller/dashboard-stats.tsx` (replaced by hero + kpi-row + recent-orders + widgets).

## 8. Animation
framer-motion: hero fade/scale-in, KPI stagger, revenue bars grow, verification banner slide-down, recent-order cards subtle rise. Respect reduced-motion. Keep tasteful/subtle, not flashy.

## 9. Tokens
Translate mockup `amber-*`/`stone-*` → real theme tokens: gold = `primary`, surfaces = `card`/`background`, muted = `muted`/`muted-foreground`, borders = `border`, errors = `destructive`. Gold gradient hero = `bg-gradient-to-br from-primary to-primary/70` (or a warm darker stop) with `text-primary-foreground`. NO raw hex / emerald / slate / gray-N.

## 10. Errors & states
No-store landing; zero-data dashboard (hero ₦0, empty revenue baseline, empty widgets with helpful copy); loading skeletons matching each section; dialog save/verify errors via Sonner; create-store wrong-PIN (403) + insufficient-balance (400) already handled in the wizard.

## 11. Open items / confirm during implementation
- Sidebar gating: confirm cleanest way to make `navMain` store-aware without disrupting other groups (`useMyStore` inside `app-sidebar.tsx` is client-side already — fine). Ensure no hydration flash (show full or Dashboard-only based on resolved `hasStore`; while loading, default to Dashboard-only or a skeleton).
- `/seller/store` redirect-when-store-exists: use `useRouter().replace("/seller")` after `useMyStore` resolves `hasStore`.
- Revenue bucketing granularity (daily vs weekly) — pick based on order spread; default last 7 days.
