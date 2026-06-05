"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate as globalMutate } from "swr";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Store, ShieldAlert } from "lucide-react";
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
        </header>

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {hasStore && !storeLoading && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
                <p className="text-sm text-muted-foreground">Manage your store&apos;s inventory and pricing.</p>
              </div>
              <Button onClick={openAdd}><Plus className="size-4 mr-2" /> Add product</Button>
            </div>
          )}
          
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
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-muted px-4 py-3 flex items-center gap-3"
                >
                  <ShieldAlert className="size-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground flex-1">
                    Your products will go live in the marketplace once your store is verified.
                  </p>
                  <Link href="/seller/store" className="text-sm font-medium text-primary shrink-0">Verify now</Link>
                </motion.div>
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
