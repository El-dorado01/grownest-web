import * as React from "react"
import { ShoppingCart, MapPin, Scale, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FoodItem, DeliveryProfile } from "@/types/nestbaskets"
import { formatCurrency } from "./utils"

// === DESKTOP BASKET SUMMARY ===
interface BasketSummaryProps {
  selectedItemsList: Array<{ item: FoodItem; quantity: number }>
  subtotal: number
  totalWeight: number
  deliveryFee: number
  isFeeLoading: boolean
  totalCost: number
  profiles: DeliveryProfile[]
  selectedProfileId: string
  setSelectedProfileId: (id: string) => void
  updateQuantity: (id: string, newQty: number) => void
  onProceedToCheckout: () => void
}

export function BasketSummary({
  selectedItemsList,
  subtotal,
  totalWeight,
  deliveryFee,
  isFeeLoading,
  totalCost,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  updateQuantity,
  onProceedToCheckout,
}: BasketSummaryProps) {
  return (
    <div className="sticky top-0 hidden h-screen w-full flex-col self-start border-l border-border/60 bg-muted/10 lg:flex">
      {/* Header — compact to maximize scroll area */}
      <div className="flex shrink-0 flex-col gap-1 border-b border-border/30 bg-muted/10 px-5 py-3">
        <h2 className="text-xl font-bold tracking-tight">
          Basket Summary
        </h2>
        <p className="text-xs text-muted-foreground">
          Review your customized ingredients, aggregate weights, and
          shipping fees below.
        </p>
      </div>

      {selectedItemsList.length === 0 ? (
        <div className="m-5 flex flex-1 flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-muted p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-bold text-muted-foreground">
            Your basket is empty
          </p>
          <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
            Add fresh ingredients from the inventory catalog on the left
            to begin.
          </p>
        </div>
      ) : (
        <>
          {/* Scrollable items + address */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pt-4 pr-4 md:px-6">
            {/* Item Rows */}
            <div className="space-y-3">
              {selectedItemsList.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3 text-sm font-medium shadow-sm"
                >
                  <div className="flex min-w-0 flex-col gap-1 pr-2">
                    <span className="truncate font-bold text-foreground">
                      {item.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.brand || "Fresh Store"} • {item.unit}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-black text-muted-foreground">
                      ×{quantity}
                    </span>
                    <span className="font-black text-foreground">
                      {formatCurrency(item.pricePerUnit * quantity)}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-90"
                      title="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Address Summary Block */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  <span className="text-xs font-black tracking-wider text-foreground uppercase">
                    Destination
                  </span>
                </div>
              </div>
              {profiles.length === 0 ? (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    No delivery addresses created. Create a default
                    shipping address to calculate weight-based zones.
                  </p>
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-8 w-full text-xs"
                    asChild
                  >
                    <Link href="?settings=true&tab=addresses">Create Address</Link>
                  </Button>
                </div>
              ) : (
                (() => {
                  const activeProfile = profiles.find(
                    (p) => p.id === selectedProfileId
                  )
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/50 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                          <div className="flex flex-col gap-0.5 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-bold text-foreground">
                              {activeProfile?.fullName} ({activeProfile?.phone})
                            </span>
                            <span className="truncate">
                              {activeProfile?.address}, {activeProfile?.city},{" "}
                              {activeProfile?.state}
                            </span>
                            <span className="mt-1 text-[10px] font-semibold text-primary">
                              Tap to change destination ›
                            </span>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 rounded-2xl p-3" align="end">
                        <p className="mb-2.5 text-xs font-black tracking-wider text-muted-foreground uppercase">
                          Select Destination
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                          {profiles.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedProfileId(p.id)}
                              className={cn(
                                "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all",
                                selectedProfileId === p.id
                                  ? "border-primary bg-primary/5 text-foreground font-semibold"
                                  : "border-border/50 bg-background hover:bg-muted/50"
                              )}
                            >
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="font-bold text-foreground">
                                  {p.fullName}
                                </span>
                                <span className="truncate text-muted-foreground">
                                  {p.address}, {p.city}
                                </span>
                              </div>
                              {selectedProfileId === p.id && (
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-col items-center justify-center border-t border-border/40 pt-2.5 text-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            Your destination not listed?
                          </span>
                          <Link
                            href="?settings=true&tab=addresses"
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Add new destination
                          </Link>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )
                })()
              )}
            </div>
          </div>

          {/* Pinned bottom: calculations + checkout button */}
          <div className="shrink-0 space-y-2 border-t border-border/40 px-5 pt-3 pb-4">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" /> Aggregate Weight
              </span>
              <span className="font-bold text-foreground">
                {totalWeight.toFixed(2)} kg
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-bold text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Progressive Delivery Fee</span>
              {isFeeLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <span className="font-bold text-foreground">
                  {formatCurrency(deliveryFee)}
                </span>
              )}
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-black">
              <span>Aggregated Cost</span>
              <span className="text-base font-black text-primary">
                {formatCurrency(totalCost)}
              </span>
            </div>
            <Button
              onClick={onProceedToCheckout}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-foreground shadow-lg shadow-primary/10 transition-transform active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// === MOBILE BASKET SUMMARY ===
interface MobileBasketSummaryProps {
  selectedItemsList: Array<{ item: FoodItem; quantity: number }>
  subtotal: number
  deliveryFee: number
  totalCost: number
  updateQuantity: (id: string, newQty: number) => void
}

export function MobileBasketSummary({
  selectedItemsList,
  subtotal,
  deliveryFee,
  totalCost,
  updateQuantity,
}: MobileBasketSummaryProps) {
  return (
    <div className="space-y-5 border-t border-border/60 bg-muted/10 p-5 lg:hidden">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold tracking-tight">
          Basket Summary
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Review your customized ingredients, aggregate weights, and
          shipping fees below.
        </p>
      </div>
      {selectedItemsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted p-6 py-12 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">
            Your basket is empty
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {selectedItemsList.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3 text-sm font-medium shadow-sm"
              >
                <div className="flex min-w-0 flex-col gap-1 pr-2">
                  <span className="truncate font-bold text-foreground">
                    {item.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.brand || "Fresh Store"} • {item.unit}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-black text-muted-foreground">
                    ×{quantity}
                  </span>
                  <span className="font-black text-foreground">
                    {formatCurrency(item.pricePerUnit * quantity)}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm font-semibold text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-bold text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-muted-foreground">
              <span>Delivery Fee</span>
              <span className="font-bold text-foreground">
                {formatCurrency(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-black">
              <span>Total</span>
              <span className="text-lg font-black text-primary">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
