"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, Wallet } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useProfile } from "@/hooks/use-profile";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { nestBasketsApi } from "@/lib/nestbaskets-api";

export function CheckoutSheet({
  storeId, open, onOpenChange,
}: { storeId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { byStore } = useCart();
  const { balance } = useProfile();
  const group = storeId ? byStore[storeId] : null;
  const { data: profilesRes } = useSWR("delivery-profiles", () => nestBasketsApi.getDeliveryProfiles());
  // NOTE: getDeliveryProfiles() returns DeliveryProfilesResponse ({ success, data: DeliveryProfile[], default, total }).
  // api.get<T> wraps as { data: T }, so the array is profilesRes.data.data and the default is profilesRes.data.default.
  const profiles = profilesRes?.data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shortfall, setShortfall] = useState<number | null>(null);

  const selected = profiles.find((p) => p.id === selectedId) ?? profilesRes?.data?.default ?? null;
  const subtotal = useMemo(() => (group?.items ?? []).reduce((s, i) => s + i.product.price * i.quantity, 0), [group]);
  // NOTE: relies on the list endpoint embedding deliveryZone on each profile. If it does not,
  // the zone (and baseFee) may need to be fetched separately via nestBasketsApi.getDeliveryZones().
  const deliveryFee = selected?.deliveryZone?.baseFee ?? 0;
  const total = subtotal + deliveryFee;
  const insufficient = total > 0 && balance < total;

  const pay = async () => {
    if (!group || !selected) return toast.error("Select a delivery address");
    if (pin.length !== 4) return toast.error("Enter your 4-digit PIN");
    setBusy(true);
    setShortfall(null);
    const r = await nestMarketsApi.checkout({
      items: group.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      pin,
      deliveryProfileId: selected.id,
    });
    setBusy(false);
    if (r.error || !r.data?.success) {
      if (typeof r.data?.shortfall === "number") setShortfall(r.data.shortfall);
      return toast.error(r.data?.message || r.error || "Checkout failed");
    }
    await nestMarketsApi.clearStoreFromCart(group.store.id);
    globalMutate("nestmarket-cart");
    globalMutate((key) => Array.isArray(key) && key[0] === "nestmarket-orders");
    globalMutate("user-profile"); // refresh NestPurse balance after the debit
    toast.success("Order placed");
    onOpenChange(false);
    router.push("/marketplace/orders");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-md border-border/60 shadow-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Checkout {group ? `· ${group.store.name}` : ""}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-8">
            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-primary" /> Delivery Address
              </h3>
              {profiles.length === 0 && <p className="text-sm text-muted-foreground">No saved address. Add one in Settings → Delivery.</p>}
              <div className="grid gap-3">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                      selected?.id === p.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-primary">
                      {selected?.id === p.id ? <CheckCircle2 className="size-5" /> : <div className="size-5 rounded-full border border-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.fullName}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.address}, {p.city}, {p.state}</p>
                      <p className="text-xs font-medium text-primary/80 mt-1">{p.deliveryZone?.name ?? "No zone"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3 text-sm shadow-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Items ({group?.items.length})</span><span className="font-medium">₦{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Delivery Fee</span><span className="font-medium">₦{deliveryFee.toLocaleString()}</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-border/60 text-base">
                  <span className="font-semibold text-foreground">Total</span><span className="font-bold text-primary">₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* NestPurse balance */}
              <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <Wallet className="size-4" />
                  <span className="text-sm font-medium">NestPurse balance</span>
                </div>
                <span className="text-sm font-semibold text-primary">₦{balance.toLocaleString()}</span>
              </div>

              {(insufficient || shortfall !== null) && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 leading-relaxed space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    {shortfall !== null
                      ? `Insufficient balance. You need ₦${shortfall.toLocaleString()} more.`
                      : `Insufficient balance. You need ₦${(total - balance).toLocaleString()} more.`}
                  </p>
                  <Button asChild variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                    <Link href="/nestpurse">Top up NestPurse</Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Payment Authorization */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Payment Authorization</h3>
                <span className="text-xs text-muted-foreground font-medium">4-Digit PIN</span>
              </div>
              <Input 
                inputMode="numeric" type="password" maxLength={4} 
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} 
                placeholder="••••" 
                className="tracking-[1em] text-center text-lg h-14 bg-card shadow-sm border-border/60 focus-visible:ring-primary/30" 
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border/50 bg-muted/20">
          <Button onClick={pay} disabled={busy || !group || insufficient} size="lg" className="w-full text-base font-semibold shadow-sm transition-all hover:scale-[1.02]">
            {busy ? "Processing..." : insufficient ? "Insufficient balance" : `Pay ₦${total.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
