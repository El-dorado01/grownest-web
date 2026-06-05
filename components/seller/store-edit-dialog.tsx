"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "./store-form";
import { VerificationPanel } from "./verification-panel";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import type { SellerStore } from "@/types/seller";

export function StoreEditDialog({
  store, open, onOpenChange, defaultTab = "details",
}: {
  store: SellerStore; open: boolean; onOpenChange: (o: boolean) => void;
  defaultTab?: "details" | "verification";
}) {
  const [form, setForm] = useState<StoreFormValue>(emptyStoreForm(store));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const r = await sellerApi.updateStore(storeFormToFormData(form));
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not update store");
    toast.success("Store updated");
    globalMutate([SELLER_STORE_KEY]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit store</DialogTitle></DialogHeader>
        <Tabs defaultValue={defaultTab} className="mt-2 flex-col!">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-5 pt-5">
            <StoreForm initial={store} value={form} onChange={setForm} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
              <Button onClick={save} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save changes
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="verification" className="pt-5">
            <VerificationPanel store={store} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
