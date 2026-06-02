# NestMarkets — Seller Portal C1: Store Setup + Products

> **Date:** 2026-06-01
> **Status:** Approved design — ready for implementation planning
> **Repos touched:** `grownest-web` (frontend only — all endpoints already exist)
> **Builds on:** merged buyer portal, vendors/ratings, and chat cycles.
> **Workflow:** committed directly to `main` (no feature branch).

---

## 1. Goal

Give a user the supply-side entry point: create a NestMarkets store (₦1,000 + PIN), edit it, request verification, and manage products (CRUD with image upload) — under a dedicated `/seller/*` area.

## 2. Scope

### In scope (C1)
- `/seller` landing (no-store CTA vs has-store overview).
- `/seller/store` — multi-step create wizard (no store) OR store details + edit + request-verification panel (has store).
- `/seller/products` — product grid + add/edit/delete with image upload.
- Sidebar group "Sell on NestMarket".

### Deferred (C2 and later)
- Order-fulfilment board, payouts/payout history, dashboard analytics, seller-side chat.
- Product `weight` field + weight-based delivery + the 🔴 seller-delivery-fee-payout fix.

### Frontend-only
Every endpoint already exists and is authenticated under `/api/nestmarkets`. No backend change, no migration.

## 3. Backend endpoints used (existing, verified)
- `GET /my-store` → `{ success, data: store(+_count.products) }` or `404 { success:false }` (no store).
- `POST /create-store` — multipart (`logo`, `banner` files + fields); body via `CreateStoreSchema`: `name` (3–100), `description?` (≤500), `latitude?`, `longitude?`, `businessAddress?`, `cacNumber?`, **`pin` (exactly 4)**. Charges ₦1,000 from NestPurse; `400` on insufficient balance, `401` on bad PIN. Returns `201 { success, data: store }`.
- `PUT /my-store` — multipart, `CreateStoreSchema.partial()` (no PIN needed). Old logo/banner auto-deleted on replace.
- `POST /request-verification` — `VerifyStoreSchema`: `businessAddress` (min 10, ≤500) + optional `cacNumber`. Sets `verificationRequestedAt`, status → `pending`.
- `GET /my-products` → `{ success, data: product[] }`.
- `POST /products` — multipart (`image` file + fields); `CreateProductSchema`: `name` (≥3), `description?` (≤1000), `price` (>0), `category?`, `stockLevel` (int ≥0, default 0). Returns `201 { success, data: product }`.
- `PUT /products/:id` — multipart, `CreateProductSchema.partial()`.
- `DELETE /products/:id` → `{ success, message }`.
- (`PATCH /my-store/location` exists for GPS; not required in C1 — optional later.)

The FE `api` client already passes `FormData` through correctly (skips JSON `Content-Type`).

## 4. Frontend

Pattern: `types → lib/*-api → SWR hooks → components/seller → app/seller/*`. Sidebar shell, gold brand tokens only, `<img>` for images.

### 4.1 Routes & sidebar
- New sidebar group **"Sell on NestMarket"** (icon `StoreIcon`): `Dashboard → /seller`, `My Store → /seller/store`, `Products → /seller/products`.
- `app/seller/page.tsx` — `useMyStore()`; no store → "Create your store" hero CTA (links to `/seller/store`); has store → overview card (logo, name, status badge, product count, quick links to Store/Products). Thin landing; full stats are C2.
- `app/seller/store/page.tsx` — no store → `CreateStoreWizard`; has store → `StoreForm` (edit) + `VerificationPanel` + `StoreStatusBadge`.
- `app/seller/products/page.tsx` — no store → CTA to create store; has store → `SellerProductGrid` + add/edit/delete; "products go live once verified" banner when `!isVerified`.

### 4.2 API service (`lib/seller-api.ts`)
`getMyStore()`, `createStore(formData)`, `updateStore(formData)`, `requestVerification({businessAddress, cacNumber?})`, `getMyProducts()`, `createProduct(formData)`, `updateProduct(id, formData)`, `deleteProduct(id)`. Store/product create/update build `FormData` (fields + optional file) and pass it to `api.post/put`.

### 4.3 Hooks (SWR)
- `hooks/use-my-store.ts` — `["seller-store"]`. Treats `404`/`status===404` as **no store** (`store: null`, not an error). Returns `{ store, hasStore, isLoading, error, mutate }`. Options `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`.
- `hooks/use-my-products.ts` — `["seller-products"]`, same options. `{ products, isLoading, error, mutate }`.

### 4.4 Components (`components/seller/`)
`create-store-wizard.tsx` (2-step), `store-form.tsx` (shared fields + image pickers, used by wizard step 1 and edit), `verification-panel.tsx`, `store-status-badge.tsx`, `product-form-sheet.tsx` (add/edit in a `Sheet`), `seller-product-card.tsx`, `seller-product-grid.tsx` (grid + skeleton + empty), `image-picker.tsx` (file input + preview, reused for logo/banner/product image).

### 4.5 Flows
- **Create (2-step):** Step 1 — name, description, logo, banner (previews via `image-picker`). Step 2 — review + 4-digit PIN. Submit → `createStore(formData)` → success: toast "Store created — ₦1,000 debited", revalidate `["seller-store"]` + purse `"user-profile"`, route to `/seller/store`. Insufficient balance (`400`) → inline error + "Top up" (`AddMoneyDialog`); bad PIN (`401`) → inline error, stay on step 2.
- **Edit store:** `StoreForm` (no PIN) → `updateStore(formData)` (only append a logo/banner file if the user picked a new one) → revalidate store.
- **Request verification:** `VerificationPanel` — `businessAddress` (≥10) + optional `cacNumber` → `requestVerification()` → success: "Verification requested — under review", revalidate store. Hidden/disabled when already `isVerified`.
- **Products:** `getMyProducts` → grid. Add/Edit via `ProductFormSheet` (name, description, price, category, stock, image) → create/update → revalidate `["seller-products"]`. Delete → confirm dialog → `deleteProduct` → revalidate.

### 4.6 Errors & states
- `/my-store` 404 → no-store UI (not an error toast).
- Insufficient balance / bad PIN / validation → Sonner + inline messages.
- Empty product list, skeletons while loading, image-required hints. Status badge reflects `status` + `isVerified`.
- Purse balance (`"user-profile"`) revalidated after the ₦1,000 charge.

## 5. Build order
types → `lib/seller-api` → hooks → `image-picker` + shared components → store pages (landing, store, verification) → products → sidebar entry. Commit per task on `main`.

## 6. Open items / confirm during implementation
- Confirm the `MarketStore` fields returned by `GET /my-store` for the form/overview (name, description, logoUrl, bannerUrl, businessAddress, cacNumber, status, isVerified, _count.products) — already verified against the route.
- Confirm `api` error mapping distinguishes `401` (PIN) vs `400` (balance) so the create wizard can show the right inline message (the client returns `{ error, status }`; use `status`).
