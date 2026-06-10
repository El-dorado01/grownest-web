"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { VendorGrid } from "@/components/nestmarkets/vendor-grid";
import { NearbySection } from "@/components/nestmarkets/nearby-section";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { PageHeader } from "@/components/nestmarkets/page-header";
import { useVendors } from "@/hooks/use-vendors";
import { DashboardHeader } from "@/components/dashboard-header";

export default function VendorsPage() {
  const v = useVendors();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader rightActions={<CartBadge />}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Vendors</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>
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
