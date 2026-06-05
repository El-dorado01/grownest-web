"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateStoreWizard } from "@/components/seller/create-store-wizard";
import { useMyStore } from "@/hooks/use-my-store";

export default function SellerStorePage() {
  const { hasStore, isLoading } = useMyStore();
  const router = useRouter();

  // Editing now lives in the dashboard dialog; this route only hosts the create flow.
  useEffect(() => {
    if (!isLoading && hasStore) router.replace("/seller");
  }, [isLoading, hasStore, router]);

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
              <BreadcrumbItem><BreadcrumbPage>Create store</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <Skeleton className="h-[500px] max-w-3xl mx-auto rounded-2xl" />
          ) : hasStore ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Redirecting…</div>
          ) : (
            <CreateStoreWizard />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
