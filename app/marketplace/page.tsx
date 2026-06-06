"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SearchBar } from "@/components/nestmarkets/search-bar";
import { CategoryFilter } from "@/components/nestmarkets/category-filter";
import { ProductGrid } from "@/components/nestmarkets/product-grid";
import { ProductQuickView } from "@/components/nestmarkets/product-quick-view";
import { CartBadge } from "@/components/nestmarkets/cart-badge";
import { PageHeader } from "@/components/nestmarkets/page-header";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { MarketProduct } from "@/types/nestmarkets";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MarketProduct | null>(null);
  const [open, setOpen] = useState(false);

  const { products, pagination, categories, isLoading } = useMarketplace(search, category, page);

  const onSearch = (v: string) => { setSearch(v); setPage(1); };
  const onCategory = (c: string) => { setCategory(c); setPage(1); };
  const onSelect = (p: MarketProduct) => { setSelected(p); setOpen(true); };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Marketplace</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><CartBadge /></div>
        </header>
        <div className="p-4 md:p-6 space-y-5">
          <PageHeader title="Marketplace" subtitle="Discover fresh groceries, meals, and products from verified vendors." />
          <SearchBar value={search} onChange={onSearch} />
          <CategoryFilter categories={categories} active={category} onChange={onCategory} />
          <ProductGrid
            products={products} isLoading={isLoading}
            page={pagination.page} pages={pagination.pages}
            onPage={setPage} onSelect={onSelect}
          />
        </div>
        <ProductQuickView product={selected} open={open} onOpenChange={setOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
