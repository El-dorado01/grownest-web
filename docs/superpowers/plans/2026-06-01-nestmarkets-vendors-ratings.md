# NestMarkets Buyer Fast-Follow (Cycle A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vendor profiles + follow, vendor discovery (all / top-rated / opt-in nearby), and ratings (rate from order card + read reviews on vendor profile) to the NestMarkets buyer experience.

**Architecture:** Mostly frontend on the merged buyer portal. Backend gets three small additive reads (no schema change, no migration): a store-reviews endpoint, products+counts on store detail, and `rating` on the orders list. Frontend follows the established pattern (`types → lib/*-api → SWR hooks → components/nestmarkets → app/marketplace/*`), reusing Cycle A's `ProductCard`/`ProductQuickView`/`useCart` on the vendor profile.

**Tech Stack:** Backend — Node/Express, Prisma, PostgreSQL, Zod. Frontend — Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, Sonner, Lucide.

**Verification model:** No automated test runner in either repo. Each task verified by **typecheck + build + lint** (frontend) / **tsc/build** (backend) and **manual checks**. The user runs/deploys the backend; the assistant writes backend code only.

**Reference spec:** `docs/superpowers/specs/2026-06-01-nestmarkets-buyer-fastfollow-design.md`

**Key facts (verified against code):**
- Existing endpoints (merged): `POST /stores/:id/follow` (toggle, returns `{ success, followed }`), `GET /followed-stores` (returns `{ success, data: store[] }`), `GET /stores` (`{ success, data, total }`), `GET /stores/:id` (`{ success, data: store }`), `GET /recommendations/top-rated?limit` (`{ success, data }`), `GET /recommendations/nearby?lat&lon&limit` (`{ success, data }` with `distance` per store), `POST /orders/:id/rate` body `{ rating:1-5, review?:string<=500 }`.
- `MarketStore` has: id, ownerId, name, description, logoUrl, bannerUrl, isVerified, status, latitude, longitude, averageRating, ratingCount, businessAddress, and relations `followers`, `products`, `ratings`, `_count`.
- `Profile` has `fullName` (nullable) and `profilePhoto` (nullable); rating buyer relation references `supabaseUserId`.
- All NestMarkets routes mounted at `/api/nestmarkets`. `/stores*` GETs are public (no `authenticateToken`); follow + rate require auth.
- FE `api.get/post/patch/delete<T>(endpoint, body?)` → `{ data, error, status }`. SWR convention `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`; optimistic `mutate(updater,{revalidate:false})`.
- Sidebar nav: `components/app-sidebar.tsx` has a "NestMarket" group with an `items: [{title,url}]` array (Marketplace, My Baskets, My Orders).
- Repo paths: backend `C:\Users\ambal\Desktop\Gigs\BE\GrowNest.Africa`, frontend `C:\Users\ambal\Desktop\Gigs\grownest-web`. Frontend branch: `feat/nestmarkets-vendors-ratings` (already created).

---

# PART A — BACKEND (`GrowNest.Africa`)

> Branch: `git checkout -b feat/nestmarkets-store-reviews`. Write code only; the USER deploys. Do NOT run prisma migrate/db push (no schema changes here anyway).

## Task 1: Store reviews endpoint + richer store detail + rating on orders

**Files:**
- Modify: `src/routes/nestmarkets.ts`

- [ ] **Step 1: Add `GET /stores/:id/reviews` (paginated)**

In `src/routes/nestmarkets.ts`, add this route immediately AFTER the existing `router.get("/stores/:id", ...)` handler (around line 822, before `// Get store transactions/orders`):

```typescript
// Get a store's reviews (public, paginated)
router.get("/stores/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.marketRating.findMany({
        where: { storeId: id as string },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          buyer: { select: { fullName: true, profilePhoto: true } },
        },
      }),
      prisma.marketRating.count({ where: { storeId: id as string } }),
    ]);

    return res.json({
      success: true,
      data: reviews,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get store reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});
```

- [ ] **Step 2: Include products + follower count on `GET /stores/:id`**

In the existing `router.get("/stores/:id", ...)` handler, replace the `prisma.marketStore.findUnique({...})` `include` block so the profile page gets products and counts:

```typescript
    const store = await prisma.marketStore.findUnique({
      where: { id: id as string },
      include: {
        _count: { select: { products: true, followers: true } },
        products: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
```

- [ ] **Step 3: Include `rating` on `GET /my-orders`**

In the existing `router.get("/my-orders", ...)` handler, add `rating: true` to the order `include` (alongside `items` and `store`) so the buyer UI knows whether an order was already rated:

```typescript
          include: {
            items: { include: { product: true } },
            store: { select: { id: true, name: true, logoUrl: true } },
            rating: true,
          },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `prisma generate && tsc` completes with no errors (no schema change, so the client already knows `marketRating`, `products`, `rating`).

- [ ] **Step 5: Manual verification (server running)**

```bash
curl "localhost:3001/api/nestmarkets/stores/<STORE_ID>/reviews?page=1&limit=5"
curl "localhost:3001/api/nestmarkets/stores/<STORE_ID>"   # data.products[] + data._count present
curl "localhost:3001/api/nestmarkets/my-orders" -H "Authorization: Bearer <TOKEN>"   # each order has rating (null or object)
```
Expected: reviews list with `pagination`; store detail now includes `products` + `_count.followers`; orders include `rating`.

- [ ] **Step 6: Commit + push**

```bash
git add src/routes/nestmarkets.ts
git commit -m "feat(nestmarkets): store reviews endpoint, products+counts on store detail, rating on my-orders"
git push -u origin feat/nestmarkets-store-reviews
```

---

# PART B — FRONTEND (`grownest-web`)

> On branch `feat/nestmarkets-vendors-ratings`. Semantic tokens only (`bg-primary`,`text-primary`,`text-primary-foreground`,`bg-card`,`border-border`,`bg-muted`,`text-muted-foreground`,`text-destructive`,`rounded-lg/xl/2xl`). Use `<img>` for remote images. Verify each task with `npm run typecheck`; run `npm run lint` at the end (fix only your files).

## Task 2: Types

**Files:**
- Modify: `types/nestmarkets.ts`

- [ ] **Step 1: Add vendor + review types and extend `MarketOrder`**

Append to `types/nestmarkets.ts`:

```typescript
export interface MarketStore {
  id: string;
  ownerId?: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  averageRating: number;
  ratingCount: number;
  latitude: number | null;
  longitude: number | null;
  businessAddress: string | null;
  isVerified: boolean;
  status: string;
  distance?: number; // present on nearby results
  _count?: { products: number; followers: number };
  products?: MarketProduct[];
}

export interface StoresResponse {
  success: boolean;
  data: MarketStore[];
  total?: number;
}

export interface StoreResponse {
  success: boolean;
  data: MarketStore;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  followed: boolean;
}

export interface MarketReview {
  id: string;
  orderId: string;
  storeId: string;
  rating: number;
  review: string | null;
  createdAt: string;
  buyer: { fullName: string | null; profilePhoto: string | null };
}

export interface StoreReviewsResponse {
  success: boolean;
  data: MarketReview[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
```

Then add an optional `rating` field to the existing `MarketOrder` interface (so the order card can tell if it was rated). Add this line inside `MarketOrder`:

```typescript
  rating?: { id: string; rating: number; review: string | null } | null;
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add types/nestmarkets.ts
git commit -m "feat(nestmarkets): vendor, review, and order-rating types"
```

---

## Task 3: API service additions

**Files:**
- Modify: `lib/nestmarkets-api.ts`

- [ ] **Step 1: Add vendor/follow/review/rate methods**

In `lib/nestmarkets-api.ts`, extend the imports and add methods. Update the import block:

```typescript
import type {
  BrowseResponse,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyOrdersResponse,
  StoresResponse,
  StoreResponse,
  FollowResponse,
  StoreReviewsResponse,
} from "@/types/nestmarkets";
```

Add these methods inside the `nestMarketsApi` object (after `rejectOrder`):

```typescript
  // Vendors / discovery
  getStores: () => api.get<StoresResponse>(`${BASE}/stores`),
  getStore: (id: string) => api.get<StoreResponse>(`${BASE}/stores/${id}`),
  topRated: (limit = 10) => api.get<StoresResponse>(`${BASE}/recommendations/top-rated?limit=${limit}`),
  nearby: (lat: number, lon: number, limit = 20) =>
    api.get<StoresResponse>(`${BASE}/recommendations/nearby?lat=${lat}&lon=${lon}&limit=${limit}`),

  // Follow
  followStore: (id: string) => api.post<FollowResponse>(`${BASE}/stores/${id}/follow`),
  getFollowedStores: () => api.get<StoresResponse>(`${BASE}/followed-stores`),

  // Reviews / rating
  getStoreReviews: (id: string, page = 1, limit = 10) =>
    api.get<StoreReviewsResponse>(`${BASE}/stores/${id}/reviews?page=${page}&limit=${limit}`),
  rateOrder: (id: string, rating: number, review?: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/rate`, { rating, review }),
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/nestmarkets-api.ts
git commit -m "feat(nestmarkets): api methods for vendors, follow, reviews, rating"
```

---

## Task 4: Hooks

**Files:**
- Create: `hooks/use-vendors.ts`
- Create: `hooks/use-vendor.ts`

- [ ] **Step 1: Create `hooks/use-vendors.ts`**

```typescript
"use client";

import { useState } from "react";
import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useVendors() {
  const topRated = useSWR(["nestmarket-top-rated"], () => nestMarketsApi.topRated(12), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });
  const all = useSWR(["nestmarket-stores"], () => nestMarketsApi.getStores(), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });
  const followed = useSWR(["nestmarket-followed"], () => nestMarketsApi.getFollowedStores(), {
    revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000,
  });

  // Nearby is lazy — only fetched once coords are set
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const nearby = useSWR(
    coords ? ["nestmarket-nearby", coords.lat, coords.lon] : null,
    () => nestMarketsApi.nearby(coords!.lat, coords!.lon),
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  const followedIds = new Set((followed.data?.data?.data ?? []).map((s) => s.id));

  return {
    topRated: topRated.data?.data?.data ?? [],
    topRatedLoading: topRated.isLoading,
    allStores: all.data?.data?.data ?? [],
    allLoading: all.isLoading,
    followedIds,
    nearby: nearby.data?.data?.data ?? [],
    nearbyLoading: !!coords && nearby.isLoading,
    setCoords,
    hasNearby: !!coords,
  };
}
```

- [ ] **Step 2: Create `hooks/use-vendor.ts`**

```typescript
"use client";

import { useState } from "react";
import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useVendor(id: string) {
  const store = useSWR(
    id ? ["nestmarket-store", id] : null,
    () => nestMarketsApi.getStore(id),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const [reviewsPage, setReviewsPage] = useState(1);
  const reviews = useSWR(
    id ? ["nestmarket-store-reviews", id, reviewsPage] : null,
    () => nestMarketsApi.getStoreReviews(id, reviewsPage),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    store: store.data?.data ?? null,
    products: store.data?.data?.products ?? [],
    isLoading: store.isLoading,
    error: !!(store.error || store.data?.error),
    mutateStore: store.mutate,
    reviews: reviews.data?.data ?? [],
    reviewsPagination: reviews.data?.pagination ?? { total: 0, page: 1, limit: 10, pages: 1 },
    reviewsLoading: reviews.isLoading,
    reviewsPage,
    setReviewsPage,
    mutateReviews: reviews.mutate,
  };
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-vendors.ts hooks/use-vendor.ts
git commit -m "feat(nestmarkets): SWR hooks for vendors and vendor detail"
```

---

## Task 5: Follow button + vendor card + vendor grid

**Files:**
- Create: `components/nestmarkets/follow-button.tsx`
- Create: `components/nestmarkets/vendor-card.tsx`
- Create: `components/nestmarkets/vendor-grid.tsx`

- [ ] **Step 1: `components/nestmarkets/follow-button.tsx`** (optimistic toggle)

```tsx
"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function FollowButton({
  storeId, initialFollowing, onToggled, className,
}: { storeId: string; initialFollowing: boolean; onToggled?: (following: boolean) => void; className?: string }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !following;
    setFollowing(next); // optimistic
    setBusy(true);
    const r = await nestMarketsApi.followStore(storeId);
    setBusy(false);
    if (r.error || !r.data?.success) {
      setFollowing(!next); // rollback
      return toast.error(r.error || "Could not update follow");
    }
    const actual = r.data.followed;
    setFollowing(actual);
    onToggled?.(actual);
    globalMutate(["nestmarket-followed"]);
    globalMutate(["nestmarket-store", storeId]);
  };

  return (
    <Button
      onClick={toggle}
      disabled={busy}
      variant={following ? "outline" : "default"}
      className={className}
    >
      <Heart className={cn("size-4", following && "fill-primary text-primary")} />
      {following ? "Following" : "Follow"}
    </Button>
  );
}
```

- [ ] **Step 2: `components/nestmarkets/vendor-card.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { MarketStore } from "@/types/nestmarkets";

export function VendorCard({ store }: { store: MarketStore }) {
  return (
    <Link href={`/marketplace/store/${store.id}`} className="block rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors">
      <div className="relative h-24 bg-muted">
        {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="p-3 -mt-8">
        <div className="size-12 rounded-full bg-muted border-2 border-card overflow-hidden">
          {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <p className="mt-2 font-medium line-clamp-1">{store.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" />{store.averageRating?.toFixed(1) ?? "—"}</span>
          <span>· {store._count?.products ?? 0} products</span>
          {typeof store.distance === "number" && (
            <span className="flex items-center gap-1"><MapPin className="size-3" />{store.distance.toFixed(1)} km</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `components/nestmarkets/vendor-grid.tsx`** (grid + skeleton + empty)

```tsx
"use client";

import { Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorCard } from "./vendor-card";
import type { MarketStore } from "@/types/nestmarkets";

export function VendorGrid({
  stores, isLoading, emptyText = "No vendors found",
}: { stores: MarketStore[]; isLoading: boolean; emptyText?: string }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <Skeleton className="h-24 w-full" />
            <div className="p-3 space-y-2"><Skeleton className="size-12 rounded-full" /><Skeleton className="h-4 w-2/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Store className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stores.map((s) => <VendorCard key={s.id} store={s} />)}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/follow-button.tsx components/nestmarkets/vendor-card.tsx components/nestmarkets/vendor-grid.tsx
git commit -m "feat(nestmarkets): follow button, vendor card, vendor grid"
```

---

## Task 6: Nearby section + Vendors page + sidebar entry

**Files:**
- Create: `components/nestmarkets/nearby-section.tsx`
- Create: `app/marketplace/vendors/page.tsx`
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: `components/nestmarkets/nearby-section.tsx`** (opt-in geolocation)

```tsx
"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorGrid } from "./vendor-grid";
import type { MarketStore } from "@/types/nestmarkets";

export function NearbySection({
  stores, loading, hasNearby, onLocate,
}: {
  stores: MarketStore[]; loading: boolean; hasNearby: boolean;
  onLocate: (lat: number, lon: number) => void;
}) {
  const [geoState, setGeoState] = useState<"idle" | "asking" | "denied">("idle");

  const locate = () => {
    if (!("geolocation" in navigator)) { setGeoState("denied"); return; }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeoState("idle"); onLocate(pos.coords.latitude, pos.coords.longitude); },
      () => setGeoState("denied"),
      { timeout: 10000 }
    );
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Nearby</h2>
      {!hasNearby ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          {geoState === "denied" ? (
            <p className="text-sm text-muted-foreground mb-3">We couldn’t get your location. Allow location access to see nearby stores.</p>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">Find verified stores closest to you.</p>
          )}
          <Button onClick={locate} disabled={geoState === "asking"}>
            {geoState === "asking" ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            Find stores near me
          </Button>
        </div>
      ) : (
        <VendorGrid stores={stores} isLoading={loading} emptyText="No stores near you yet" />
      )}
    </section>
  );
}
```

- [ ] **Step 2: `app/marketplace/vendors/page.tsx`**

Use the same shell as `app/marketplace/page.tsx` (READ it first to copy the exact `SidebarProvider/AppSidebar/SidebarInset` + header + `CartBadge` imports).

```tsx
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { VendorGrid } from "@/components/nestmarkets/vendor-grid";
import { NearbySection } from "@/components/nestmarkets/nearby-section";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useVendors } from "@/hooks/use-vendors";

export default function VendorsPage() {
  const v = useVendors();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Vendors</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 space-y-8">
          <section className="space-y-3">
            <h2 className="font-semibold">Top Rated</h2>
            <VendorGrid stores={v.topRated} isLoading={v.topRatedLoading} emptyText="No top-rated stores yet" />
          </section>
          <NearbySection
            stores={v.nearby} loading={v.nearbyLoading} hasNearby={v.hasNearby}
            onLocate={(lat, lon) => v.setCoords({ lat, lon })}
          />
          <section className="space-y-3">
            <h2 className="font-semibold">All Vendors</h2>
            <VendorGrid stores={v.allStores} isLoading={v.allLoading} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 3: Add "Vendors" sidebar entry**

In `components/app-sidebar.tsx`, in the NestMarket group's `items` array, add after the "Marketplace" item (so order is Marketplace, Vendors, My Baskets, My Orders):

```tsx
        { title: "Vendors", url: "/marketplace/vendors" },
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/nearby-section.tsx app/marketplace/vendors/page.tsx components/app-sidebar.tsx
git commit -m "feat(nestmarkets): vendors discovery page (top-rated, nearby, all) + sidebar entry"
```

---

## Task 7: Store reviews list + vendor profile page

**Files:**
- Create: `components/nestmarkets/store-reviews.tsx`
- Create: `app/marketplace/store/[id]/page.tsx`

- [ ] **Step 1: `components/nestmarkets/store-reviews.tsx`**

```tsx
"use client";

import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { MarketReview } from "@/types/nestmarkets";

export function StoreReviews({
  reviews, isLoading, page, pages, onPage,
}: {
  reviews: MarketReview[]; isLoading: boolean; page: number; pages: number; onPage: (p: number) => void;
}) {
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (reviews.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet</p>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-muted overflow-hidden">
              {r.buyer.profilePhoto && <img src={r.buyer.profilePhoto} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="text-sm font-medium">{r.buyer.fullName ?? "GrowNest user"}</span>
            <span className="ml-auto flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-primary text-primary" />{r.rating}
            </span>
          </div>
          {r.review && <p className="text-sm text-muted-foreground mt-2">{r.review}</p>}
        </div>
      ))}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `app/marketplace/store/[id]/page.tsx`** (profile: header, follow, products, reviews)

Reuses Cycle A `ProductCard` + `ProductQuickView`. READ `app/marketplace/page.tsx` to copy the quick-view wiring pattern.

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/nestmarkets/product-card";
import { ProductQuickView } from "@/components/nestmarkets/product-quick-view";
import { FollowButton } from "@/components/nestmarkets/follow-button";
import { StoreReviews } from "@/components/nestmarkets/store-reviews";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useVendor } from "@/hooks/use-vendor";
import { useVendors } from "@/hooks/use-vendors";
import type { MarketProduct } from "@/types/nestmarkets";

export default function StoreProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { store, products, isLoading, reviews, reviewsPagination, reviewsLoading, reviewsPage, setReviewsPage } = useVendor(id);
  const { followedIds } = useVendors();
  const [selected, setSelected] = useState<MarketProduct | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/marketplace/vendors">Vendors</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{store?.name ?? "Store"}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {isLoading || !store ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="relative h-32 bg-muted">
                {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              <div className="p-4 flex items-start gap-4 -mt-10">
                <div className="size-16 rounded-full bg-muted border-2 border-card overflow-hidden shrink-0">
                  {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 pt-10">
                  <h1 className="text-lg font-semibold">{store.name}</h1>
                  {store.description && <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" />{store.averageRating?.toFixed(1) ?? "—"} ({store.ratingCount})</span>
                    <span>{store._count?.products ?? products.length} products</span>
                    <span>{store._count?.followers ?? 0} followers</span>
                  </div>
                </div>
                <div className="pt-10">
                  <FollowButton storeId={store.id} initialFollowing={followedIds.has(store.id)} />
                </div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold">Products</h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">This store has no products yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={{ ...p, store: { id: store!.id, name: store!.name, logoUrl: store!.logoUrl, averageRating: store!.averageRating } }} onClick={() => { setSelected({ ...p, store: { id: store!.id, name: store!.name, logoUrl: store!.logoUrl, averageRating: store!.averageRating } }); setOpen(true); }} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Reviews</h2>
            <StoreReviews
              reviews={reviews} isLoading={reviewsLoading}
              page={reviewsPagination.page} pages={reviewsPagination.pages} onPage={setReviewsPage}
            />
          </section>
        </div>
        <ProductQuickView product={selected} open={open} onOpenChange={setOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

> NOTE: `MarketProduct.store` is required by `ProductCard`. The store-detail `products` come without an embedded `store`, so we attach a lite `store` object from the loaded `store` (done inline above). If typecheck complains that the lite object is missing `ratingCount`, add `ratingCount: store!.ratingCount` to both inline `store` objects.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/nestmarkets/store-reviews.tsx app/marketplace/store/[id]/page.tsx
git commit -m "feat(nestmarkets): vendor profile page with follow, products, reviews"
```

---

## Task 8: Rate-order dialog + wire into order card

**Files:**
- Create: `components/nestmarkets/rate-order-dialog.tsx`
- Modify: `components/nestmarkets/order-card.tsx`

- [ ] **Step 1: `components/nestmarkets/rate-order-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function RateOrderDialog({
  orderId, open, onOpenChange, onRated,
}: { orderId: string; open: boolean; onOpenChange: (o: boolean) => void; onRated: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (rating < 1) return toast.error("Pick a star rating");
    setBusy(true);
    const r = await nestMarketsApi.rateOrder(orderId, rating, review.trim() || undefined);
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || r.data?.message || "Could not submit rating");
    toast.success("Thanks for your review!");
    onOpenChange(false);
    onRated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rate your order</DialogTitle></DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
              <Star className={cn("size-8", (hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
        <Textarea value={review} onChange={(e) => setReview(e.target.value)} maxLength={500} placeholder="Share details about your experience (optional)" />
        <Button onClick={submit} disabled={busy} className="w-full">Submit rating</Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire "Rate order" into `components/nestmarkets/order-card.tsx`**

Add the import at the top:

```tsx
import { RateOrderDialog } from "./rate-order-dialog";
```

Add state inside the component (next to the existing `rejecting`/`reason`/`busy` state):

```tsx
  const [rating, setRating] = useState(false);
  const canRate = (order.status === "accepted" || order.status === "delivered") && !order.rating;
```

Then, just before the final closing `</div>` of the card (after the existing `delivered && rejecting` block), add the rate affordance + dialog:

```tsx
      {canRate && (
        <Button onClick={() => setRating(true)} variant="outline" className="w-full">Rate order</Button>
      )}
      {order.rating && (
        <p className="text-xs text-muted-foreground">You rated this order {order.rating.rating}★</p>
      )}
      <RateOrderDialog orderId={order.id} open={rating} onOpenChange={setRating} onRated={onChanged} />
```

(`onChanged` is the existing prop that revalidates `useMyOrders`, so the button clears after rating.)

- [ ] **Step 3: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint shows only intentional `<img>` warnings in new files; build succeeds with `/marketplace/vendors` and `/marketplace/store/[id]` routes present.

- [ ] **Step 4: Commit**

```bash
git add components/nestmarkets/rate-order-dialog.tsx components/nestmarkets/order-card.tsx
git commit -m "feat(nestmarkets): rate-order dialog wired into order card"
```

---

## Task 9: Cross-screen QA

- [ ] **Step 1: Manual walkthrough** (`npm run dev`, backend deployed)

1. Sidebar → Vendors → Top Rated + All render; "Find stores near me" prompts geolocation; allow → nearby list by distance; deny → friendly retry message, other sections stay.
2. Click a vendor → profile shows banner/logo/stats, Follow toggles (and persists on reload), products render and open quick-view → add to cart works (Cycle A flow), reviews list paginates or shows "No reviews yet".
3. Orders page → an accepted/delivered order shows "Rate order" → submit ★ + review → button clears, "You rated this order N★" appears; that review now shows on the store's profile.

- [ ] **Step 2: Dark mode + responsive** — toggle dark mode, resize to ~375px. All gold tokens, 2-up grids, no emerald/slate.

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/nestmarkets-vendors-ratings
```

---

## Self-review notes (coverage map)

- Spec §3 store-reviews endpoint → Task 1 Step 1. (Plus additive store-detail products/counts → Task 1 Step 2; orders `rating` → Task 1 Step 3, needed for the "already rated" UI.)
- Spec §4.1 routes + sidebar → Tasks 6 (vendors) & 7 (profile). §4.2 api → Task 3. §4.3 hooks → Task 4. §4.4 components → Tasks 5, 6, 7, 8. §4.5 data flow → Tasks 6–8. §4.6 SWR caching → hooks (Task 4) + follow/rating revalidation (Tasks 5, 8). §4.7 error handling → follow rollback (Task 5), geolocation states (Task 6), rate errors (Task 8), empty/skeleton states (Tasks 5–7).
- Spec §6 open items: store-detail now returns products (Task 1 Step 2 — chosen over filtering browse); `MarketRating.buyer` exposes `fullName`+`profilePhoto` (verified, used in Task 1 Step 1).
