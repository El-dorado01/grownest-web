# NestMarkets Buyer Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the NestMarkets buyer portal — browse products, quick-view, a server-side cart, checkout (flat delivery fee + PIN, paid from NestPurse), and order tracking — across the backend (`GrowNest.Africa`) and frontend (`grownest-web`) repos.

**Architecture:** Backend adds a server-side cart (`MarketCart`/`MarketCartItem`) with CRUD endpoints, a `deliveryFee` column + flat-fee logic in `/checkout`, and pagination on `/browse`. Frontend follows the established NestEggs pattern (`types → lib/*-api → SWR hooks → components/<feature> → app/<route>`) inside the sidebar shell, using semantic brand tokens (gold primary / warm surfaces) and the "Gallery" visual direction.

**Tech Stack:** Backend — Node/Express, Prisma, PostgreSQL, Zod, bcryptjs, encrypted wallet helpers. Frontend — Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, Sonner, Lucide.

**Verification model (per user decision):** No automated test runner exists in either repo (NestEggs shipped this way). Each task is verified by **typecheck + build + lint** and **manual checks** at milestones — not unit tests. Backend money/data-integrity tasks include explicit manual verification via `curl`/REST checks.

**Reference spec:** `docs/superpowers/specs/2026-05-31-nestmarkets-buyer-portal-design.md`

**Key facts (verified against code):**
- NestMarkets endpoints are mounted at `/api/nestmarkets/*` and are all behind `authenticateToken` (so `req.user!.id` is available everywhere, incl. `/browse`).
- Delivery profiles + fee calc live at `/api/nesttrails/*` (used by `lib/nestbaskets-api.ts`).
- FE API client: `api.get/post/patch/delete<T>(endpoint, body?, options?)` returns `{ data: T | null, error: string | null, status: number }`.
- SWR convention: `{ revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }`; optimistic updates via `mutate(updater, { revalidate: false })`.
- Backend repo path: `C:\Users\ambal\Desktop\Gigs\BE\GrowNest.Africa`. Frontend repo path: `C:\Users\ambal\Desktop\Gigs\grownest-web`.

---

# PART A — BACKEND (`GrowNest.Africa`)

> Work on a branch in the backend repo: `git checkout -b feat/nestmarkets-cart-delivery`

## Task 1: Cart Prisma models + migration

**Files:**
- Modify: `prisma/schema.prisma` (add two models + back-relations)

- [ ] **Step 1: Add the cart models to `prisma/schema.prisma`**

Append after the `MarketFollow` model:

```prisma
model MarketCart {
  id        String           @id @default(uuid())
  buyerId   String           @unique
  buyer     Profile          @relation("BuyerToMarketCart", fields: [buyerId], references: [supabaseUserId], onDelete: Cascade)
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

- [ ] **Step 2: Add the back-relation on `MarketProduct`**

In `model MarketProduct`, add this line alongside the existing `orderItems` relation:

```prisma
  cartItems   MarketCartItem[]
```

- [ ] **Step 3: Add the back-relation on `Profile`**

In `model Profile`, add (the name must match the relation label used above):

```prisma
  marketCart  MarketCart? @relation("BuyerToMarketCart")
```

- [ ] **Step 4: Create and apply the migration**

Run: `npx prisma db push`
Expected: schema synced (adds `MarketCart` + `MarketCartItem`), `prisma generate` runs automatically. NOTE: this project uses the `prisma db push` workflow — it has NO `prisma/migrations/` history. Do NOT run `prisma migrate dev` (it reports drift and offers to reset/wipe the DB) and NEVER run `prisma migrate reset` (drops all data).

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `prisma generate && tsc` completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(nestmarkets): add MarketCart and MarketCartItem models"
```

---

## Task 2: Cart endpoints

**Files:**
- Modify: `src/routes/nestmarkets.ts` (add cart routes before `export default router;`)
- Modify: `src/validation/nestmarkets.ts` (add cart schemas)

- [ ] **Step 1: Add cart validation schemas**

Append to `src/validation/nestmarkets.ts`:

```typescript
export const AddCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int(),
});
```

- [ ] **Step 2: Add a cart-fetch helper + GET /cart**

In `src/routes/nestmarkets.ts`, add the import at top if not present (`AddCartItemSchema`, `UpdateCartItemSchema` from validation), then add before `export default router;`:

```typescript
// === CART ===

// Shared include so cart items always carry product + store context
const cartItemInclude = {
  items: {
    include: {
      product: {
        include: {
          store: {
            select: { id: true, name: true, logoUrl: true, isVerified: true, status: true, averageRating: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

async function getOrCreateCart(buyerId: string) {
  let cart = await prisma.marketCart.findUnique({
    where: { buyerId },
    include: cartItemInclude,
  });
  if (!cart) {
    cart = await prisma.marketCart.create({
      data: { buyerId },
      include: cartItemInclude,
    });
  }
  return cart;
}

// Get my cart
router.get("/cart", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await getOrCreateCart(userId);
    return res.json({ success: true, data: cart });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
});
```

- [ ] **Step 3: Add POST /cart/items (add or increment, with validation)**

```typescript
// Add item to cart (or increment quantity)
router.post("/cart/items", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity } = AddCartItemSchema.parse(req.body);

    const product = await prisma.marketProduct.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found or unavailable" });
    }
    if (!product.store.isVerified || product.store.status !== "active") {
      return res.status(400).json({ success: false, message: "This store is not available" });
    }
    if (product.store.ownerId === userId) {
      return res.status(400).json({ success: false, message: "You cannot add your own product to a cart" });
    }

    const cart = await prisma.marketCart.upsert({
      where: { buyerId: userId },
      create: { buyerId: userId },
      update: {},
    });

    const existing = await prisma.marketCartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (product.stockLevel < newQty) {
      return res.status(400).json({ success: false, message: `Only ${product.stockLevel} in stock` });
    }

    await prisma.marketCartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: newQty },
    });

    const full = await getOrCreateCart(userId);
    return res.status(201).json({ success: true, data: full });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues });
    }
    console.error("Add cart item error:", error);
    return res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
});
```

- [ ] **Step 4: Add PATCH /cart/items/:id and DELETE /cart/items/:id**

```typescript
// Update cart item quantity (<=0 removes it)
router.patch("/cart/items/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { quantity } = UpdateCartItemSchema.parse(req.body);

    const item = await prisma.marketCartItem.findFirst({
      where: { id: id as string, cart: { buyerId: userId } },
      include: { product: true },
    });
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

    if (quantity <= 0) {
      await prisma.marketCartItem.delete({ where: { id: item.id } });
    } else {
      if (item.product.stockLevel < quantity) {
        return res.status(400).json({ success: false, message: `Only ${item.product.stockLevel} in stock` });
      }
      await prisma.marketCartItem.update({ where: { id: item.id }, data: { quantity } });
    }

    const full = await getOrCreateCart(userId);
    return res.json({ success: true, data: full });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues });
    }
    console.error("Update cart item error:", error);
    return res.status(500).json({ success: false, message: "Failed to update cart item" });
  }
});

// Remove one cart item
router.delete("/cart/items/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const item = await prisma.marketCartItem.findFirst({
      where: { id: id as string, cart: { buyerId: userId } },
    });
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });
    await prisma.marketCartItem.delete({ where: { id: item.id } });
    const full = await getOrCreateCart(userId);
    return res.json({ success: true, data: full });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove cart item" });
  }
});
```

- [ ] **Step 5: Add DELETE /cart (clear all, or one store via ?storeId=)**

```typescript
// Clear cart (all, or one store's items with ?storeId=)
router.delete("/cart", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const storeId = req.query.storeId as string | undefined;
    const cart = await prisma.marketCart.findUnique({ where: { buyerId: userId } });
    if (cart) {
      await prisma.marketCartItem.deleteMany({
        where: {
          cartId: cart.id,
          ...(storeId ? { product: { storeId } } : {}),
        },
      });
    }
    const full = await getOrCreateCart(userId);
    return res.json({ success: true, data: full });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
});
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 7: Manual verification (server running via `npm run dev`)**

Using a valid bearer token and a real verified-store product id:
```bash
# add
curl -X POST localhost:3001/api/nestmarkets/cart/items -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"productId":"<PID>","quantity":2}'
# get
curl localhost:3001/api/nestmarkets/cart -H "Authorization: Bearer <TOKEN>"
```
Expected: `data.items[0].quantity === 2`, item carries `product.store`. Adding again increments to 4. Over-stock returns 400 with "Only N in stock".

- [ ] **Step 8: Commit**

```bash
git add src/routes/nestmarkets.ts src/validation/nestmarkets.ts
git commit -m "feat(nestmarkets): server-side cart endpoints (get/add/update/remove/clear)"
```

---

## Task 3: Delivery fee on order + checkout change

**Files:**
- Modify: `prisma/schema.prisma` (`MarketOrder.deliveryFee`)
- Modify: `src/validation/nestmarkets.ts` (`CheckoutSchema` — require `deliveryProfileId`)
- Modify: `src/routes/nestmarkets.ts` (`/checkout` handler)

- [ ] **Step 1: Add `deliveryFee` to `MarketOrder`**

In `model MarketOrder` add:

```prisma
  deliveryFee       Float             @default(0)
```

- [ ] **Step 2: Migrate**

Run: `npx prisma db push`
Expected: schema synced (adds `MarketOrder.deliveryFee`), `prisma generate` runs. (This project uses `db push`, not `migrate` — see Task 1 note.)

- [ ] **Step 3: Require `deliveryProfileId` in `CheckoutSchema`**

In `src/validation/nestmarkets.ts`, change the `deliveryProfileId` line in `CheckoutSchema` from `.optional()` to required:

```typescript
  deliveryProfileId: z.string().uuid(),
```

- [ ] **Step 4: Compute the flat delivery fee and charge items + fee**

In `/checkout` in `src/routes/nestmarkets.ts`, locate the existing delivery-profile snapshot block (currently `if (deliveryProfileId) { const dp = ... }`). Replace it with a version that also derives the flat fee, and add the red-flag comment. Insert/replace so the logic reads:

```typescript
      // 3.5 Fetch delivery profile (snapshot) + derive flat delivery fee from its zone
      let addressSnapshot: any = null;
      let deliveryFee = 0;
      const dp = await prisma.deliveryProfile.findUnique({
        where: { id: deliveryProfileId },
        include: { deliveryZone: true },
      });
      if (!dp) {
        return res.status(400).json({ success: false, message: "Invalid delivery address" });
      }
      addressSnapshot = {
        fullName: dp.fullName,
        phone: dp.phone,
        address: dp.address,
        city: dp.city,
        state: dp.state,
        landmark: dp.landmark,
        notes: dp.notes,
        zoneName: dp.deliveryZone?.name || "N/A",
      };
      // Flat fee = zone baseFee. Weight-based pricing deferred (products have no weight yet).
      deliveryFee = dp.deliveryZone?.baseFee ?? 0;

      // 🔴🔴 IMPORTANT — TEMPORARY: seller is NOT paid the delivery fee. 🔴🔴
      // The buyer is charged (items + deliveryFee) but sellerAmount is computed from
      // items only, so the delivery fee is currently retained by the platform with no
      // dedicated ledger entry and no delivery-partner payout. THIS IS A STOPGAP.
      // Before production we must decide who receives the delivery fee and implement
      // its settlement/payout. See spec §3.
```

- [ ] **Step 5: Charge items + fee; persist fee; keep sellerAmount = items only**

Still in `/checkout`, update the money math. The buyer charge becomes `itemsTotal + deliveryFee`; balance check, debit, and the buyer's `purseTransaction.amount` all use `chargeTotal`. `adminFee`/`sellerAmount` stay derived from `totalAmount` (items only). Apply these edits:

Replace the balance check to use the charge total (note: this block currently appears *before* §3.5; move the balance check to *after* the fee is known, or recompute). Final ordering in the handler must be: compute `totalAmount` (items) → fetch profile + `deliveryFee` (§3.5) → `const chargeTotal = totalAmount + deliveryFee;` → balance check against `chargeTotal`:

```typescript
      const chargeTotal = totalAmount + deliveryFee;

      // 3.6 Balance check (against items + delivery)
      const currentBalance = decryptBalance(purse.balanceEnc);
      if (currentBalance < chargeTotal) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
          shortfall: chargeTotal - currentBalance,
        });
      }
```

In the transaction, change the buyer debit + transaction record to use `chargeTotal`:

```typescript
        await tx.nestPurse.update({
          where: { profileId: userId as string, version: purse.version },
          data: {
            balanceEnc: encryptBalance(currentBalance - chargeTotal),
            version: { increment: 1 },
          },
        });

        await tx.purseTransaction.create({
          data: {
            profileId: userId,
            amount: chargeTotal,
            type: "debit",
            method: "market_purchase",
            reference: `MARKET_BUY_${Date.now()}`,
            status: "success",
            narration: `Marketplace purchase from ${dbProducts[0]!.store.name}`,
          },
        });
```

And persist `deliveryFee` on the created order (add to the `data` of `tx.marketOrder.create`):

```typescript
            deliveryFee,
```

(Leave `adminFee` and `sellerAmount` exactly as they were — derived from `totalAmount` / items.)

- [ ] **Step 6: Remove the now-duplicate old balance check**

Delete the original balance-check block (the one that used `totalAmount` and lived before §3.5) so there is only the single `chargeTotal` check from Step 5.

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 8: Manual verification**

Checkout with a delivery profile whose zone `baseFee` = 800 and items totalling 4500:
```bash
curl -X POST localhost:3001/api/nestmarkets/checkout -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<PID>","quantity":1}],"pin":"1234","deliveryProfileId":"<DPID>"}'
```
Expected: order created with `totalAmount: 4500`, `deliveryFee: 800`; buyer purse debited 5300; seller `pendingBalance` increased by `4500 - adminFee`. Insufficient funds returns `{ shortfall }`. Missing `deliveryProfileId` returns 400 Zod error.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/routes/nestmarkets.ts src/validation/nestmarkets.ts
git commit -m "feat(nestmarkets): flat delivery fee on checkout (buyer charged items+fee)"
```

---

## Task 4: Browse pagination

**Files:**
- Modify: `src/routes/nestmarkets.ts` (`/browse` handler)

- [ ] **Step 1: Add page/limit + pagination response to `/browse`**

Replace the body of `router.get("/browse", ...)` query + response so it paginates (keep the existing `where` filter object exactly):

```typescript
  try {
    const { category, search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const userId = getOptionalUserId(req);

    const where = {
      isActive: true,
      store: { isVerified: true, status: "active", NOT: userId ? { ownerId: userId } : [] },
      AND: [
        category ? { category: String(category) } : {},
        search
          ? {
              OR: [
                { name: { contains: String(search), mode: "insensitive" as const } },
                { description: { contains: String(search), mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.marketProduct.findMany({
        where,
        include: {
          store: {
            select: {
              id: true, name: true, logoUrl: true, averageRating: true, ratingCount: true,
              _count: { select: { followers: true, products: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.marketProduct.count({ where }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Browse products error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
curl "localhost:3001/api/nestmarkets/browse?page=1&limit=2" -H "Authorization: Bearer <TOKEN>"
```
Expected: at most 2 products + `pagination: { total, page:1, limit:2, pages }`. `?search=` and `?category=` still filter.

- [ ] **Step 4: Commit + push backend branch**

```bash
git add src/routes/nestmarkets.ts
git commit -m "feat(nestmarkets): paginate /browse"
git push -u origin feat/nestmarkets-cart-delivery
```

---

# PART B — FRONTEND (`grownest-web`)

> Already on branch `feat/nestmarkets-buyer-portal`. All UI uses semantic tokens (`bg-primary`, `text-primary`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `text-destructive`, `rounded-lg/xl/2xl`) — never `emerald-*`/`slate-*`/hex. See spec §7.1.

## Task 5: Types

**Files:**
- Create: `types/nestmarkets.ts`

- [ ] **Step 1: Create `types/nestmarkets.ts`**

```typescript
// types/nestmarkets.ts

export type OrderStatus = "paid" | "delivered" | "accepted" | "rejected" | "pending";
export type TrackingStatus = "received" | "packaged" | "on_the_way" | "delivered";

export interface MarketStoreLite {
  id: string;
  name: string;
  logoUrl: string | null;
  averageRating: number;
  ratingCount?: number;
  isVerified?: boolean;
  status?: string;
}

export interface MarketProduct {
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
  store: MarketStoreLite;
}

export interface BrowseResponse {
  success: boolean;
  data: MarketProduct[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: MarketProduct;
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
}

export interface CartResponse {
  success: boolean;
  data: Cart;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  pin: string;
  deliveryProfileId: string;
}

export interface MarketOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: MarketProduct;
}

export interface MarketOrder {
  id: string;
  storeId: string;
  buyerId: string;
  totalAmount: number;
  deliveryFee: number;
  adminFee: number;
  sellerAmount: number;
  status: OrderStatus;
  trackingStatus: TrackingStatus;
  rejectionReason: string | null;
  addressSnapshot: Record<string, unknown> | null;
  createdAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  items: MarketOrderItem[];
  store: MarketStoreLite;
}

export interface MyOrdersResponse {
  success: boolean;
  data: MarketOrder[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  data?: MarketOrder;
  shortfall?: number;
  requirePin?: boolean;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add types/nestmarkets.ts
git commit -m "feat(nestmarkets): domain types"
```

---

## Task 6: API service

**Files:**
- Create: `lib/nestmarkets-api.ts`

- [ ] **Step 1: Create `lib/nestmarkets-api.ts`**

```typescript
import { api } from "@/lib/api";
import type {
  BrowseResponse,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyOrdersResponse,
} from "@/types/nestmarkets";

const BASE = "/api/nestmarkets";

export const nestMarketsApi = {
  browse: (params: { search?: string; category?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.category) q.set("category", params.category);
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 10));
    return api.get<BrowseResponse>(`${BASE}/browse?${q.toString()}`);
  },

  getCart: () => api.get<CartResponse>(`${BASE}/cart`),
  addCartItem: (productId: string, quantity: number) =>
    api.post<CartResponse>(`${BASE}/cart/items`, { productId, quantity }),
  updateCartItem: (id: string, quantity: number) =>
    api.patch<CartResponse>(`${BASE}/cart/items/${id}`, { quantity }),
  removeCartItem: (id: string) => api.delete<CartResponse>(`${BASE}/cart/items/${id}`),
  clearStoreFromCart: (storeId: string) =>
    api.delete<CartResponse>(`${BASE}/cart?storeId=${storeId}`),

  checkout: (data: CheckoutRequest) => api.post<CheckoutResponse>(`${BASE}/checkout`, data),

  myOrders: (page = 1, limit = 10) =>
    api.get<MyOrdersResponse>(`${BASE}/my-orders?page=${page}&limit=${limit}`),
  acceptOrder: (id: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/accept`),
  rejectOrder: (id: string, reason: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/reject`, { reason }),
};
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add lib/nestmarkets-api.ts
git commit -m "feat(nestmarkets): api service layer"
```

---

## Task 7: SWR hooks

**Files:**
- Create: `hooks/use-marketplace.ts`
- Create: `hooks/use-cart.ts`
- Create: `hooks/use-my-orders.ts`

- [ ] **Step 1: Create `hooks/use-marketplace.ts`**

```typescript
"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useMarketplace(search: string, category: string, page: number, limit = 12) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["nestmarket-browse", search, category, page, limit],
    () => nestMarketsApi.browse({ search, category, page, limit }),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const products = res?.data?.data ?? [];
  const pagination = res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 };
  // Categories derived client-side from the current result set
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c))
  );

  return {
    products,
    pagination,
    categories,
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
```

- [ ] **Step 2: Create `hooks/use-cart.ts` (with optimistic helpers)**

```typescript
"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import type { Cart } from "@/types/nestmarkets";

export const CART_KEY = "nestmarket-cart";

export function useCart() {
  const { data: res, error, isLoading, mutate } = useSWR(
    CART_KEY,
    () => nestMarketsApi.getCart(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const cart: Cart | null = res?.data?.data ?? null;
  const items = cart?.items ?? [];
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  // Group items by store for the cart page
  const byStore = items.reduce<Record<string, { store: typeof items[number]["product"]["store"]; items: typeof items }>>(
    (acc, item) => {
      const sid = item.product.storeId;
      if (!acc[sid]) acc[sid] = { store: item.product.store, items: [] };
      acc[sid].items.push(item);
      return acc;
    },
    {}
  );

  const add = async (productId: string, quantity: number) => {
    const r = await nestMarketsApi.addCartItem(productId, quantity);
    await mutate();
    return r;
  };
  const update = async (id: string, quantity: number) => {
    // optimistic: patch the local cache, then revalidate
    await mutate(
      (cur) =>
        cur?.data?.data
          ? { ...cur, data: { ...cur.data, data: { ...cur.data.data, items: cur.data.data.items.map((it) => (it.id === id ? { ...it, quantity } : it)) } } }
          : cur,
      { revalidate: false }
    );
    const r = await nestMarketsApi.updateCartItem(id, quantity);
    await mutate();
    return r;
  };
  const remove = async (id: string) => {
    await mutate(
      (cur) =>
        cur?.data?.data
          ? { ...cur, data: { ...cur.data, data: { ...cur.data.data, items: cur.data.data.items.filter((it) => it.id !== id) } } }
          : cur,
      { revalidate: false }
    );
    const r = await nestMarketsApi.removeCartItem(id);
    await mutate();
    return r;
  };

  return {
    cart, items, count, byStore,
    isLoading, error: !!(error || res?.error),
    add, update, remove, mutate,
  };
}
```

- [ ] **Step 3: Create `hooks/use-my-orders.ts`**

```typescript
"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function useMyOrders(page = 1, limit = 10) {
  const { data: res, error, isLoading, mutate } = useSWR(
    ["nestmarket-orders", page, limit],
    () => nestMarketsApi.myOrders(page, limit),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  return {
    orders: res?.data?.data ?? [],
    pagination: res?.data?.pagination ?? { total: 0, page: 1, limit, pages: 1 },
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add hooks/use-marketplace.ts hooks/use-cart.ts hooks/use-my-orders.ts
git commit -m "feat(nestmarkets): SWR hooks for browse, cart, orders"
```

---

## Task 8: Sidebar entry + cart badge

**Files:**
- Modify: `components/app-sidebar.tsx` (add "My Orders" to the NestMarket group)
- Create: `components/nestmarkets/cart-badge.tsx`

- [ ] **Step 1: Add the "My Orders" sidebar item**

In `components/app-sidebar.tsx`, find the NestMarket nav group (items: "Marketplace" `/marketplace`, "My Baskets" `/marketplace/baskets`, "Market Chat" `/marketplace/chat`). Add a new item after "My Baskets":

```tsx
        { title: "My Orders", url: "/marketplace/orders" },
```

- [ ] **Step 2: Create `components/nestmarkets/cart-badge.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link href="/marketplace/baskets" className={cn("relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors", className)} aria-label="Cart">
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add components/app-sidebar.tsx components/nestmarkets/cart-badge.tsx
git commit -m "feat(nestmarkets): sidebar My Orders entry + cart badge"
```

---

## Task 9: Browse page (search, filter, grid, card, quick-view)

**Files:**
- Create: `components/nestmarkets/search-bar.tsx`
- Create: `components/nestmarkets/category-filter.tsx`
- Create: `components/nestmarkets/product-card.tsx`
- Create: `components/nestmarkets/product-quick-view.tsx`
- Create: `components/nestmarkets/product-grid.tsx`
- Create: `app/marketplace/page.tsx`

> Visual reference: spec §7.2 "Browse". Use the page shell pattern from `app/nestpurse/page.tsx` (`SidebarProvider → AppSidebar → SidebarInset` with breadcrumb header). Put `<CartBadge />` in the header action area.

- [ ] **Step 1: `components/nestmarkets/search-bar.tsx`** (debounced input, pill style)

```tsx
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 350);
    return () => clearTimeout(t);
  }, [local, onChange]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search for groceries, snacks, and more..."
        className="pl-11 h-12 rounded-full bg-card border-border"
      />
    </div>
  );
}
```

- [ ] **Step 2: `components/nestmarkets/category-filter.tsx`** (scrolling pills, client-derived)

```tsx
"use client";

import { cn } from "@/lib/utils";

export function CategoryFilter({
  categories, active, onChange,
}: { categories: string[]; active: string; onChange: (c: string) => void }) {
  const all = ["", ...categories];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
      {all.map((c) => (
        <button
          key={c || "all"}
          onClick={() => onChange(c)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {c === "" ? "All" : c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `components/nestmarkets/product-card.tsx`** (gold price, floating store badge)

```tsx
"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductCard({ product, onClick }: { product: MarketProduct; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="text-left rounded-2xl bg-card border border-border overflow-hidden"
    >
      <div className="relative aspect-square bg-muted">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
        )}
        <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex gap-1 items-center text-[10px] font-medium">
          {product.store.logoUrl && (
            <Image src={product.store.logoUrl} alt="" width={14} height={14} className="rounded-full" />
          )}
          <span className="max-w-[80px] truncate">{product.store.name}</span>
          <Star className="size-3 fill-primary text-primary" />
          <span>{product.store.averageRating?.toFixed(1) ?? "—"}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
        <p className="text-base font-semibold text-primary">₦{product.price.toLocaleString()}</p>
      </div>
    </motion.button>
  );
}
```

- [ ] **Step 4: `components/nestmarkets/product-quick-view.tsx`** (Dialog: detail + qty + add)

Uses shadcn `Dialog`, the `useCart().add`, Sonner `toast`. Out-of-stock disables the button.

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductQuickView({
  product, open, onOpenChange,
}: { product: MarketProduct | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  if (!product) return null;
  const out = product.stockLevel <= 0;

  const handleAdd = async () => {
    setBusy(true);
    const r = await add(product.id, qty);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Added to cart");
    onOpenChange(false);
    setQty(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />}
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.store.logoUrl && <Image src={product.store.logoUrl} alt="" width={16} height={16} className="rounded-full" />}
            <span>{product.store.name}</span>
            <Star className="size-3 fill-primary text-primary" />
            <span>{product.store.averageRating?.toFixed(1) ?? "—"}</span>
          </div>
          <h2 className="text-lg font-semibold">{product.name}</h2>
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <p className="text-xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{out ? "Out of stock" : `${product.stockLevel} in stock`}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1"><Minus className="size-4" /></button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stockLevel, q + 1))} className="p-1"><Plus className="size-4" /></button>
            </div>
            <Button onClick={handleAdd} disabled={out || busy}>{out ? "Out of stock" : "Add to cart"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: `components/nestmarkets/product-grid.tsx`** (grid + skeletons + empty + pagination)

```tsx
"use client";

import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductGrid({
  products, isLoading, page, pages, onPage, onSelect,
}: {
  products: MarketProduct[]; isLoading: boolean; page: number; pages: number;
  onPage: (p: number) => void; onSelect: (p: MarketProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium">No products found</p>
        <p className="text-sm text-muted-foreground">Try a different search or category.</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} onClick={() => onSelect(p)} />)}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 6: `app/marketplace/page.tsx`** (compose, manage state)

Mirror the shell of `app/nestpurse/page.tsx` (SidebarProvider/AppSidebar/SidebarInset + breadcrumb). State: `search`, `category`, `page`, `selected` (for quick-view). Wire `useMarketplace`. Header shows breadcrumb "Marketplace" + `<CartBadge />`. Body: `<SearchBar>`, `<CategoryFilter>`, `<ProductGrid>`, `<ProductQuickView>`. Reset `page` to 1 when search/category changes.

```tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SearchBar } from "@/components/nestmarkets/search-bar";
import { CategoryFilter } from "@/components/nestmarkets/category-filter";
import { ProductGrid } from "@/components/nestmarkets/product-grid";
import { ProductQuickView } from "@/components/nestmarkets/product-quick-view";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { MarketProduct } from "@/types/nestmarkets";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MarketProduct | null>(null);
  const [open, setOpen] = useState(false);

  const { products, pagination, categories, isLoading } = useMarketplace(search, category, page);

  const onSearch = (v: string) => { setSearch(v); setPage(1); };
  const onCategory = (c: string) => { setCategory(c); setPage(1); };
  const onSelect = (p: MarketProduct) => { setSelected(p); setOpen(true); };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Marketplace</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 space-y-4">
          <SearchBar value={search} onChange={onSearch} />
          <CategoryFilter categories={categories} active={category} onChange={onCategory} />
          <ProductGrid
            products={products} isLoading={isLoading}
            page={pagination.page} pages={pagination.pages}
            onPage={setPage} onSelect={onSelect}
          />
        </div>
        <ProductQuickView product={selected} open={open} onOpenChange={setOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 7: Verify build + lint + manual**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all pass.
Manual: `npm run dev`, visit `/marketplace` → grid loads, search filters, category pills work, clicking a card opens quick-view, "Add to cart" increments the badge.

- [ ] **Step 8: Commit**

```bash
git add components/nestmarkets app/marketplace/page.tsx
git commit -m "feat(nestmarkets): browse page with search, filter, grid, quick-view"
```

---

## Task 10: Cart page (grouped by store)

**Files:**
- Create: `components/nestmarkets/cart-store-block.tsx`
- Create: `components/nestmarkets/cart-list.tsx`
- Create: `app/marketplace/baskets/page.tsx`

> Visual: spec §7.2 "Cart". The checkout button on each block opens the checkout sheet built in Task 11 — for this task, wire a placeholder `onCheckout(storeId)` prop; Task 11 supplies the sheet.

- [ ] **Step 1: `components/nestmarkets/cart-store-block.tsx`**

Renders one store group: store header, line items with qty stepper + remove (via `useCart().update/remove`), subtotal, and a "Checkout this store" button calling `onCheckout`.

```tsx
"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { CartItem, MarketStoreLite } from "@/types/nestmarkets";

export function CartStoreBlock({
  store, items, onCheckout,
}: { store: MarketStoreLite; items: CartItem[]; onCheckout: (storeId: string) => void }) {
  const { update, remove } = useCart();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        {store.logoUrl && <Image src={store.logoUrl} alt="" width={24} height={24} className="rounded-full" />}
        <span className="font-medium">{store.name}</span>
      </div>
      <div className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-4">
            <div className="relative size-14 rounded-lg overflow-hidden bg-muted shrink-0">
              {it.product.imageUrl && <Image src={it.product.imageUrl} alt="" fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{it.product.name}</p>
              <p className="text-sm text-primary font-semibold">₦{(it.product.price * it.quantity).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
              <button onClick={() => update(it.id, it.quantity - 1)} className="p-1"><Minus className="size-3.5" /></button>
              <span className="w-5 text-center text-sm">{it.quantity}</span>
              <button onClick={() => update(it.id, it.quantity + 1)} className="p-1"><Plus className="size-3.5" /></button>
            </div>
            <button onClick={() => remove(it.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between p-4 border-t border-border">
        <div className="text-sm text-muted-foreground">Subtotal <span className="font-semibold text-foreground">₦{subtotal.toLocaleString()}</span></div>
        <Button onClick={() => onCheckout(store.id)}>Checkout this store</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/nestmarkets/cart-list.tsx`** (maps store groups, empty state)

```tsx
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { CartStoreBlock } from "./cart-store-block";

export function CartList({ onCheckout }: { onCheckout: (storeId: string) => void }) {
  const { byStore, isLoading, count } = useCart();

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium">Your basket is empty</p>
        <Button asChild className="mt-4"><Link href="/marketplace">Browse products</Link></Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {Object.values(byStore).map((g) => (
        <CartStoreBlock key={g.store.id} store={g.store} items={g.items} onCheckout={onCheckout} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `app/marketplace/baskets/page.tsx`**

Same shell; breadcrumb "Marketplace / My Baskets" + `<CartBadge />`. Holds checkout-sheet state: `checkoutStoreId` + `open`. Renders `<CartList onCheckout={(id) => { setCheckoutStoreId(id); setOpen(true); }} />` and (after Task 11) `<CheckoutSheet storeId={checkoutStoreId} open={open} onOpenChange={setOpen} />`. For this task, render `CartList` with a no-op `onCheckout` placeholder and a `// TODO(Task 11): wire CheckoutSheet` comment.

```tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CartList } from "@/components/nestmarkets/cart-list";
import { CartBadge } from "@/components/nestmarkets/cart-badge";

export default function BasketsPage() {
  const [, setCheckoutStoreId] = useState<string | null>(null);
  const [, setOpen] = useState(false);

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
              <BreadcrumbItem><BreadcrumbPage>My Baskets</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
          {/* TODO(Task 11): wire CheckoutSheet using checkoutStoreId/open */}
          <CartList onCheckout={(id) => { setCheckoutStoreId(id); setOpen(true); }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 4: Verify + manual**

Run: `npm run typecheck && npm run lint && npm run build`
Manual: add items from two different stores in `/marketplace`, visit `/marketplace/baskets` → two store blocks, qty steppers + remove update live, subtotals correct, empty state shows when cleared.

- [ ] **Step 5: Commit**

```bash
git add components/nestmarkets app/marketplace/baskets/page.tsx
git commit -m "feat(nestmarkets): cart page grouped by store"
```

---

## Task 11: Checkout sheet

**Files:**
- Create: `components/nestmarkets/checkout-sheet.tsx`
- Modify: `app/marketplace/baskets/page.tsx` (wire the sheet)

> Visual: spec §7.2 "Checkout". Uses shadcn `Sheet`, delivery profiles from `nestBasketsApi.getDeliveryProfiles()`, fee from `nestBasketsApi.calculateDeliveryFee()` OR (simpler, matches backend flat fee) the selected profile's `deliveryZone.baseFee`. Use the zone `baseFee` directly from the profile to avoid an extra call, since the backend charges exactly that.

- [ ] **Step 1: Create `components/nestmarkets/checkout-sheet.tsx`**

Props: `storeId: string | null`, `open`, `onOpenChange`. Reads `useCart()` to get that store's items; loads delivery profiles via SWR; computes `items subtotal`, `deliveryFee = selectedProfile.deliveryZone?.baseFee ?? 0`, `total`. Collects 4-digit PIN. On pay: call `nestMarketsApi.checkout({ items, pin, deliveryProfileId })`; handle `shortfall` (show `text-destructive` + link to top-up via `AddMoneyDialog`), wrong PIN (toast, stay), success (clear store from cart, revalidate orders, toast, route to `/marketplace/orders`).

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { nestBasketsApi } from "@/lib/nestbaskets-api";
import { mutate as globalMutate } from "swr";

export function CheckoutSheet({
  storeId, open, onOpenChange,
}: { storeId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { byStore, clearStoreLocal } = useCartHelpers();
  const group = storeId ? byStore[storeId] : null;
  const { data: profilesRes } = useSWR("delivery-profiles", () => nestBasketsApi.getDeliveryProfiles());
  const profiles = profilesRes?.data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shortfall, setShortfall] = useState<number | null>(null);

  const selected = profiles.find((p) => p.id === selectedId) ?? profilesRes?.data?.default ?? null;
  const subtotal = useMemo(() => (group?.items ?? []).reduce((s, i) => s + i.product.price * i.quantity, 0), [group]);
  const deliveryFee = selected?.deliveryZone?.baseFee ?? 0;
  const total = subtotal + deliveryFee;

  const pay = async () => {
    if (!group || !selected) return toast.error("Select a delivery address");
    if (pin.length !== 4) return toast.error("Enter your 4-digit PIN");
    setBusy(true);
    setShortfall(null);
    const r = await nestMarketsApi.checkout({
      items: group.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      pin,
      deliveryProfileId: selected.id,
    });
    setBusy(false);
    if (r.error || !r.data?.success) {
      if (typeof r.data?.shortfall === "number") setShortfall(r.data.shortfall);
      return toast.error(r.data?.message || r.error || "Checkout failed");
    }
    await nestMarketsApi.clearStoreFromCart(group.store.id);
    globalMutate("nestmarket-cart");
    globalMutate((key) => Array.isArray(key) && key[0] === "nestmarket-orders");
    toast.success("Order placed");
    onOpenChange(false);
    router.push("/marketplace/orders");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>Checkout {group ? `· ${group.store.name}` : ""}</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Deliver to</p>
            {profiles.length === 0 && <p className="text-sm text-muted-foreground">No saved address. Add one in Settings → Delivery.</p>}
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded-xl border p-3 text-sm ${selected?.id === p.id ? "border-primary" : "border-border"}`}
              >
                <p className="font-medium">{p.fullName}</p>
                <p className="text-muted-foreground">{p.address}, {p.city}, {p.state}</p>
                <p className="text-xs text-muted-foreground">{p.deliveryZone?.name ?? "No zone"}</p>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>₦{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span className="text-primary">₦{total.toLocaleString()}</span></div>
          </div>
          {shortfall !== null && (
            <p className="text-sm text-destructive">
              Insufficient balance — you need ₦{shortfall.toLocaleString()} more. Top up your NestPurse and try again.
            </p>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">Transaction PIN</p>
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="tracking-[0.5em] text-center" />
          </div>
        </div>
        <Button onClick={pay} disabled={busy || !group} className="w-full">Pay ₦{total.toLocaleString()}</Button>
      </SheetContent>
    </Sheet>
  );
}

// Small helper so the sheet can read grouped cart without re-implementing grouping
function useCartHelpers() {
  const { byStore } = useCart();
  return { byStore, clearStoreLocal: () => {} };
}
```

> Note: confirm `DeliveryProfile` includes `deliveryZone` with `baseFee` in `getDeliveryProfiles()` response. Per `lib/nestbaskets-api.ts` + `types/nestbaskets.ts`, `DeliveryProfile.deliveryZone` exists. If the list endpoint doesn't embed the zone, fall back to `nestBasketsApi.calculateDeliveryFee({ deliveryZoneId, items: [] })` to fetch the flat fee. Verify during Step 3.

- [ ] **Step 2: Wire the sheet into the baskets page**

In `app/marketplace/baskets/page.tsx`, restore the real state and render the sheet:

```tsx
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
```
Add below `<CartList .../>`:
```tsx
          <CheckoutSheet storeId={checkoutStoreId} open={open} onOpenChange={setOpen} />
```
And import `CheckoutSheet`. Remove the Task-10 TODO comment.

- [ ] **Step 3: Verify + manual**

Run: `npm run typecheck && npm run lint && npm run build`
Manual: with a funded test wallet + a saved delivery address, check out a store → see items + delivery + total, enter PIN, pay → toast + redirect to orders; backend order shows correct `deliveryFee`. Test insufficient-balance (shows shortfall) and wrong PIN (toast, stays open).

- [ ] **Step 4: Commit**

```bash
git add components/nestmarkets/checkout-sheet.tsx app/marketplace/baskets/page.tsx
git commit -m "feat(nestmarkets): checkout sheet with delivery fee + PIN"
```

---

## Task 12: Orders + tracking

**Files:**
- Create: `components/nestmarkets/order-tracking.tsx`
- Create: `components/nestmarkets/order-card.tsx`
- Create: `app/marketplace/orders/page.tsx`

> Visual: spec §7.2 "Orders + tracking".

- [ ] **Step 1: `components/nestmarkets/order-tracking.tsx`** (read-only stepper)

```tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackingStatus } from "@/types/nestmarkets";

const STAGES: { key: TrackingStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "packaged", label: "Packaged" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTracking({ status }: { status: TrackingStatus }) {
  const idx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STAGES.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn("size-7 rounded-full flex items-center justify-center text-xs", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={cn("mt-1 text-[10px]", done ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className={cn("h-0.5 flex-1 mx-1", i < idx ? "bg-primary" : "bg-muted")} />}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `components/nestmarkets/order-card.tsx`** (summary + accept/reject)

Shows store, item summary, totals (incl. delivery), status, tracking stepper. When `status === "delivered"`: Accept button (`nestMarketsApi.acceptOrder`) + Reject (opens a reason textarea, requires ≥5 chars, `nestMarketsApi.rejectOrder`). Calls `onChanged()` after success to revalidate.

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { OrderTracking } from "./order-tracking";
import type { MarketOrder } from "@/types/nestmarkets";

export function OrderCard({ order, onChanged }: { order: MarketOrder; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const delivered = order.status === "delivered";

  const accept = async () => {
    setBusy(true);
    const r = await nestMarketsApi.acceptOrder(order.id);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Delivery accepted");
    onChanged();
  };
  const reject = async () => {
    if (reason.trim().length < 5) return toast.error("Please give a reason (min 5 characters)");
    setBusy(true);
    const r = await nestMarketsApi.rejectOrder(order.id, reason.trim());
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success("Order rejected — an admin will review");
    setRejecting(false);
    onChanged();
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        {order.store.logoUrl && <Image src={order.store.logoUrl} alt="" width={24} height={24} className="rounded-full" />}
        <span className="font-medium">{order.store.name}</span>
        <span className="ml-auto text-xs rounded-full bg-muted px-2 py-1 capitalize">{order.status}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {order.items.map((it) => (
          <div key={it.id} className="relative size-12 rounded-lg overflow-hidden bg-muted shrink-0">
            {it.product?.imageUrl && <Image src={it.product.imageUrl} alt="" fill className="object-cover" />}
          </div>
        ))}
      </div>
      <OrderTracking status={order.trackingStatus} />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total (incl. ₦{order.deliveryFee.toLocaleString()} delivery)</span>
        <span className="font-semibold text-primary">₦{(order.totalAmount + order.deliveryFee).toLocaleString()}</span>
      </div>
      {order.status === "rejected" && order.rejectionReason && (
        <p className="text-xs text-destructive">Rejected: {order.rejectionReason}</p>
      )}
      {delivered && !rejecting && (
        <div className="flex gap-2">
          <Button onClick={accept} disabled={busy} className="flex-1">Accept delivery</Button>
          <Button onClick={() => setRejecting(true)} disabled={busy} variant="outline" className="flex-1">Reject</Button>
        </div>
      )}
      {delivered && rejecting && (
        <div className="space-y-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong? (min 5 characters)" />
          <div className="flex gap-2">
            <Button onClick={reject} disabled={busy} variant="destructive" className="flex-1">Submit rejection</Button>
            <Button onClick={() => setRejecting(false)} variant="ghost" className="flex-1">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

> If `components/ui/textarea` does not exist, add it via the project's shadcn setup (`npx shadcn@latest add textarea`) as a sub-step.

- [ ] **Step 3: `app/marketplace/orders/page.tsx`**

Same shell; breadcrumb "Marketplace / My Orders" + `<CartBadge />`. Use `useMyOrders(page)`; render list of `<OrderCard order onChanged={mutate} />`, page-based pagination control (reuse the pattern from `product-grid`), skeletons while loading, and an empty state ("No orders yet" + link to browse).

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCard } from "@/components/nestmarkets/order-card";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useMyOrders } from "@/hooks/use-my-orders";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { orders, pagination, isLoading, mutate } = useMyOrders(page);

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
              <BreadcrumbItem><BreadcrumbPage>My Orders</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">No orders yet</p>
              <Button asChild className="mt-4"><Link href="/marketplace">Start shopping</Link></Button>
            </div>
          ) : (
            <>
              {orders.map((o) => <OrderCard key={o.id} order={o} onChanged={mutate} />)}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
                  <Button variant="outline" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 4: Verify + manual**

Run: `npm run typecheck && npm run lint && npm run build`
Manual: place an order, then (as the seller, or by updating tracking in the DB/seller tool) move it to `delivered` → Accept releases payout; Reject requires a reason ≥5 chars and shows the dispute message.

- [ ] **Step 5: Commit**

```bash
git add components/nestmarkets app/marketplace/orders/page.tsx
git commit -m "feat(nestmarkets): orders page with tracking, accept, reject"
```

---

## Task 13: Final wiring + cross-screen QA

**Files:**
- Modify: as needed for fixes found during QA

- [ ] **Step 1: Post-checkout balance freshness**

Confirm the NestPurse balance reflects the debit after checkout. Find the purse balance SWR key (in `hooks/use-profile.ts` or the purse page) and add a `globalMutate(<thatKey>)` call inside `CheckoutSheet.pay` success branch (alongside the cart/orders mutations). If the purse page reads on mount it may already be fresh; verify and only add if stale.

- [ ] **Step 2: Full happy-path walkthrough**

Run `npm run dev`. Browse → quick-view → add 2 items from store A + 1 from store B → badge shows 3 → baskets shows 2 blocks → checkout store A (PIN, fee, pay) → redirect to orders → store A order present, badge now 1, baskets shows only store B.

- [ ] **Step 3: Dark mode + responsive pass**

Toggle dark mode and check all four screens use brand tokens (gold accents, warm surfaces — no stray emerald/slate). Resize to ~375px: grid is 2-up, checkout sheet usable, cart blocks stack.

- [ ] **Step 4: Lint/build green**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit + push**

```bash
git add -A
git commit -m "chore(nestmarkets): final wiring and QA fixes"
git push -u origin feat/nestmarkets-buyer-portal
```

---

## Self-review notes (coverage map)

- Spec §4.1 cart endpoints → Tasks 1–2. §4.2 delivery fee → Task 3. §4.3 browse pagination → Task 4.
- Spec §5.1 file map → Tasks 5–12 (every listed file has a task). §5.2 SWR caching → Task 7 + checkout/orders mutations (Tasks 11–13). §5.3 data flow → Tasks 9–12. §5.4 error handling → quick-view/checkout/order-card (Tasks 9, 11, 12).
- Spec §7 visual/tokens → applied across Tasks 8–12 (semantic tokens only).
- Spec §3 red-flag (seller payout) → code comment added in Task 3 Step 4.
- Spec §8 open items → router prefix verified (`/api/nestmarkets`); purse SWR key handled in Task 13 Step 1.
