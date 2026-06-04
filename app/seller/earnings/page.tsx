"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EarningsCards } from "@/components/seller/earnings-cards";
import { PayoutHistory } from "@/components/seller/payout-history";
import { useMyStore } from "@/hooks/use-my-store";

export default function SellerEarningsPage() {
  const { store, hasStore, isLoading } = useMyStore();

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
              <BreadcrumbItem><BreadcrumbPage>Earnings</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
          {isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : !hasStore || !store ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">Earnings appear once you have a store and sales.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <>
              <EarningsCards store={store} />
              <div className="space-y-3">
                <h2 className="font-semibold">Payout history</h2>
                <PayoutHistory />
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
