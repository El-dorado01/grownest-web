"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Plus, Store } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SellerProductGrid } from "@/components/seller/seller-product-grid";
import { ProductFormSheet } from "@/components/seller/product-form-sheet";
import { useMyStore } from "@/hooks/use-my-store";
import { useMyProducts, SELLER_PRODUCTS_KEY } from "@/hooks/use-my-products";
import { sellerApi } from "@/lib/seller-api";
import type { SellerProduct } from "@/types/seller";

export default function SellerProductsPage() {
  const { store, hasStore, isLoading: storeLoading } = useMyStore();
  const { products, isLoading: productsLoading } = useMyProducts(hasStore);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SellerProduct | null>(null);

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (p: SellerProduct) => { setEditing(p); setSheetOpen(true); };
  const remove = async (p: SellerProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const r = await sellerApi.deleteProduct(p.id);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not delete product");
    toast.success("Product deleted");
    globalMutate([SELLER_PRODUCTS_KEY]);
  };

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
              <BreadcrumbItem><BreadcrumbPage>Products</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {hasStore && (
            <div className="ml-auto">
              <Button onClick={openAdd} size="sm"><Plus className="size-4" /> Add product</Button>
            </div>
          )}
        </header>

        <div className="p-4 md:p-6 space-y-4">
          {!storeLoading && !hasStore ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="size-10 text-muted-foreground mb-3" />
              <p className="font-medium">Create a store first</p>
              <p className="text-sm text-muted-foreground mb-4">You need a store before adding products.</p>
              <Button asChild><Link href="/seller/store">Create your store</Link></Button>
            </div>
          ) : (
            <>
              {hasStore && store && !(store.isVerified && store.status === "active") && (
                <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Your products will go live in the marketplace once your store is verified.{" "}
                  <Link href="/seller/store" className="underline font-medium text-foreground">Request verification</Link>
                </div>
              )}
              <SellerProductGrid
                products={products}
                isLoading={storeLoading || productsLoading}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={remove}
              />
            </>
          )}
        </div>

        <ProductFormSheet
          key={editing?.id ?? "new"}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          product={editing}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
