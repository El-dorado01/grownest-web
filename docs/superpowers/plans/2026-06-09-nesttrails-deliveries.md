# NestTrails My Deliveries + Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user delivery-tracking experience — `/deliveries` (Today/Upcoming/Past + status stepper + detail drawer) and a public `/track/[code]` page — against existing `/api/nesttrails` endpoints.

**Architecture:** Frontend-only, no new deps. `types → lib/nesttrails-api → SWR hooks → components/nesttrails → app routes`. Reuses the shared `PageHeader`, gold theme tokens, framer-motion, shadcn `Sheet`/`Tabs`. The detail drawer reuses the delivery object already in the list (no per-id endpoint). The public page is a standalone no-sidebar layout.

**Tech Stack:** Next.js 15 App Router, Tailwind v4, shadcn/ui, SWR, framer-motion, Sonner, Lucide.

**Verification model:** No automated test runner. Each task verified by **typecheck**; final task `lint` + `build`. Commit grouping: build everything, then a **single commit** at the end (user preference for this feature). All on **`main`** (no branch).

**Reference spec:** `docs/superpowers/specs/2026-06-09-nesttrails-deliveries-design.md`

**Key facts (verified against code):**
- Endpoints (mounted `/api/nesttrails`):
  - `GET /deliveries` (auth) → `{ success, data: { today: D[], upcoming: D[], past: D[], summary: { total, today, upcoming, past } } }`.
    `D = { id, title, deliveryDate, status, trackingCode, riderName, riderPhone, items: [{ name, imageUrl, quantity }], isRecurring }`.
  - `GET /delivery/:trackingCode` (**public, no auth**) → `{ success, data: { trackingCode, status, deliveryDate, title, address, items: [{ foodItem: {...}, quantity, ... }] } }`; 404 `{ success:false, message }`.
  - Status values: `scheduled | dispatched | in_transit | delivered | failed`.
- FE API client: `import { api } from "./api"` (in `lib/*-api.ts`); `api.get/post/patch/delete<T>(endpoint, body?)` → `{ data, error, status }`.
- SWR convention `{ revalidateOnFocus:true, revalidateIfStale:true, dedupingInterval:2000 }`.
- Reuse: `components/nestmarkets/page-header.tsx` exports `PageHeader({ title, subtitle, action? })`. shadcn present: `sheet`, `tabs`, `card`, `badge`, `button`, `skeleton`, `tooltip`. Deps: `framer-motion`, `sonner`, `lucide-react`. `cn` from `@/lib/utils`.
- Sidebar `components/app-sidebar.tsx` `data.projects` has `{ name: "My Deliveries", url: "/deliveries", icon: <TruckIcon /> }` — already points to `/deliveries` (route doesn't exist yet → this plan creates it).
- Page shell pattern (sidebar pages): copy `app/marketplace/orders/page.tsx` (SidebarProvider → AppSidebar → SidebarInset → header with SidebarTrigger + Separator + Breadcrumb, then `PageHeader` in the body).
- Dev mock: `lib/dev-mock.ts` `mockFetch(endpoint, method, body)` router, gated `NEXT_PUBLIC_MOCK=1` (currently the hooks in `lib/api.ts` are commented out; user toggles).
- Token rules: gold `bg-primary`/`text-primary`/`text-primary-foreground`; surfaces `bg-card`/`bg-background`; muted `bg-muted`/`text-muted-foreground`; borders `border-border`; failed `text-destructive`/`bg-destructive/10`. `<img>` only. NO emerald/slate/amber-N/stone-N/gray-N/hex.
- Frontend repo `c:\Users\ambal\Desktop\Gigs\grownest-web`, branch **main**.

---

## Task 1: Types

**Files:**
- Create: `types/nesttrails.ts`

- [ ] **Step 1: Create `types/nesttrails.ts`**

```typescript
// types/nesttrails.ts

export type DeliveryStatus =
  | "scheduled"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "failed";

export interface DeliveryItem {
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface Delivery {
  id: string;
  title: string;
  deliveryDate: string;
  status: DeliveryStatus;
  trackingCode: string;
  riderName: string | null;
  riderPhone: string | null;
  items: DeliveryItem[];
  isRecurring: boolean;
}

export interface DeliveriesSummary {
  total: number;
  today: number;
  upcoming: number;
  past: number;
}

export interface MyDeliveriesResponse {
  success: boolean;
  data: {
    today: Delivery[];
    upcoming: Delivery[];
    past: Delivery[];
    summary: DeliveriesSummary;
  };
}

export interface PublicTrackingItem {
  foodItem: { name: string; imageUrl?: string | null };
  quantity: number;
}

export interface PublicTracking {
  trackingCode: string;
  status: DeliveryStatus;
  deliveryDate: string;
  title: string;
  address: Record<string, unknown> | null;
  items: PublicTrackingItem[];
}

export interface PublicTrackingResponse {
  success: boolean;
  data: PublicTracking;
  message?: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 2: API service

**Files:**
- Create: `lib/nesttrails-api.ts`

- [ ] **Step 1: Create `lib/nesttrails-api.ts`**

```typescript
import { api } from "./api";
import type { MyDeliveriesResponse, PublicTrackingResponse } from "@/types/nesttrails";

export const nestTrailsApi = {
  getMyDeliveries: () =>
    api.get<MyDeliveriesResponse>("/api/nesttrails/deliveries"),

  trackDelivery: (trackingCode: string) =>
    api.get<PublicTrackingResponse>(`/api/nesttrails/delivery/${trackingCode}`),
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 3: Hooks

**Files:**
- Create: `hooks/use-my-deliveries.ts`
- Create: `hooks/use-tracking.ts`

- [ ] **Step 1: Create `hooks/use-my-deliveries.ts`**

```typescript
"use client";

import useSWR from "swr";
import { nestTrailsApi } from "@/lib/nesttrails-api";

export function useMyDeliveries() {
  const { data: res, error, isLoading, mutate } = useSWR(
    "nesttrails-deliveries",
    () => nestTrailsApi.getMyDeliveries(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const data = res?.data?.data;
  return {
    today: data?.today ?? [],
    upcoming: data?.upcoming ?? [],
    past: data?.past ?? [],
    summary: data?.summary ?? { total: 0, today: 0, upcoming: 0, past: 0 },
    isLoading,
    error: !!(error || res?.error),
    mutate,
  };
}
```

- [ ] **Step 2: Create `hooks/use-tracking.ts`** (404 = not found, not an error)

```typescript
"use client";

import useSWR from "swr";
import { nestTrailsApi } from "@/lib/nesttrails-api";

export function useTracking(code: string | null) {
  const { data: res, error, isLoading } = useSWR(
    code ? ["nesttrails-track", code] : null,
    () => nestTrailsApi.trackDelivery(code!),
    { revalidateOnFocus: false, dedupingInterval: 2000, shouldRetryOnError: false }
  );

  const notFound = res?.status === 404;
  const tracking = res?.data?.data ?? null;
  return {
    tracking,
    notFound,
    isLoading,
    error: !!(error && !notFound) || (!!res?.error && !notFound),
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 4: Status steppers (horizontal + vertical)

**Files:**
- Create: `components/nesttrails/delivery-status-stepper.tsx`
- Create: `components/nesttrails/delivery-vertical-timeline.tsx`

- [ ] **Step 1: `components/nesttrails/delivery-status-stepper.tsx`** (horizontal, handles failed)

```tsx
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/types/nesttrails";

const FLOW: { key: DeliveryStatus; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "dispatched", label: "Dispatched" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
];

export function DeliveryStatusStepper({ status }: { status: DeliveryStatus }) {
  const failed = status === "failed";
  // For failed, treat progress as up to dispatched (rider was assigned) then a failed node.
  const idx = failed ? 1 : FLOW.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start">
      {FLOW.map((s, i) => {
        const done = i <= idx;
        const active = !failed && i === idx;
        const isLast = i === FLOW.length - 1;
        // When failed, render the node AFTER the failed point as a destructive X on the next node.
        const failHere = failed && i === idx + 1;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1 rounded-full", i === 0 ? "bg-transparent" : i <= idx ? "bg-primary" : failHere ? "bg-destructive" : "bg-border")} />
              <div className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                failHere ? "bg-destructive text-destructive-foreground" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border",
                active && "animate-pulse"
              )}>
                {failHere ? <X className="size-3.5" /> : done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <div className={cn("h-0.5 flex-1 rounded-full", isLast ? "bg-transparent" : i < idx ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("mt-1.5 text-[10px] leading-tight", failHere ? "text-destructive font-medium" : active ? "text-primary font-medium" : done ? "text-foreground" : "text-muted-foreground")}>
              {failHere ? "Failed" : s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `components/nesttrails/delivery-vertical-timeline.tsx`** (drawer variant)

```tsx
import { Check, X, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/types/nesttrails";

const FLOW: { key: DeliveryStatus; label: string; desc: string }[] = [
  { key: "scheduled", label: "Scheduled", desc: "Order confirmed." },
  { key: "dispatched", label: "Dispatched", desc: "Picked up from vendor." },
  { key: "in_transit", label: "In transit", desc: "Rider is heading to your address." },
  { key: "delivered", label: "Delivered", desc: "Order delivered. Enjoy!" },
];

export function DeliveryVerticalTimeline({ status }: { status: DeliveryStatus }) {
  const failed = status === "failed";
  const idx = failed ? 1 : FLOW.findIndex((s) => s.key === status);
  // Show most-recent first (reverse) like the design.
  const steps = FLOW.map((s, i) => ({ ...s, i }));
  if (failed) steps.splice(idx + 1, 0, { key: "failed", label: "Failed", desc: "Delivery could not be completed.", i: idx + 1 } as any);
  const ordered = [...steps].reverse();

  return (
    <div className="space-y-0">
      {ordered.map((s, ri) => {
        const isFailNode = (s as any).key === "failed";
        const done = !isFailNode && s.i <= idx;
        const active = !failed && s.i === idx;
        const isLastRow = ri === ordered.length - 1;
        return (
          <div key={`${s.key}-${s.i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                isFailNode ? "bg-destructive text-destructive-foreground" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border",
                active && "ring-4 ring-primary/20"
              )}>
                {isFailNode ? <X className="size-3.5" /> : active ? <Truck className="size-3.5" /> : done ? <Check className="size-3.5" /> : s.i + 1}
              </div>
              {!isLastRow && <div className={cn("w-0.5 flex-1 min-h-6", done ? "bg-primary" : "bg-border")} />}
            </div>
            <div className="pb-5">
              <p className={cn("text-sm font-medium", isFailNode ? "text-destructive" : active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 5: Delivery card + detail drawer

**Files:**
- Create: `components/nesttrails/delivery-card.tsx`
- Create: `components/nesttrails/delivery-detail-drawer.tsx`

- [ ] **Step 1: `components/nesttrails/delivery-card.tsx`**

```tsx
"use client";

import { Repeat, Copy, Phone, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeliveryStatusStepper } from "./delivery-status-stepper";
import type { Delivery } from "@/types/nesttrails";

function statusPill(status: Delivery["status"]) {
  if (status === "delivered") return "bg-primary/10 text-primary";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) +
    " • " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function DeliveryCard({ delivery, onTrack }: { delivery: Delivery; onTrack: (d: Delivery) => void }) {
  const copyCode = async () => {
    await navigator.clipboard.writeText(delivery.trackingCode);
    toast.success("Tracking code copied");
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {delivery.isRecurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 mb-1">
              <Repeat className="size-3" /> Recurring
            </span>
          )}
          <p className="font-semibold truncate">{delivery.title}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(delivery.deliveryDate)}</p>
        </div>
        <span className={cn("shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5 capitalize", statusPill(delivery.status))}>
          {delivery.status.replace("_", " ")}
        </span>
      </div>

      <button onClick={copyCode} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
        Tracking: <span className="font-medium text-foreground">{delivery.trackingCode}</span> <Copy className="size-3" />
      </button>

      <DeliveryStatusStepper status={delivery.status} />

      {delivery.riderName && (
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
          <div className="text-xs">
            <span className="text-muted-foreground">Rider: </span>
            <span className="font-medium">{delivery.riderName}</span>
            {delivery.riderPhone && <span className="text-muted-foreground"> • {delivery.riderPhone}</span>}
          </div>
          {delivery.riderPhone && (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${delivery.riderPhone}`}><Phone className="size-3.5" /> Call</a>
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {delivery.items.slice(0, 4).map((it, i) => (
            <div key={i} className="relative size-9 rounded-lg ring-2 ring-card overflow-hidden bg-muted">
              {it.imageUrl && <img src={it.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <span className="absolute bottom-0 right-0 bg-foreground/80 text-background text-[8px] px-1 rounded-tl">x{it.quantity}</span>
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => onTrack(delivery)}>
          {delivery.status === "failed" ? "View details" : "Track delivery"} <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/nesttrails/delivery-detail-drawer.tsx`**

```tsx
"use client";

import { Copy, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DeliveryVerticalTimeline } from "./delivery-vertical-timeline";
import type { Delivery } from "@/types/nesttrails";

export function DeliveryDetailDrawer({
  delivery, open, onOpenChange,
}: { delivery: Delivery | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!delivery) return null;

  const trackUrl = typeof window !== "undefined" ? `${window.location.origin}/track/${delivery.trackingCode}` : `/track/${delivery.trackingCode}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(delivery.trackingCode);
    toast.success("Tracking code copied");
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Track my delivery", url: trackUrl });
      else { await navigator.clipboard.writeText(trackUrl); toast.success("Tracking link copied"); }
    } catch { /* user cancelled */ }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>Delivery details</SheetTitle></SheetHeader>
        <div className="px-4 pb-6 pt-2 space-y-5">
          <button onClick={copyCode} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            Tracking: <span className="font-medium text-foreground">{delivery.trackingCode}</span> <Copy className="size-3" />
          </button>

          <DeliveryVerticalTimeline status={delivery.status} />

          {delivery.riderName && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <div className="text-sm">
                <p className="font-medium">{delivery.riderName}</p>
                {delivery.riderPhone && <p className="text-xs text-muted-foreground">{delivery.riderPhone}</p>}
              </div>
              {delivery.riderPhone && (
                <Button asChild size="sm" variant="outline"><a href={`tel:${delivery.riderPhone}`}><Phone className="size-3.5" /> Call</a></Button>
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Items ({delivery.items.length})</p>
            <div className="space-y-2">
              {delivery.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative size-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {it.imageUrl && <img src={it.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  </div>
                  <span className="text-sm flex-1 line-clamp-1">{it.name}</span>
                  <span className="text-sm text-muted-foreground">x{it.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={share} variant="outline" className="w-full"><Share2 className="size-4" /> Share tracking link</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 6: Summary strip + delivery group

**Files:**
- Create: `components/nesttrails/summary-strip.tsx`
- Create: `components/nesttrails/delivery-group.tsx`

- [ ] **Step 1: `components/nesttrails/summary-strip.tsx`**

```tsx
import { CalendarDays, Clock, PackageCheck } from "lucide-react";
import type { DeliveriesSummary } from "@/types/nesttrails";

export function SummaryStrip({ summary }: { summary: DeliveriesSummary }) {
  const cards = [
    { icon: <CalendarDays className="size-4" />, label: "Today", value: summary.today },
    { icon: <Clock className="size-4" />, label: "Upcoming", value: summary.upcoming },
    { icon: <PackageCheck className="size-4" />, label: "Past", value: summary.past },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-primary/10 text-primary px-3 py-2 flex items-center gap-2">
          {c.icon}
          <div className="leading-tight">
            <p className="text-lg font-semibold">{c.value}</p>
            <p className="text-[11px] text-primary/80">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `components/nesttrails/delivery-group.tsx`** (list + skeleton + empty)

```tsx
"use client";

import { motion } from "framer-motion";
import { PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryCard } from "./delivery-card";
import type { Delivery } from "@/types/nesttrails";

export function DeliveryGroup({
  deliveries, isLoading, emptyText, onTrack,
}: { deliveries: Delivery[]; isLoading: boolean; emptyText: string; onTrack: (d: Delivery) => void }) {
  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}</div>;
  }
  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageX className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {deliveries.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.04 }}>
          <DeliveryCard delivery={d} onTrack={onTrack} />
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 7: My Deliveries page

**Files:**
- Create: `app/deliveries/page.tsx`

- [ ] **Step 1: Create `app/deliveries/page.tsx`** (copy shell from `app/marketplace/orders/page.tsx`)

```tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/nestmarkets/page-header";
import { SummaryStrip } from "@/components/nesttrails/summary-strip";
import { DeliveryGroup } from "@/components/nesttrails/delivery-group";
import { DeliveryDetailDrawer } from "@/components/nesttrails/delivery-detail-drawer";
import { useMyDeliveries } from "@/hooks/use-my-deliveries";
import type { Delivery } from "@/types/nesttrails";

export default function DeliveriesPage() {
  const { today, upcoming, past, summary, isLoading } = useMyDeliveries();
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [open, setOpen] = useState(false);
  const track = (d: Delivery) => { setSelected(d); setOpen(true); };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList><BreadcrumbItem><BreadcrumbPage>My Deliveries</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
          <PageHeader title="My Deliveries" subtitle="Track your meal plans and food orders in real-time." />
          <SummaryStrip summary={summary} />

          <Tabs defaultValue="today" className="flex-col!">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="today">Today ({summary.today})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({summary.upcoming})</TabsTrigger>
              <TabsTrigger value="past">Past ({summary.past})</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="pt-5">
              <DeliveryGroup deliveries={today} isLoading={isLoading} emptyText="No deliveries scheduled for today." onTrack={track} />
            </TabsContent>
            <TabsContent value="upcoming" className="pt-5">
              <DeliveryGroup deliveries={upcoming} isLoading={isLoading} emptyText="No upcoming deliveries." onTrack={track} />
            </TabsContent>
            <TabsContent value="past" className="pt-5">
              <DeliveryGroup deliveries={past} isLoading={isLoading} emptyText="No past deliveries yet." onTrack={track} />
            </TabsContent>
          </Tabs>
        </div>

        <DeliveryDetailDrawer delivery={selected} open={open} onOpenChange={setOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 8: Public tracking page + layout

**Files:**
- Create: `components/nesttrails/public-tracking-view.tsx`
- Create: `app/track/layout.tsx`
- Create: `app/track/[code]/page.tsx`

- [ ] **Step 1: `components/nesttrails/public-tracking-view.tsx`**

```tsx
"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryVerticalTimeline } from "./delivery-vertical-timeline";
import type { PublicTracking } from "@/types/nesttrails";

function areaLabel(address: Record<string, unknown> | null): string {
  if (!address || typeof address !== "object") return "—";
  const city = (address.city as string) || "";
  const state = (address.state as string) || "";
  return [city, state].filter(Boolean).join(", ") || "—";
}

export function PublicTrackingView({
  tracking, isLoading, notFound, code,
}: { tracking: PublicTracking | null; isLoading: boolean; notFound: boolean; code: string }) {
  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>;
  }
  if (notFound || !tracking) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageSearch className="size-10 text-muted-foreground mb-3" />
        <h2 className="font-semibold">Tracking code not found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">We couldn&apos;t find an order with the code {code}. Please check the link and try again.</p>
        <Button asChild><Link href="/">Return to GrowNest Home</Link></Button>
      </div>
    );
  }

  const date = new Date(tracking.deliveryDate);
  const dateLabel = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">Status</p>
        <p className="text-lg font-semibold capitalize text-primary mb-4">{tracking.status.replace("_", " ")}</p>
        <DeliveryVerticalTimeline status={tracking.status} />
      </div>
      <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-2 text-sm">
        <p><span className="text-muted-foreground">Order:</span> <span className="font-medium">{tracking.title}</span></p>
        <p><span className="text-muted-foreground">Destination:</span> {areaLabel(tracking.address)}</p>
        {dateLabel && <p><span className="text-muted-foreground">Date:</span> {dateLabel}</p>}
        <div className="pt-2">
          <p className="text-muted-foreground mb-2">Items</p>
          <div className="space-y-2">
            {tracking.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative size-9 rounded-lg overflow-hidden bg-muted shrink-0">
                  {it.foodItem.imageUrl && <img src={it.foodItem.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                </div>
                <span className="flex-1 line-clamp-1">{it.foodItem.name}</span>
                <span className="text-muted-foreground">x{it.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/track/layout.tsx`** (standalone, no sidebar)

```tsx
import type { ReactNode } from "react";
import Image from "next/image";

export default function TrackLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 px-4 h-16">
          <Image src="/d_icon.png" alt="GrowNest" width={28} height={28} className="rounded-lg size-7" />
          <span className="font-semibold">GrowNest</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">{children}</main>
      <footer className="text-center text-xs text-muted-foreground pb-8">Powered by NestTrails · GrowNest</footer>
    </div>
  );
}
```

> Note: confirm `/d_icon.png` exists in `public/` (it's used by `app-sidebar.tsx`). If not, replace with a text logo.

- [ ] **Step 3: `app/track/[code]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { PublicTrackingView } from "@/components/nesttrails/public-tracking-view";
import { useTracking } from "@/hooks/use-tracking";

export default function PublicTrackPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const { tracking, isLoading, notFound } = useTracking(code ?? null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Track your delivery</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time updates for tracking #{code}</p>
      </div>
      <PublicTrackingView tracking={tracking} isLoading={isLoading} notFound={notFound} code={code} />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 9: Mock fixtures

**Files:**
- Modify: `lib/dev-mock.ts`

- [ ] **Step 1: Add NestTrails fixtures + routes**

In `lib/dev-mock.ts`, add delivery fixtures near the other data (reuse the `img` helper):

```typescript
// ---- NestTrails deliveries (user tracking) --------------------------
const ntItems = (n: string, seed: string, q: number) => ({ name: n, imageUrl: img(seed), quantity: q });
const ntDeliveries = {
  today: [
    { id: "d-1", title: "Family Weekend Plan", deliveryDate: new Date().toISOString(), status: "in_transit", trackingCode: "GN-8842", riderName: "Chuka Obi", riderPhone: "08012345678", isRecurring: true, items: [ntItems("Smoky Jollof", "jollof", 2), ntItems("Grilled Turkey", "turkey", 1)] },
    { id: "d-2", title: "Office Lunch Combo", deliveryDate: new Date().toISOString(), status: "failed", trackingCode: "GN-8843", riderName: "Amina Bello", riderPhone: "08087654321", isRecurring: false, items: [ntItems("Pounded Yam & Egusi", "egusi", 1)] },
  ],
  upcoming: [
    { id: "d-3", title: "Weekly Veggie Box", deliveryDate: new Date(Date.now() + 2 * 864e5).toISOString(), status: "scheduled", trackingCode: "GN-8850", riderName: null, riderPhone: null, isRecurring: true, items: [ntItems("Tomato Basket", "tomato", 1), ntItems("Pepper Mix", "spice", 2)] },
  ],
  past: [
    { id: "d-4", title: "Sunday Rice Bowl", deliveryDate: new Date(Date.now() - 3 * 864e5).toISOString(), status: "delivered", trackingCode: "GN-8800", riderName: "Tunde A.", riderPhone: "08011112222", isRecurring: false, items: [ntItems("Ofada Rice", "ofada", 1)] },
  ],
};
const ntSummary = { total: 4, today: 2, upcoming: 1, past: 1 };
const ntByCode: Record<string, any> = {
  "GN-8842": { trackingCode: "GN-8842", status: "in_transit", deliveryDate: new Date().toISOString(), title: "Family Weekend Plan", address: { city: "Ikoyi", state: "Lagos" }, items: [{ foodItem: { name: "Smoky Jollof", imageUrl: img("jollof") }, quantity: 2 }, { foodItem: { name: "Grilled Turkey", imageUrl: img("turkey") }, quantity: 1 }] },
};
```

Then in `mockFetch`, add these route handlers (place with the other `/nesttrails` handlers):

```typescript
  if (path.endsWith("/nesttrails/deliveries") && m === "GET") {
    return ok({ success: true, data: { ...ntDeliveries, summary: ntSummary } });
  }
  if (path.includes("/nesttrails/delivery/")) {
    const code = path.split("/nesttrails/delivery/")[1];
    const t = ntByCode[code];
    return t ? ok({ success: true, data: t }) : fail(404, "Delivery not found");
  }
```

> `ok` and `fail` helpers already exist in the mock. Ensure the `/nesttrails/delivery/` matcher sits BEFORE any broader `/nesttrails` catch-alls (there are none currently, but keep it above the zones/profiles handlers to be safe — order by specificity).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

---

## Task 10: Verify + single commit

- [ ] **Step 1: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint only intentional `<img>` warnings in new files; build lists `/deliveries` and `/track/[code]`.

- [ ] **Step 2: Token scan**

Run:
```bash
grep -rnE "emerald|slate-[0-9]|amber-[0-9]|stone-[0-9]|\bgray-[0-9]|\bgreen-[0-9]|#[0-9a-fA-F]{4,6}" components/nesttrails app/deliveries app/track types/nesttrails.ts
```
Expected: no matches.

- [ ] **Step 3: Manual walkthrough** (`npm run dev`, `NEXT_PUBLIC_MOCK=1`)

1. Sidebar "My Deliveries" → `/deliveries`: summary strip, Today/Upcoming/Past tabs with counts, cards with horizontal stepper (in_transit pulsing, failed shows red X node), recurring tag, Call button, copy tracking code.
2. "Track delivery" → drawer opens with vertical timeline, rider card, items, copy + share.
3. Visit `/track/GN-8842` → standalone page (no sidebar) with status + items; visit `/track/NOPE` → not-found state.
4. Dark mode + ~375px; no token violations.

- [ ] **Step 4: Single commit**

Stage only NestTrails files (NOT `lib/api.ts`):
```bash
git add types/nesttrails.ts lib/nesttrails-api.ts hooks/use-my-deliveries.ts hooks/use-tracking.ts components/nesttrails app/deliveries app/track lib/dev-mock.ts
git commit -m "feat(nesttrails): My Deliveries (today/upcoming/past + tracker) + public /track/[code]"
```

---

## Self-review notes (coverage map)

- Spec §3 endpoints → Task 2. §4.1 routes/sidebar → Tasks 7, 8 (sidebar link already exists). §4.2 types → Task 1. §4.3 api → Task 2. §4.4 hooks → Task 3. §4.5 components → Tasks 4 (steppers), 5 (card+drawer), 6 (summary+group), 8 (public view). §4.6 flows → Tasks 7, 8. §4.7 states → groups/skeletons (6), not-found (8). §4.8 mock → Task 9.
- §7 open items: public `/track` layout is standalone (Task 8 `app/track/layout.tsx`, no sidebar/auth); address rendered defensively via `areaLabel` (city/state only, no street/phone) — Task 8; timestamps not per-step (timeline shows status labels only) — Tasks 4–5.
- Tabs use `flex-col!` + full-width grid `TabsList` (same fix as the seller store dialog, since the shadcn tabs default is sideways).
- `useTracking` treats 404 as not-found (no error toast); public page works without auth (endpoint is public; API client sends token only if present).
- Single commit at the end (user preference). `lib/api.ts` mock hook left untouched/uncommitted.
