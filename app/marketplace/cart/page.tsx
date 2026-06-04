"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { CartList } from "@/components/nestmarkets/cart-list";
import { CheckoutSheet } from "@/components/nestmarkets/checkout-sheet";
import { CartBadge } from "@/components/nestmarkets/cart-badge";

export default function BasketsPage() {
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(null);
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
              <BreadcrumbItem><BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>My Baskets</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
          <CartList onCheckout={(id) => { setCheckoutStoreId(id); setOpen(true); }} />
          <CheckoutSheet storeId={checkoutStoreId} open={open} onOpenChange={setOpen} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
