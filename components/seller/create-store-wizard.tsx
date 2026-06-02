"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreForm, emptyStoreForm, storeFormToFormData, type StoreFormValue } from "./store-form";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_STORE_KEY } from "@/hooks/use-my-store";
import { AddMoneyDialog } from "@/components/purse/add-money-dialog";

export function CreateStoreWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<StoreFormValue>(emptyStoreForm());
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [lowBalance, setLowBalance] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const next = () => {
    if (form.name.trim().length < 3) return toast.error("Store name must be at least 3 characters");
    setStep(2);
  };

  const submit = async () => {
    if (pin.length !== 4) return toast.error("Enter your 4-digit PIN");
    setBusy(true);
    setLowBalance(false);
    const r = await sellerApi.createStore(storeFormToFormData(form, pin));
    setBusy(false);
    if (r.error || !r.data?.success) {
      if (r.status === 400) { setLowBalance(true); return; }
      return toast.error(r.error || "Could not create store");
    }
    toast.success("Store created — ₦1,000 debited");
    globalMutate([SELLER_STORE_KEY]);
    globalMutate("user-profile");
    router.push("/seller/store");
  };

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create your store</h1>
        <p className="text-sm text-muted-foreground">Step {step} of 2 · A one-time ₦1,000 setup fee applies.</p>
      </div>

      {step === 1 ? (
        <>
          <StoreForm value={form} onChange={setForm} />
          <Button onClick={next} className="w-full">Continue</Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Store</span><span className="font-medium">{form.name}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Setup fee</span><span className="font-semibold text-primary">₦1,000</span></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Transaction PIN</label>
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="tracking-[0.5em] text-center" />
          </div>
          {lowBalance && (
            <p className="text-sm text-destructive">
              Insufficient balance for the ₦1,000 fee.{" "}
              <button onClick={() => setTopUpOpen(true)} className="underline font-medium">Top up</button>
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy} className="flex-1">Back</Button>
            <Button onClick={submit} disabled={busy} className="flex-1">Pay ₦1,000 & create</Button>
          </div>
        </div>
      )}

      <AddMoneyDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}
