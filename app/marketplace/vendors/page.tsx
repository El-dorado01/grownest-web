"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { VendorGrid } from "@/components/nestmarkets/vendor-grid";
import { NearbySection } from "@/components/nestmarkets/nearby-section";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { PageHeader } from "@/components/nestmarkets/page-header";
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
        <div className="p-4 md:p-6 space-y-6">
          <PageHeader title="Stores & Vendors" subtitle="Support local businesses and discover top-rated sellers near you." />
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
