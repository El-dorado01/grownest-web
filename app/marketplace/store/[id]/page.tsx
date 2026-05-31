"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/nestmarkets/product-card";
import { ProductQuickView } from "@/components/nestmarkets/product-quick-view";
import { FollowButton } from "@/components/nestmarkets/follow-button";
import { StoreReviews } from "@/components/nestmarkets/store-reviews";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { useVendor } from "@/hooks/use-vendor";
import { useVendors } from "@/hooks/use-vendors";
import type { MarketProduct } from "@/types/nestmarkets";

export default function StoreProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { store, products, isLoading, reviews, reviewsPagination, reviewsLoading, reviewsPage, setReviewsPage } = useVendor(id);
  const { followedIds } = useVendors();
  const [selected, setSelected] = useState<MarketProduct | null>(null);
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
              <BreadcrumbItem><BreadcrumbLink href="/marketplace/vendors">Vendors</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{store?.name ?? "Store"}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {isLoading || !store ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="relative h-32 bg-muted">
                {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              <div className="p-4 flex items-start gap-4 -mt-10">
                <div className="size-16 rounded-full bg-muted border-2 border-card overflow-hidden shrink-0">
                  {store.logoUrl && <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 pt-10">
                  <h1 className="text-lg font-semibold">{store.name}</h1>
                  {store.description && <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" />{store.averageRating?.toFixed(1) ?? "—"} ({store.ratingCount})</span>
                    <span>{store._count?.products ?? products.length} products</span>
                    <span>{store._count?.followers ?? 0} followers</span>
                  </div>
                </div>
                <div className="pt-10">
                  <FollowButton storeId={store.id} initialFollowing={followedIds.has(store.id)} />
                </div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold">Products</h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">This store has no products yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const withStore: MarketProduct = { ...p, store: { id: store!.id, name: store!.name, logoUrl: store!.logoUrl, averageRating: store!.averageRating, ratingCount: store!.ratingCount } };
                  return <ProductCard key={p.id} product={withStore} onClick={() => { setSelected(withStore); setOpen(true); }} />;
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Reviews</h2>
            <StoreReviews
              reviews={reviews} isLoading={reviewsLoading}
              page={reviewsPagination.page} pages={reviewsPagination.pages} onPage={setReviewsPage}
            />
          </section>
        </div>
        <ProductQuickView product={selected} open={open} onOpenChange={setOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
