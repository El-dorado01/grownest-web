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
