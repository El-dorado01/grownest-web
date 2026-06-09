# NestTrails — My Deliveries + Tracking Design

> **Date:** 2026-06-09
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend only — all endpoints already exist under `/api/nesttrails`)
> **Workflow:** committed directly to `main`. Visual system: GrowNest warm-gold tokens, shared `PageHeader`, framer-motion — same recipe as NestMarkets.

---

## 1. Goal

Give users the delivery-tracking experience: a `/deliveries` page (Today / Upcoming / Past), a per-delivery detail/track drawer, and a public shareable `/track/[code]` page.

## 2. Scope

### In scope
- `/deliveries` — categorized list (Today / Upcoming / Past) + summary strip, delivery cards with a horizontal status stepper, rider info, items, recurring tag, Track action.
- **Delivery detail/track** — right-side drawer (`Sheet`) with a vertical timeline, rider card, address, items, copy tracking code, share-link.
- **Public `/track/[code]`** — standalone (no sidebar/auth) courier-style page with status stepper, order summary, items, and not-found state.
- Wire the existing dead sidebar link "My Deliveries" → `/deliveries`.

### Out of scope
- Delivery-address CRUD (already exists in `components/settings/delivery-addresses.tsx`; API client already has it). Not rebuilt here.
- Admin delivery management (`/api/admin/nesttrails`) — separate, later.

### Frontend-only
All endpoints exist. New client methods needed: `getMyDeliveries`, `trackDelivery(code)`. Address/zone/fee methods already in `lib/nestbaskets-api.ts`.

## 3. Backend endpoints used (existing, verified)
- `GET /api/nesttrails/deliveries` (auth) → `{ success, data: { today: D[], upcoming: D[], past: D[], summary: { total, upcoming, today, past } } }`.
  - `D` = `{ id, title, deliveryDate, status, trackingCode, riderName, riderPhone, items: [{ name, imageUrl, quantity }], isRecurring }`.
- `GET /api/nesttrails/delivery/:trackingCode` (**public, no auth**) → `{ success, data: { trackingCode, status, deliveryDate, title, address, items: [{ foodItem, quantity, ... }] } }`. 404 `{ success:false, message }` when not found.
- Status values: `scheduled | dispatched | in_transit | delivered | failed`. (Note: the categorized `/deliveries` type annotation in code lists `scheduled|dispatched|delivered|failed`, but `in_transit` is a real status from the status-update flow — the UI must handle all five.)

> No detail-by-id endpoint: the **detail drawer reuses the data already in the list** (we have the full `D` object per card). Public page uses the tracking-code endpoint.

## 4. Frontend

Pattern: `types → lib/nesttrails-api → SWR hooks → components/nesttrails → app routes`. Gold tokens, `<img>`, framer-motion, shared `components/nestmarkets/page-header.tsx` (`PageHeader`). NO new deps.

### 4.1 Routes & sidebar
- `app/deliveries/page.tsx` — the My Deliveries page (in the sidebar shell).
- `app/track/[code]/page.tsx` — public standalone page, **its own minimal layout** (`app/track/layout.tsx` with no sidebar; centered, branded). Must not require auth.
- `components/app-sidebar.tsx`: the "My Deliveries" item already points to `/deliveries` (currently dead) — it will now resolve. No change needed beyond confirming.

### 4.2 Types (`types/nesttrails.ts`)
`DeliveryStatus = "scheduled"|"dispatched"|"in_transit"|"delivered"|"failed"`. `DeliveryItem { name; imageUrl: string|null; quantity }`. `Delivery { id; title; deliveryDate; status; trackingCode; riderName: string|null; riderPhone: string|null; items: DeliveryItem[]; isRecurring }`. `MyDeliveriesResponse { success; data: { today: Delivery[]; upcoming: Delivery[]; past: Delivery[]; summary: { total; today; upcoming; past } } }`. `PublicTracking { trackingCode; status; deliveryDate; title; address: unknown; items: { foodItem: { name; imageUrl?: string|null }; quantity }[] }` + `PublicTrackingResponse`.

### 4.3 API (`lib/nesttrails-api.ts`)
- `getMyDeliveries()` → `GET /api/nesttrails/deliveries`.
- `trackDelivery(code)` → `GET /api/nesttrails/delivery/${code}`.

### 4.4 Hooks (SWR)
- `hooks/use-my-deliveries.ts` — key `"nesttrails-deliveries"`, `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`; returns `{ today, upcoming, past, summary, isLoading, error, mutate }`.
- `hooks/use-tracking.ts` — `trackDelivery` for the public page; key `["nesttrails-track", code]`; tolerate 404 as a not-found state (not an error toast). Public page must call this WITHOUT requiring auth token (the API client sends the token if present, which is fine; endpoint is public).

### 4.5 Components (`components/nesttrails/`)
- `delivery-status-stepper.tsx` — **horizontal** compact stepper (scheduled → dispatched → in_transit → delivered); completed = gold, current = pulsing ring, upcoming = muted; **failed** renders a distinct destructive terminal node after the last completed step.
- `delivery-vertical-timeline.tsx` — vertical variant for the drawer (left border, nodes, status labels; timestamps where available — only `deliveryDate`/`deliveredAt`-style data exists, so show what we have).
- `delivery-card.tsx` — title, recurring tag, tracking code + copy, date, status pill, horizontal stepper, rider line + Call button (`tel:`), item thumbnails + qty, Track/View-details action (opens drawer).
- `delivery-detail-drawer.tsx` — `Sheet` (right): vertical timeline, rider card, address, items with images, copy tracking code, "Share tracking link" (Web Share API → falls back to copy `/track/<code>`).
- `delivery-group.tsx` — a section/tab body (heading + cards + empty state + skeletons).
- `summary-strip.tsx` — Today / Upcoming / Past counts.
- `public-tracking-view.tsx` — the standalone tracking card(s) used by `/track/[code]` (status stepper + order summary + items + not-found).

### 4.6 Flows
- **My Deliveries:** `useMyDeliveries` → summary strip + `Tabs` (Today / Upcoming / Past, with counts). Each tab renders `delivery-group`. Card "Track" opens `delivery-detail-drawer` for that delivery (data passed in from the list — no extra fetch). Copy buttons + Call (`tel:riderPhone`) + Share (`/track/<code>`).
- **Public track:** `/track/[code]` reads the param, `use-tracking` fetches by code; renders `public-tracking-view`; 404 → not-found state with "Return to GrowNest Home". Privacy: do NOT show rider phone on the public page; show area/title/items/status only.

### 4.7 States
Loading skeletons per group + drawer; empty per group ("No deliveries today" etc.); public not-found; copy/share toasts via Sonner. Status pill + stepper colors: gold (done/active), `text-muted-foreground`/`bg-muted` (upcoming), `text-destructive`/`bg-destructive/10` (failed).

### 4.8 Mock
Extend `lib/dev-mock.ts` (gated `NEXT_PUBLIC_MOCK=1`): `GET /nesttrails/deliveries` (today/upcoming/past + summary, mixed statuses incl. in_transit + failed + a recurring one) and `GET /nesttrails/delivery/:code` (one known code + a not-found path) so both pages preview.

## 5. Build order
types → `lib/nesttrails-api` → hooks → steppers → card + drawer + group + summary → `/deliveries` page → public `/track/[code]` (+ its layout) → sidebar confirm → mock. Single sweep, one commit.

## 6. Tokens & consistency
Gold = `bg-primary`/`text-primary`/`text-primary-foreground`; surfaces `bg-card`/`bg-background`; muted `bg-muted`/`text-muted-foreground`; borders `border-border`; failed/destructive `text-destructive`/`bg-destructive/10`. `<img>` only. Reuse `PageHeader`. Stepper visual language consistent with the NestMarkets order tracker. NO emerald/slate/amber-N/stone-N/gray-N/hex.

## 7. Open items / confirm during implementation
- Public `/track/[code]` layout must sit outside the sidebar (`app/track/layout.tsx`) and not redirect unauthenticated users — verify the app's auth/middleware doesn't force-login this route.
- `address` on public tracking is a JSON snapshot or a relation; render defensively (city/state if present, else a short label) and never show full street + phone publicly.
- Timestamps: only `deliveryDate` (+ any delivered time) are available — the timeline shows available dates, not per-step times, unless the data carries them.
