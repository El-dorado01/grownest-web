# NestMarkets Seller Portal C1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the seller-side store setup + product management under a new `/seller/*` area — create store (₦1,000 + PIN), edit, request verification, and product CRUD with image upload.

**Architecture:** Frontend-only (all endpoints already exist under `/api/nestmarkets`, authenticated). Follows the established pattern (`types → lib/*-api → SWR hooks → components/seller → app/seller/*`), sidebar shell, gold brand tokens, `<img>` images, multipart uploads via the existing `api` client (which already passes `FormData` through).

**Tech Stack:** Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, Sonner, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck + lint** and **manual checks**; final task runs `build`. Work committed directly to **`main`** (no feature branch — user preference).

**Reference spec:** `docs/superpowers/specs/2026-06-01-nestmarkets-seller-portal-c1-design.md`

**Key facts (verified against code):**
- All endpoints mounted at `/api/nestmarkets`, behind `authenticateToken`:
  - `GET /my-store` → `{ success, data: store }` (store has `_count.products`) or `404 { success:false, message }` when none.
  - `POST /create-store` — multipart: file fields `logo`, `banner` + text fields `name`(3–100), `description?`, `businessAddress?`, `cacNumber?`, `latitude?`, `longitude?`, **`pin`(4 digits)**. Charges ₦1,000. `400` insufficient balance / no purse / no PIN set; `401` invalid PIN; `201 { success, data: store }` on success.
  - `PUT /my-store` — multipart, all fields optional (no PIN). Returns `{ success, message, data: store }`.
  - `POST /request-verification` — JSON: `businessAddress`(≥10, ≤500), `cacNumber?`. Returns `{ success, message, data: store }`.
  - `GET /my-products` → `{ success, data: product[] }`.
  - `POST /products` — multipart: file `image` + `name`(≥3), `description?`, `price`(>0), `category?`, `stockLevel`(int≥0). `201 { success, data: product }`.
  - `PUT /products/:id` — multipart, all optional. `{ success, message, data: product }`.
  - `DELETE /products/:id` → `{ success, message }`.
- `MarketStore` fields: `id, ownerId, name, description, logoUrl, bannerUrl, isVerified, status, latitude, longitude, averageRating, ratingCount, businessAddress, cacNumber, verificationRequestedAt, createdAt, updatedAt, _count?`.
- `MarketProduct` fields: `id, storeId, name, description, price, imageUrl, category, stockLevel, isActive, createdAt, updatedAt`.
- FE `api` client (`lib/api.ts`): `api.get/post/put/patch/delete<T>(endpoint, body?)` → `{ data, error, status }`. When `body instanceof FormData`, it does NOT set JSON `Content-Type` (multipart works). On non-OK it returns `{ data:null, error, status }` — so use `status` to distinguish 400 vs 401.
- SWR convention: `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`.
- Existing reusables: `components/purse/add-money-dialog.tsx` (`AddMoneyDialog`), `components/nestmarkets/cart-badge.tsx`, `hooks/use-profile.ts` (SWR key `"user-profile"`, exposes `balance`). Page shell pattern in `app/marketplace/vendors/page.tsx`.
- Sidebar data lives in `components/app-sidebar.tsx` `navMain` array; groups render via `components/nav-main.tsx`. The NestMarket group uses `icon: <StoreIcon />` and an `items: [{title,url}]` array. `nav-main.tsx` sub-item type now supports an optional `badge?: React.ReactNode` (added in chat cycle) — not needed here.
- Frontend repo: `c:\Users\ambal\Desktop\Gigs\grownest-web`. Branch: **main** (commit directly).

---

## Task 1: Types

**Files:**
- Create: `types/seller.ts`

- [ ] **Step 1: Create `types/seller.ts`**

```typescript
// types/seller.ts

export interface SellerStore {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  status: string; // "pending" | "active" | "inactive"
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  ratingCount: number;
  businessAddress: string | null;
  cacNumber: string | null;
  verificationRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface SellerStoreResponse {
  success: boolean;
  data: SellerStore;
  message?: string;
}

export interface SellerProduct {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  stockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProductsResponse {
  success: boolean;
  data: SellerProduct[];
}

export interface SellerProductResponse {
  success: boolean;
  data: SellerProduct;
  message?: string;
}

export interface RequestVerificationBody {
  businessAddress: string;
  cacNumber?: string;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add types/seller.ts
git commit -m "feat(seller): store + product types"
```

---

## Task 2: API service

**Files:**
- Create: `lib/seller-api.ts`

- [ ] **Step 1: Create `lib/seller-api.ts`**

```typescript
import { api } from "@/lib/api";
import type {
  SellerStoreResponse,
  SellerProductsResponse,
  SellerProductResponse,
  RequestVerificationBody,
} from "@/types/seller";

const BASE = "/api/nestmarkets";

export const sellerApi = {
  getMyStore: () => api.get<SellerStoreResponse>(`${BASE}/my-store`),
  createStore: (form: FormData) => api.post<SellerStoreResponse>(`${BASE}/create-store`, form),
  updateStore: (form: FormData) => api.put<SellerStoreResponse>(`${BASE}/my-store`, form),
  requestVerification: (body: RequestVerificationBody) =>
    api.post<SellerStoreResponse>(`${BASE}/request-verification`, body),

  getMyProducts: () => api.get<SellerProductsResponse>(`${BASE}/my-products`),
  createProduct: (form: FormData) => api.post<SellerProductResponse>(`${BASE}/products`, form),
  updateProduct: (id: string, form: FormData) =>
    api.put<SellerProductResponse>(`${BASE}/products/${id}`, form),
  deleteProduct: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`${BASE}/products/${id}`),
};
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/seller-api.ts
git commit -m "feat(seller): api service"
```

---

## Task 3: Hooks

**Files:**
- Create: `hooks/use-my-store.ts`
- Create: `hooks/use-my-products.ts`

- [ ] **Step 1: Create `hooks/use-my-store.ts`** (404 = no store, not an error)

```typescript
"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";
import type { SellerStore } from "@/types/seller";

export const SELLER_STORE_KEY = "seller-store";

export function useMyStore() {
  const { data: res, error, isLoading, mutate } = useSWR(
    [SELLER_STORE_KEY],
    () => sellerApi.getMyStore(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000, shouldRetryOnError: false }
  );

  // 404 means "no store yet" — a normal state, not an error.
  const noStore = res?.status === 404;
  const store: SellerStore | null = res?.data?.data ?? null;
  const realError = !!(error || (res?.error && !noStore));

  return {
    store,
    hasStore: !!store,
    isLoading,
    error: realError,
    mutate,
  };
}
```

- [ ] **Step 2: Create `hooks/use-my-products.ts`**

```typescript
"use client";

import useSWR from "swr";
import { sellerApi } from "@/lib/seller-api";

export const SELLER_PRODUCTS_KEY = "seller-products";

export function useMyProducts(enabled: boolean) {
  const { data: res, error, isLoading, mutate } = useSWR(
    enabled ? [SELLER_PRODUCTS_KEY] : null,
    () => sellerApi.getMyProducts(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    products: res?.data?.data ?? [],
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-my-store.ts hooks/use-my-products.ts
git commit -m "feat(seller): SWR hooks for store + products"
```

---

## Task 4: Image picker + status badge (shared primitives)

**Files:**
- Create: `components/seller/image-picker.tsx`
- Create: `components/seller/store-status-badge.tsx`

- [ ] **Step 1: `components/seller/image-picker.tsx`** (file input + preview)

```tsx
"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagePicker({
  label, initialUrl, onChange, aspect = "square",
}: {
  label: string;
  initialUrl?: string | null;
  onChange: (file: File | null) => void;
  aspect?: "square" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

  const pick = (file: File | null) => {
    onChange(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted flex items-center justify-center",
          aspect === "square" ? "aspect-square max-w-40" : "aspect-[16/5]"
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
            <ImagePlus className="size-5" /> Upload
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: `components/seller/store-status-badge.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { SellerStore } from "@/types/seller";

export function StoreStatusBadge({ store }: { store: SellerStore }) {
  const verified = store.isVerified && store.status === "active";
  const label = verified ? "Verified" : store.verificationRequestedAt ? "Pending review" : "Unverified";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
        verified
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-muted text-muted-foreground border-border"
      )}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/image-picker.tsx components/seller/store-status-badge.tsx
git commit -m "feat(seller): image picker + store status badge"
```

---

## Task 5: Store form + create wizard

**Files:**
- Create: `components/seller/store-form.tsx`
- Create: `components/seller/create-store-wizard.tsx`

- [ ] **Step 1: `components/seller/store-form.tsx`** (shared fields; controlled by parent)

This is a presentational fieldset used by both the wizard (step 1) and edit. It owns local field state and image files, and exposes them via `onChange`.

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "./image-picker";
import type { SellerStore } from "@/types/seller";

export interface StoreFormValue {
  name: string;
  description: string;
  businessAddress: string;
  logo: File | null;
  banner: File | null;
}

export function StoreForm({
  initial, value, onChange,
}: {
  initial?: SellerStore | null;
  value: StoreFormValue;
  onChange: (v: StoreFormValue) => void;
}) {
  const set = (patch: Partial<StoreFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker label="Logo" initialUrl={initial?.logoUrl} onChange={(f) => set({ logo: f })} aspect="square" />
        <ImagePicker label="Banner" initialUrl={initial?.bannerUrl} onChange={(f) => set({ banner: f })} aspect="banner" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Store name</label>
        <Input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Mama's Kitchen" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={value.description} onChange={(e) => set({ description: e.target.value })} placeholder="What does your store sell?" maxLength={500} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Business address <span className="text-muted-foreground">(optional now, required for verification)</span></label>
        <Input value={value.businessAddress} onChange={(e) => set({ businessAddress: e.target.value })} placeholder="Street, city, state" />
      </div>
    </div>
  );
}

export function emptyStoreForm(initial?: SellerStore | null): StoreFormValue {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    businessAddress: initial?.businessAddress ?? "",
    logo: null,
    banner: null,
  };
}

export function storeFormToFormData(v: StoreFormValue, includePin?: string): FormData {
  const fd = new FormData();
  fd.append("name", v.name);
  if (v.description) fd.append("description", v.description);
  if (v.businessAddress) fd.append("businessAddress", v.businessAddress);
  if (v.logo) fd.append("logo", v.logo);
  if (v.banner) fd.append("banner", v.banner);
  if (includePin) fd.append("pin", includePin);
  return fd;
}
```

- [ ] **Step 2: `components/seller/create-store-wizard.tsx`** (2-step: details → PIN/pay)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "./store-form";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import { AddMoneyDialog } from "@/components/purse/add-money-dialog";

export function CreateStoreWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<StoreFormValue>(emptyStoreForm());
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [lowBalance, setLowBalance] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const next = () => {
    if (form.name.trim().length < 3) return toast.error("Store name must be at least 3 characters");
    setStep(2);
  };

  const submit = async () => {
    if (pin.length !== 4) return toast.error("Enter your 4-digit PIN");
    setBusy(true);
    setLowBalance(false);
    const r = await sellerApi.createStore(storeFormToFormData(form, pin));
    setBusy(false);
    if (r.error || !r.data?.success) {
      if (r.status === 400) { setLowBalance(true); return; }
      return toast.error(r.error || "Could not create store");
    }
    toast.success("Store created — ₦1,000 debited");
    globalMutate([SELLER_STORE_KEY]);
    globalMutate("user-profile");
    router.push("/seller/store");
  };

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create your store</h1>
        <p className="text-sm text-muted-foreground">Step {step} of 2 · A one-time ₦1,000 setup fee applies.</p>
      </div>

      {step === 1 ? (
        <>
          <StoreForm value={form} onChange={setForm} />
          <Button onClick={next} className="w-full">Continue</Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Store</span><span className="font-medium">{form.name}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Setup fee</span><span className="font-semibold text-primary">₦1,000</span></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Transaction PIN</label>
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="tracking-[0.5em] text-center" />
          </div>
          {lowBalance && (
            <p className="text-sm text-destructive">
              Insufficient balance for the ₦1,000 fee.{" "}
              <button onClick={() => setTopUpOpen(true)} className="underline font-medium">Top up</button>
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy} className="flex-1">Back</Button>
            <Button onClick={submit} disabled={busy} className="flex-1">Pay ₦1,000 & create</Button>
          </div>
        </div>
      )}

      <AddMoneyDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}
```

> NOTE: Confirm `AddMoneyDialog`'s prop names by reading `components/purse/add-money-dialog.tsx`. If it uses different props (e.g. `isOpen`/`onClose` or a trigger child), adapt this usage to match — keep the "Top up" button opening it. If it can't be opened controlled, replace the button with a `Link` to `/nestpurse`.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/store-form.tsx components/seller/create-store-wizard.tsx
git commit -m "feat(seller): store form + create wizard"
```

---

## Task 6: Verification panel + store page

**Files:**
- Create: `components/seller/verification-panel.tsx`
- Create: `app/seller/store/page.tsx`

- [ ] **Step 1: `components/seller/verification-panel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import type { SellerStore } from "@/types/seller";

export function VerificationPanel({ store }: { store: SellerStore }) {
  const [address, setAddress] = useState(store.businessAddress ?? "");
  const [cac, setCac] = useState(store.cacNumber ?? "");
  const [busy, setBusy] = useState(false);

  if (store.isVerified && store.status === "active") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
        Your store is verified and live in the marketplace. 🎉
      </div>
    );
  }

  const submit = async () => {
    if (address.trim().length < 10) return toast.error("Business address must be at least 10 characters");
    setBusy(true);
    const r = await sellerApi.requestVerification({ businessAddress: address.trim(), cacNumber: cac.trim() || undefined });
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not submit verification");
    toast.success("Verification requested — under review");
    globalMutate([SELLER_STORE_KEY]);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Verification</h2>
        <p className="text-sm text-muted-foreground">
          {store.verificationRequestedAt ? "Your request is under review. You can update and resubmit below." : "Verify your store to appear in the marketplace."}
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Business address</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">CAC number <span className="text-muted-foreground">(optional)</span></label>
        <Input value={cac} onChange={(e) => setCac(e.target.value)} placeholder="RC123456" />
      </div>
      <Button onClick={submit} disabled={busy}>{store.verificationRequestedAt ? "Resubmit" : "Request verification"}</Button>
    </div>
  );
}
```

- [ ] **Step 2: `app/seller/store/page.tsx`** (no store → wizard; has store → edit + verification)

READ `app/marketplace/vendors/page.tsx` first to copy the exact shell (`SidebarProvider/AppSidebar/SidebarInset` + header + breadcrumb). Then:

```tsx
"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreateStoreWizard } from "@/components/seller/create-store-wizard";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "@/components/seller/store-form";
import { VerificationPanel } from "@/components/seller/verification-panel";
import { StoreStatusBadge } from "@/components/seller/store-status-badge";
import { useMyStore, SELLER_STORE_KEY } from "@/hooks/use-my-store";
import { sellerApi } from "@/lib/seller-api";

export default function SellerStorePage() {
  const { store, hasStore, isLoading } = useMyStore();
  const [form, setForm] = useState<StoreFormValue | null>(null);
  const [busy, setBusy] = useState(false);

  // initialise edit form once store loads
  const editForm = form ?? emptyStoreForm(store);

  const saveEdit = async () => {
    setBusy(true);
    const r = await sellerApi.updateStore(storeFormToFormData(editForm));
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not update store");
    toast.success("Store updated");
    globalMutate([SELLER_STORE_KEY]);
    setForm(null);
  };

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
              <BreadcrumbItem><BreadcrumbPage>My Store</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <Skeleton className="h-80 max-w-xl mx-auto rounded-2xl" />
          ) : !hasStore || !store ? (
            <CreateStoreWizard />
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{store.name}</h1>
                <StoreStatusBadge store={store} />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h2 className="font-semibold">Store details</h2>
                <StoreForm initial={store} value={editForm} onChange={setForm} />
                <Button onClick={saveEdit} disabled={busy}>Save changes</Button>
              </div>
              <VerificationPanel store={store} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/verification-panel.tsx "app/seller/store/page.tsx"
git commit -m "feat(seller): store page (create/edit) + verification panel"
```

---

## Task 7: Product form sheet + card + grid

**Files:**
- Create: `components/seller/product-form-sheet.tsx`
- Create: `components/seller/seller-product-card.tsx`
- Create: `components/seller/seller-product-grid.tsx`

- [ ] **Step 1: `components/seller/product-form-sheet.tsx`** (add/edit)

```tsx
"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "./image-picker";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_PRODUCTS_KEY } from "@/hooks/use-my-products";
import type { SellerProduct } from "@/types/seller";

export function ProductFormSheet({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (o: boolean) => void; product?: SellerProduct | null }) {
  const editing = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [stock, setStock] = useState(product ? String(product.stockLevel) : "0");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (name.trim().length < 3) return toast.error("Product name must be at least 3 characters");
    if (!(Number(price) > 0)) return toast.error("Price must be greater than zero");
    const fd = new FormData();
    fd.append("name", name.trim());
    if (description) fd.append("description", description);
    fd.append("price", String(Number(price)));
    if (category) fd.append("category", category);
    fd.append("stockLevel", String(parseInt(stock || "0", 10)));
    if (image) fd.append("image", image);

    setBusy(true);
    const r = editing
      ? await sellerApi.updateProduct(product!.id, fd)
      : await sellerApi.createProduct(fd);
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not save product");
    toast.success(editing ? "Product updated" : "Product added");
    globalMutate([SELLER_PRODUCTS_KEY]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{editing ? "Edit product" : "Add product"}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <ImagePicker label="Product image" initialUrl={product?.imageUrl} onChange={setImage} aspect="square" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Party Jollof Combo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Price (₦)</label>
              <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stock</label>
              <Input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Rice, Snacks, Drinks" />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">{editing ? "Save changes" : "Add product"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: `components/seller/seller-product-card.tsx`**

```tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { SellerProduct } from "@/types/seller";

export function SellerProductCard({
  product, onEdit, onDelete,
}: { product: SellerProduct; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {product.imageUrl && <img src={product.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {product.stockLevel <= 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">Out of stock</span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
        <p className="text-base font-semibold text-primary">₦{product.price.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{product.stockLevel} in stock{product.category ? ` · ${product.category}` : ""}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs hover:bg-muted transition-colors"><Pencil className="size-3.5" /> Edit</button>
          <button onClick={onDelete} className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `components/seller/seller-product-grid.tsx`** (grid + skeleton + empty)

```tsx
"use client";

import { PackagePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SellerProductCard } from "./seller-product-card";
import type { SellerProduct } from "@/types/seller";

export function SellerProductGrid({
  products, isLoading, onAdd, onEdit, onDelete,
}: {
  products: SellerProduct[]; isLoading: boolean;
  onAdd: () => void; onEdit: (p: SellerProduct) => void; onDelete: (p: SellerProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackagePlus className="size-8 text-muted-foreground mb-2" />
        <p className="font-medium">No products yet</p>
        <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling.</p>
        <Button onClick={onAdd}>Add product</Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <SellerProductCard key={p.id} product={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/seller/product-form-sheet.tsx components/seller/seller-product-card.tsx components/seller/seller-product-grid.tsx
git commit -m "feat(seller): product form sheet, card, grid"
```

---

## Task 8: Products page

**Files:**
- Create: `app/seller/products/page.tsx`

- [ ] **Step 1: `app/seller/products/page.tsx`** (no store → CTA; has store → grid + add/edit/delete + pre-verify banner)

Uses shadcn `AlertDialog` for delete confirm — verify it exists at `components/ui/alert-dialog.tsx`; if not, use a simple `window.confirm` guard instead (note inline).

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Plus, Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SellerProductGrid } from "@/components/seller/seller-product-grid";
import { ProductFormSheet } from "@/components/seller/product-form-sheet";
import { useMyStore } from "@/hooks/use-my-store";
import { useMyProducts, SELLER_PRODUCTS_KEY } from "@/hooks/use-my-products";
import { sellerApi } from "@/lib/seller-api";
import type { SellerProduct } from "@/types/seller";

export default function SellerProductsPage() {
  const { store, hasStore, isLoading: storeLoading } = useMyStore();
  const { products, isLoading: productsLoading } = useMyProducts(hasStore);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SellerProduct | null>(null);

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (p: SellerProduct) => { setEditing(p); setSheetOpen(true); };
  const remove = async (p: SellerProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const r = await sellerApi.deleteProduct(p.id);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not delete product");
    toast.success("Product deleted");
    globalMutate([SELLER_PRODUCTS_KEY]);
  };

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
              <BreadcrumbItem><BreadcrumbPage>Products</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {hasStore && (
            <div className="ml-auto">
              <Button onClick={openAdd} size="sm"><Plus className="size-4" /> Add product</Button>
            </div>
          )}
        </header>

        <div className="p-4 md:p-6 space-y-4">
          {!storeLoading && !hasStore ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">You need a store before adding products.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <>
              {hasStore && store && !(store.isVerified && store.status === "active") && (
                <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Your products will go live in the marketplace once your store is verified.{" "}
                  <Link href="/seller/store" className="underline font-medium text-foreground">Request verification</Link>
                </div>
              )}
              <SellerProductGrid
                products={products}
                isLoading={storeLoading || productsLoading}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={remove}
              />
            </>
          )}
        </div>

        <ProductFormSheet
          key={editing?.id ?? "new"}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          product={editing}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

> NOTE: the `key={editing?.id ?? "new"}` on the sheet forces the form to re-mount with fresh field state each time you switch between add and editing different products (the form initializes state from props on mount).

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add "app/seller/products/page.tsx"
git commit -m "feat(seller): products page with CRUD"
```

---

## Task 9: Seller landing page + sidebar group

**Files:**
- Create: `app/seller/page.tsx`
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: `app/seller/page.tsx`** (no store → CTA; has store → thin overview)

```tsx
"use client";

import Link from "next/link";
import { Store, Package, ShieldCheck } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StoreStatusBadge } from "@/components/seller/store-status-badge";
import { useMyStore } from "@/hooks/use-my-store";

export default function SellerDashboardPage() {
  const { store, hasStore, isLoading } = useMyStore();

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
            <Skeleton className="h-48 max-w-2xl rounded-2xl" />
          ) : !hasStore || !store ? (
            <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-card p-8">
              <Store className="size-10 text-primary mx-auto mb-3" />
              <h1 className="text-xl font-semibold">Start selling on NestMarket</h1>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Open a store, list your products, and reach buyers across GrowNest. A one-time ₦1,000 setup fee applies.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-muted overflow-hidden">
                    {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold truncate">{store.name}</h1>
                      <StoreStatusBadge store={store} />
                    </div>
                    <p className="text-xs text-muted-foreground">{store._count?.products ?? 0} products · ⭐ {store.averageRating?.toFixed(1) ?? "—"} ({store.ratingCount})</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/seller/store" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                  <ShieldCheck className="size-6 text-primary mb-2" />
                  <p className="font-medium">Store & verification</p>
                  <p className="text-sm text-muted-foreground">Edit details, manage verification.</p>
                </Link>
                <Link href="/seller/products" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                  <Package className="size-6 text-primary mb-2" />
                  <p className="font-medium">Products</p>
                  <p className="text-sm text-muted-foreground">Add and manage your catalog.</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Add the "Sell on NestMarket" sidebar group**

In `components/app-sidebar.tsx`, the `navMain` array has entries like the NestMarket group (`{ title, url, icon: <StoreIcon/>, items: [...] }`). Add a NEW group after the NestMarket group. Reuse an imported icon already in the file (`StoreIcon` is imported). Insert:

```tsx
    {
      title: "Sell on NestMarket",
      url: "/seller",
      icon: <StoreIcon />,
      items: [
        { title: "Dashboard", url: "/seller" },
        { title: "My Store", url: "/seller/store" },
        { title: "Products", url: "/seller/products" },
      ],
    },
```

(If `StoreIcon` is already used by the NestMarket group and you prefer a distinct icon, import one already available in lucide — but reusing `StoreIcon` is fine and requires no new import.)

- [ ] **Step 3: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint shows only intentional `<img>` warnings in new files; build lists `/seller`, `/seller/store`, `/seller/products`.

- [ ] **Step 4: Commit**

```bash
git add "app/seller/page.tsx" components/app-sidebar.tsx
git commit -m "feat(seller): dashboard landing + sidebar group"
```

---

## Task 10: Cross-screen QA

- [ ] **Step 1: Manual walkthrough** (`npm run dev`, backend deployed OR mock re-enabled)

1. Sidebar shows "Sell on NestMarket" → Dashboard. With no store: CTA → `/seller/store` wizard.
2. Wizard step 1 (name/desc/logo/banner) → step 2 (PIN). Wrong PIN → inline error; insufficient balance → "Top up" link; success → ₦1,000 toast, lands on store page with "Unverified" badge.
3. Store page: edit details + save; Verification panel → submit address (≥10) → "Pending review" badge.
4. Products: empty state → Add product (image, name, price, stock, category) → appears in grid; edit changes it; delete (confirm) removes it. Pre-verify banner shows until verified.
5. Dashboard now shows store overview with product count + quick links.

- [ ] **Step 2: Dark mode + responsive** — toggle dark mode; resize to ~375px (forms stack, grid 2-up). All gold tokens, no emerald/slate.

- [ ] **Step 3: Final build green** — `npm run build` succeeds.

---

## Self-review notes (coverage map)

- Spec §3 endpoints → Task 2 api covers all. §4.1 routes+sidebar → Tasks 6, 8, 9. §4.2 api → Task 2. §4.3 hooks (404=no store) → Task 3. §4.4 components → Tasks 4, 5, 6, 7. §4.5 flows (create/edit/verify/products) → Tasks 5, 6, 7, 8. §4.6 errors/states → wizard (400/401), verification (≥10), products empty/skeleton, purse revalidate (Task 5).
- §6 open items: `MarketStore` fields encoded in Task 1 types; 400-vs-401 handled via `r.status` in the wizard (Task 5). `AddMoneyDialog` prop names flagged to confirm in Task 5; `alert-dialog` existence flagged in Task 8 (fallback `window.confirm` provided so the task can't block).
- Pattern parity: page shells copy `app/marketplace/vendors/page.tsx`; tokens + `<img>` + SWR conventions consistent with prior cycles.
