"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import type { SellerStore } from "@/types/seller";

export function VerificationPanel({ store }: { store: SellerStore }) {
  const [address, setAddress] = useState(store.businessAddress ?? "");
  const [cac, setCac] = useState(store.cacNumber ?? "");
  const [busy, setBusy] = useState(false);

  if (store.isVerified && store.status === "active") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
        Your store is verified and live in the marketplace. 🎉
      </div>
    );
  }

  const submit = async () => {
    if (address.trim().length < 10) return toast.error("Business address must be at least 10 characters");
    setBusy(true);
    const r = await sellerApi.requestVerification({ businessAddress: address.trim(), cacNumber: cac.trim() || undefined });
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not submit verification");
    toast.success("Verification requested — under review");
    globalMutate([SELLER_STORE_KEY]);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Verification</h2>
        <p className="text-sm text-muted-foreground">
          {store.verificationRequestedAt ? "Your request is under review. You can update and resubmit below." : "Verify your store to appear in the marketplace."}
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Business address</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">CAC number <span className="text-muted-foreground">(optional)</span></label>
        <Input value={cac} onChange={(e) => setCac(e.target.value)} placeholder="RC123456" />
      </div>
      <Button onClick={submit} disabled={busy}>{store.verificationRequestedAt ? "Resubmit" : "Request verification"}</Button>
    </div>
  );
}
