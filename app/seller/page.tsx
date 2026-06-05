"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { StoreStatusBadge } from "@/components/seller/store-status-badge";
import { CreateStoreLanding } from "@/components/seller/create-store-landing";
import { DashboardHero } from "@/components/seller/dashboard-hero";
import { VerificationBanner } from "@/components/seller/verification-banner";
import { KpiRow } from "@/components/seller/kpi-row";
import { RevenueBars } from "@/components/seller/revenue-bars";
import { RecentOrdersCard } from "@/components/seller/recent-orders-card";
import { LowStockWidget } from "@/components/seller/low-stock-widget";
import { TopProductsWidget } from "@/components/seller/top-products-widget";
import { StoreEditDialog } from "@/components/seller/store-edit-dialog";
import { useMyStore } from "@/hooks/use-my-store";
import { useSellerOrders } from "@/hooks/use-seller-orders";
import { useMyProducts } from "@/hooks/use-my-products";

export default function SellerDashboardPage() {
  const { store, hasStore, isLoading } = useMyStore();
  const { orders, isLoading: ordersLoading, advance } = useSellerOrders(store?.id ?? null);
  const { products } = useMyProducts(hasStore);
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<"details" | "verification">("details");

  const openEdit = (tab: "details" | "verification") => { setEditTab(tab); setEditOpen(true); };

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
            <div className="max-w-5xl mx-auto space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            </div>
          ) : !hasStore || !store ? (
            <CreateStoreLanding />
          ) : (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted overflow-hidden">
                  {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-lg font-semibold truncate">{store.name}</h1>
                  <StoreStatusBadge store={store} />
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => openEdit("details")}>
                  <Pencil className="size-4" /> Edit store
                </Button>
              </div>

              <DashboardHero store={store} />
              <VerificationBanner store={store} onReview={() => openEdit("verification")} />
              <KpiRow store={store} orders={orders} ordersLoading={ordersLoading} />

              <div className="grid gap-5 lg:grid-cols-2">
                <RevenueBars orders={orders} />
                <RecentOrdersCard orders={orders} onAdvance={advance} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <LowStockWidget products={products} />
                <TopProductsWidget orders={orders} products={products} />
              </div>

              <StoreEditDialog key={editTab} store={store} open={editOpen} onOpenChange={setEditOpen} defaultTab={editTab} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
