import * as React from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FoodItem } from "@/types/nestbaskets"
import { cn } from "@/lib/utils"
import { formatCurrency } from "./utils"

interface FoodItemCardProps {
  item: FoodItem
  qty: number
  updateQuantity: (id: string, newQty: number) => void
}

export function FoodItemCard({
  item,
  qty,
  updateQuantity,
}: FoodItemCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        qty > 0
          ? "border-primary/50 ring-1 ring-primary/10"
          : "border-border/60"
      )}
    >
      {/* Image / Thumbnail */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-primary/5 text-3xl shadow-inner">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <span>🌾</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-black tracking-widest text-primary uppercase">
            {item.brand || "Fresh Farms"}
          </span>
          <h3 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            {item.name}
          </h3>
          <p className="mb-1 truncate text-[11px] text-muted-foreground">
            {item.description || "Premium farm produce."}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-black text-foreground">
              {formatCurrency(item.pricePerUnit)}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              / {item.unit} ({item.weightPerUnit}kg)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3">
        <span className="text-[11px] font-medium text-muted-foreground">
          Weight: {((item.weightPerUnit || 0) * (qty || 1)).toFixed(1)} kg
        </span>
        {qty > 0 ? (
          <div className="flex items-center gap-1 rounded-xl border bg-muted/60 p-1">
            <button
              onClick={() => {
                const min = item.minQuantity || 1
                updateQuantity(item.id, qty > min ? qty - 1 : 0)
              }}
              className="rounded-lg p-1.5 transition-colors hover:bg-card active:scale-90"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-black">
              {qty}
            </span>
            <button
              onClick={() => updateQuantity(item.id, qty + 1)}
              className="rounded-lg p-1.5 transition-colors hover:bg-card active:scale-90"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            onClick={() => updateQuantity(item.id, item.minQuantity || 1)}
            size="sm"
            variant="outline"
            className="h-8 rounded-xl border-muted-foreground/30 px-3 text-xs font-bold transition-all hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95"
          >
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </div>
    </div>
  )
}
