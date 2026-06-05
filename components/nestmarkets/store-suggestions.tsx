"use client";

import useSWR from "swr";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import { useCart } from "@/hooks/use-cart";

export function StoreSuggestions({ storeId, excludeIds }: { storeId: string; excludeIds: string[] }) {
  const { add } = useCart();
  const { data: res } = useSWR(
    ["nestmarket-store", storeId],
    () => nestMarketsApi.getStore(storeId),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const all = res?.data?.data?.products ?? [];
  const suggestions = all
    .filter((p) => !excludeIds.includes(p.id) && p.isActive && p.stockLevel > 0)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  const quickAdd = async (id: string) => {
    const r = await add(id, 1);
    if (r.error) return toast.error(r.error);
    toast.success("Added to cart");
  };

  return (
    <div className="px-4 pb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">You might also like</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((p) => (
          <div key={p.id} className="w-24 shrink-0">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <button
                onClick={() => quickAdd(p.id)}
                className="absolute bottom-1 right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                aria-label={`Add ${p.name}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] line-clamp-1">{p.name}</p>
            <p className="text-[11px] font-semibold text-primary">₦{p.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
