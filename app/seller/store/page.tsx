"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreateStoreWizard } from "@/components/seller/create-store-wizard";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "@/components/seller/store-form";
import { VerificationPanel } from "@/components/seller/verification-panel";
import { StoreStatusBadge } from "@/components/seller/store-status-badge";
import { useMyStore, SELLER_STORE_KEY } from "@/hooks/use-my-store";
import { sellerApi } from "@/lib/seller-api";

export default function SellerStorePage() {
  const { store, hasStore, isLoading } = useMyStore();
  const [form, setForm] = useState<StoreFormValue | null>(null);
  const [busy, setBusy] = useState(false);

  // initialise edit form once store loads
  const editForm = form ?? emptyStoreForm(store);

  const saveEdit = async () => {
    setBusy(true);
    const r = await sellerApi.updateStore(storeFormToFormData(editForm));
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not update store");
    toast.success("Store updated");
    globalMutate([SELLER_STORE_KEY]);
    setForm(null);
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
              <BreadcrumbItem><BreadcrumbPage>My Store</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <Skeleton className="h-80 max-w-xl mx-auto rounded-2xl" />
          ) : !hasStore || !store ? (
            <CreateStoreWizard />
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{store.name}</h1>
                <StoreStatusBadge store={store} />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h2 className="font-semibold">Store details</h2>
                <StoreForm initial={store} value={editForm} onChange={setForm} />
                <Button onClick={saveEdit} disabled={busy}>Save changes</Button>
              </div>
              <VerificationPanel store={store} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
