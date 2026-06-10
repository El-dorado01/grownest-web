"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderBoard } from "@/components/seller/order-board";
import { useMyStore } from "@/hooks/use-my-store";
import { useSellerOrders } from "@/hooks/use-seller-orders";

import { DashboardHeader } from "@/components/dashboard-header";

export default function SellerOrdersPage() {
  const { store, hasStore, isLoading: storeLoading } = useMyStore();
  const { orders, isLoading: ordersLoading, advance } = useSellerOrders(store?.id ?? null);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/seller">Sell</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Orders</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
          {storeLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : !hasStore || !store ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">You need a store before you can receive orders.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                <p className="text-sm text-muted-foreground">Track and fulfil orders as they move through each stage.</p>
              </div>
              <OrderBoard orders={orders} isLoading={ordersLoading} onAdvance={advance} />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
