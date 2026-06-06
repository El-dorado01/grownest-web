"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCard } from "@/components/nestmarkets/order-card";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { PageHeader } from "@/components/nestmarkets/page-header";
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
        <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
          <PageHeader title="Order History" subtitle="Track your current deliveries and review past purchases." />
          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">No orders yet</p>
              <Button asChild className="mt-4"><Link href="/marketplace">Start shopping</Link></Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2 items-start">
                {orders.map((o) => <OrderCard key={o.id} order={o} onChanged={mutate} />)}
              </div>
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
