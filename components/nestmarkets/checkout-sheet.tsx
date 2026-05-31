"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { nestBasketsApi } from "@/lib/nestbaskets-api";

export function CheckoutSheet({
  storeId, open, onOpenChange,
}: { storeId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { byStore } = useCart();
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
    toast.success("Order placed");
    onOpenChange(false);
    router.push("/marketplace/orders");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>Checkout {group ? `· ${group.store.name}` : ""}</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Deliver to</p>
            {profiles.length === 0 && <p className="text-sm text-muted-foreground">No saved address. Add one in Settings → Delivery.</p>}
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded-xl border p-3 text-sm ${selected?.id === p.id ? "border-primary" : "border-border"}`}
              >
                <p className="font-medium">{p.fullName}</p>
                <p className="text-muted-foreground">{p.address}, {p.city}, {p.state}</p>
                <p className="text-xs text-muted-foreground">{p.deliveryZone?.name ?? "No zone"}</p>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>₦{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span className="text-primary">₦{total.toLocaleString()}</span></div>
          </div>
          {shortfall !== null && (
            <p className="text-sm text-destructive">
              Insufficient balance — you need ₦{shortfall.toLocaleString()} more. Top up your NestPurse and try again.
            </p>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">Transaction PIN</p>
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="tracking-[0.5em] text-center" />
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <Button onClick={pay} disabled={busy || !group} className="w-full">Pay ₦{total.toLocaleString()}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
