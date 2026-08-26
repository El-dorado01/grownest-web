import * as React from "react"
import { Calendar, ShieldCheck, AlertCircle, Check, Loader2, MapPin, Scale, X, ShoppingCart, ArrowLeft, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PinInput } from "@/components/ui/pin-input"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FoodItem, DeliveryProfile, Branch } from "@/types/nestbaskets"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatCurrency } from "./utils"

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  basketTitle: string
  setBasketTitle: (val: string) => void
  paymentType: "subscription" | "flexible"
  setPaymentType: (val: "subscription" | "flexible") => void
  subFreq: "weekly" | "monthly" | "quarterly" | "yearly"
  setSubFreq: (val: "weekly" | "monthly" | "quarterly" | "yearly") => void
  flexibleMonths: number
  setFlexibleMonths: (val: number) => void
  enableAutoPay: boolean
  setEnableAutoPay: (val: boolean) => void
  autoPayFreq: "daily" | "weekly" | "biweekly" | "monthly"
  setAutoPayFreq: (val: "daily" | "weekly" | "biweekly" | "monthly") => void
  autoPayAmount: string
  setAutoPayAmount: (val: string) => void
  pinValue: string
  setPinValue: (val: string) => void
  isSubmitting: boolean
  onSubmit: () => void
  totalCost: number
  minBasketValueEnabled: boolean
  minBasketValue: number
  // SWR/Calculations States passed down for mobile review
  profiles: DeliveryProfile[]
  selectedProfileId: string
  setSelectedProfileId: (id: string) => void
  branches: Branch[]
  deliveryOption: "delivery" | "pickup"
  setDeliveryOption: (val: "delivery" | "pickup") => void
  pickupBranchId: string
  setPickupBranchId: (id: string) => void
  isFeeLoading: boolean
  deliveryFee: number
  subtotal: number
  totalWeight: number
  selectedItemsList: Array<{ item: FoodItem; quantity: number }>
  updateQuantity: (id: string, newQty: number) => void

  // Option B states
  fundNow: boolean
  setFundNow: (val: boolean) => void
  fundingMode: "full" | "custom"
  setFundingMode: (val: "full" | "custom") => void
  initialDepositAmount: string
  setInitialDepositAmount: (val: string) => void
}

export function CheckoutDialog({
  isOpen,
  onClose,
  basketTitle,
  setBasketTitle,
  paymentType,
  setPaymentType,
  subFreq,
  setSubFreq,
  flexibleMonths,
  setFlexibleMonths,
  enableAutoPay,
  setEnableAutoPay,
  autoPayFreq,
  setAutoPayFreq,
  autoPayAmount,
  setAutoPayAmount,
  pinValue,
  setPinValue,
  isSubmitting,
  onSubmit,
  totalCost,
  minBasketValueEnabled,
  minBasketValue,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  branches,
  deliveryOption,
  setDeliveryOption,
  pickupBranchId,
  setPickupBranchId,
  isFeeLoading,
  deliveryFee,
  subtotal,
  totalWeight,
  selectedItemsList,
  updateQuantity,

  fundNow,
  setFundNow,
  fundingMode,
  setFundingMode,
  initialDepositAmount,
  setInitialDepositAmount,
}: CheckoutDialogProps) {
  const isMobile = useIsMobile()
  const basketTitleRef = React.useRef<HTMLInputElement>(null)
  
  // Two-stage checkout for mobile Drawer
  const [step, setStep] = React.useState<"review" | "checkout">("review")

  const isDepositInvalid = paymentType === "flexible" && fundNow && fundingMode === "custom" && (
    !initialDepositAmount ||
    isNaN(parseFloat(initialDepositAmount)) ||
    parseFloat(initialDepositAmount) < 500 ||
    parseFloat(initialDepositAmount) > totalCost
  )

  const isDeliveryInvalid = deliveryOption === "delivery" && (!selectedProfileId || profiles.length === 0)
  const isPickupInvalid = deliveryOption === "pickup" && (!pickupBranchId || branches.length === 0)
  const isBelowMinBasketValue = minBasketValueEnabled && subtotal < minBasketValue

  // Reset to first stage ("review") whenever dialog/drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setStep("review")
    }
  }, [isOpen])

  // Focus basket title input when entering checkout stage (desktop opening or mobile step transition)
  React.useEffect(() => {
    if (isOpen && (!isMobile || step === "checkout")) {
      setTimeout(() => basketTitleRef.current?.focus(), 80)
    }
  }, [isOpen, isMobile, step])

  // Automatically reset to review step if the basket becomes empty
  React.useEffect(() => {
    if (selectedItemsList.length === 0) {
      setStep("review")
    }
  }, [selectedItemsList.length])

  // Destination popover picker used on mobile inside drawer
  const destinationSelectorContent = (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <MapPin className="h-4.5 w-4.5 text-primary" />
          <span className="text-xs font-black tracking-wider text-foreground uppercase">
            Delivery Option
          </span>
        </div>
      </div>

      {/* Option selector */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setDeliveryOption("delivery")}
          className={cn(
            "rounded-lg py-1.5 text-xs font-bold transition-all",
            deliveryOption === "delivery"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setDeliveryOption("pickup")}
          className={cn(
            "rounded-lg py-1.5 text-xs font-bold transition-all",
            deliveryOption === "pickup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Pick Up
        </button>
      </div>

      {deliveryOption === "delivery" ? (
        profiles.length === 0 ? (
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
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 pr-1">
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
        )
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          {branches.length > 0 ? (
            <Select
              value={pickupBranchId}
              onValueChange={setPickupBranchId}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-xs font-bold">
                <SelectValue placeholder="Select a branch location" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[11px] text-amber-600 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              No active pickup branches are currently configured. Please contact support.
            </p>
          )}
          {(() => {
            const selectedBranch = branches.find((b) => b.id === pickupBranchId)
            if (!selectedBranch) return null
            return (
              <div className="space-y-1 rounded-xl border border-border bg-background p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>{selectedBranch.name}</span>
                  <span className="font-mono text-muted-foreground">{selectedBranch.phone}</span>
                </div>
                <p>{selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state}</p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )

  const summaryReviewContent = (
    <div className="space-y-4">
      {selectedItemsList.length === 0 ? (
        <div className="my-2 flex flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-muted p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-bold text-muted-foreground">
            Your basket is empty
          </p>
          <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
            Add fresh ingredients from the inventory catalog to begin.
          </p>
        </div>
      ) : (
        <>
          {/* Selected Items Review */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Review Selected Items
            </label>
            <div className="space-y-2 pr-1">
              {selectedItemsList.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-2.5 text-xs font-medium shadow-xs"
                >
                  <div className="flex min-w-0 flex-col gap-0.5 pr-2">
                    <span className="truncate font-bold text-foreground">
                      {item.name}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {item.brand || "Fresh Store"} • {item.unit}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold text-muted-foreground">
                      ×{quantity}
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(item.pricePerUnit * quantity)}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-90"
                      title="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Block */}
          {destinationSelectorContent}

          {/* Calculations list for mobile view */}
          <div className="space-y-2 rounded-2xl border bg-muted/20 p-3.5">
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
              <span>Delivery Fee</span>
              {isFeeLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <span className="font-bold text-foreground">
                  {formatCurrency(deliveryFee)}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const formFields = (
    <>
      {/* Basket Title input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Basket Title
        </label>
        <Input
          ref={basketTitleRef}
          placeholder="e.g. My Mama Monthly Pack"
          className="h-11 rounded-xl border-muted font-bold"
          value={basketTitle}
          onChange={(e) => setBasketTitle(e.target.value)}
        />
      </div>

      {/* Payment Type Selection Cards */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Savings Plan Format
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Recurring Subscription */}
          <button
            type="button"
            onClick={() => setPaymentType("subscription")}
            className={cn(
              "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all",
              paymentType === "subscription"
                ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                : "border-border bg-card hover:bg-muted"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-bold text-foreground">Subscription</span>
              {paymentType === "subscription" && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Continuous delivery debited automatically from wallet at set
              cycles.
            </span>
          </button>

          {/* Flexible Savings Target */}
          <button
            type="button"
            onClick={() => setPaymentType("flexible")}
            className={cn(
              "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all",
              paymentType === "flexible"
                ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                : "border-border bg-card hover:bg-muted"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-bold text-foreground">Flexible Target</span>
              {paymentType === "flexible" && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Save towards groceries at your own pace. Delivered once 100%
              saved.
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic configs based on savings payment type */}
      {paymentType === "subscription" ? (
        <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/20 p-3.5">
          <div className="flex items-center gap-1 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="font-black">Subscription Cycle</span>
          </div>
          <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Select the interval for recurring balance debits and home food
            deliveries.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["weekly", "monthly", "quarterly", "yearly"] as const).map(
              (freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setSubFreq(freq)}
                  className={cn(
                    "rounded-lg border py-2 text-center text-xs font-black capitalize transition-all",
                    subFreq === freq
                      ? "border-primary bg-primary font-black text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {freq}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
          {/* Policy Tip Box */}
          <div className="p-3 rounded-lg border border-amber-500/15 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs leading-normal flex gap-2.5 items-start">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Partial Procurement Policy:</span>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                If your plan expires unpaid, you will be prompted to select and receive items from your basket matching whatever funds you have saved. Any leftover remainder will be refunded back to your NestPurse.
              </p>
            </div>
          </div>

          {/* Saving duration selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-primary">
              <Calendar className="h-4 w-4" />
              <span className="font-black">Target Savings Window</span>
            </div>
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              When would you like to complete this goal? Your basket remains
              locked until fully funded.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* 12 (yearly) temporarily disabled — client no longer wants
                  this offered as a saving duration. Backend still caps the
                  calendar end-date picker at 6 months, so this stays
                  commented out rather than deleted in case it's reinstated. */}
              {[1, 3, 6/*, 12 */].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFlexibleMonths(m)}
                  className={cn(
                    "rounded-lg border py-2 text-center text-xs font-black transition-all",
                    flexibleMonths === m
                      ? "border-primary bg-primary font-black text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {m} {m === 1 ? "Month" : "Months"}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-pay setup */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                Auto-Pay Automated Transfers
              </span>
              <Switch
                checked={enableAutoPay}
                onCheckedChange={setEnableAutoPay}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Enable to automatically debit set amounts from your digital
              NestPurse into this food goal periodically.
            </p>
            {enableAutoPay && (
              <div className="animate-in space-y-2 pt-1 duration-300 fade-in">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-muted-foreground uppercase">
                      Frequency
                    </label>
                    <Select
                      value={autoPayFreq}
                      onValueChange={(v) => setAutoPayFreq(v as any)}
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl border-muted bg-card text-base md:text-xs font-bold">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-muted-foreground uppercase">
                      Amount (₦)
                    </label>
                    <Input
                      type="number"
                      placeholder="Min ₦500"
                      className="h-10 w-full rounded-xl border-muted text-base md:text-xs font-bold"
                      value={autoPayAmount}
                      onChange={(e) => setAutoPayAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Initial Funding Options */}
          <div className="space-y-2.5 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                Make Initial Deposit
              </span>
              <Switch
                checked={fundNow}
                onCheckedChange={setFundNow}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Fund your savings plan immediately upon creation.
            </p>
            {fundNow && (
              <div className="animate-in space-y-3 pt-1 duration-300 fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFundingMode("full")}
                    className={cn(
                      "rounded-lg border py-2 text-center text-xs font-black capitalize transition-all",
                      fundingMode === "full"
                        ? "border-primary bg-primary font-black text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    100% Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundingMode("custom")}
                    className={cn(
                      "rounded-lg border py-2 text-center text-xs font-black capitalize transition-all",
                      fundingMode === "custom"
                        ? "border-primary bg-primary font-black text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Custom Deposit
                  </button>
                </div>

                {fundingMode === "full" ? (
                  <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-center text-xs font-bold text-primary">
                    Deposit Amount: {formatCurrency(totalCost)}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-muted-foreground uppercase">
                      Deposit Amount (₦)
                    </label>
                    <Input
                      type="number"
                      placeholder="Min ₦500"
                      className="h-10 w-full rounded-xl border-muted text-base md:text-xs font-bold"
                      value={initialDepositAmount}
                      onChange={(e) => setInitialDepositAmount(e.target.value)}
                    />
                    {initialDepositAmount && (parseFloat(initialDepositAmount) < 500 || parseFloat(initialDepositAmount) > totalCost) && (
                      <span className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Amount must be between ₦500 and {formatCurrency(totalCost)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aggregated totals check */}
      <div className="flex items-center justify-between rounded-xl border border-dashed bg-card p-3.5">
        <div className="flex flex-col">
          <span className="font-bold text-foreground">Total Checkout Cost</span>
          <span className="text-xs leading-none text-muted-foreground">
            Items subtotal + shipping zone fee
          </span>
        </div>
        <span className="text-lg font-black text-primary">
          {formatCurrency(totalCost)}
        </span>
      </div>

      {isBelowMinBasketValue && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your basket must total at least {formatCurrency(minBasketValue)} before you can create this plan.
            Add {formatCurrency(minBasketValue - subtotal)} more worth of items to continue.
          </span>
        </div>
      )}

      {/* Security PIN code validation */}
      <div className="space-y-2 border-t pt-4">
        <div className="mb-3 flex items-center justify-center gap-1 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wider uppercase">
            Confirm NestPurse PIN
          </span>
        </div>
        <PinInput
          value={pinValue}
          onChange={setPinValue}
          disabled={isSubmitting}
        />
        <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-xs leading-relaxed text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Please enter your 4-digit transactions security code to authorize
          transaction.
        </p>
      </div>

      {/* Submit CTA button */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || pinValue.length !== 4 || isDepositInvalid || isDeliveryInvalid || isPickupInvalid || isBelowMinBasketValue}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-black text-foreground"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            Completing Transaction...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Authorize & Create Plan
          </>
        )}
      </Button>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh] flex flex-col rounded-t-2xl overflow-hidden pb-4">
          {step === "review" ? (
            <>
              <DrawerHeader className="text-left border-b border-border/40 px-5 py-4 shrink-0">
                <DrawerTitle className="text-lg font-black text-foreground">
                  Review Basket
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground mt-1">
                  Verify your selected items, quantities, and delivery destination.
                </DrawerDescription>
              </DrawerHeader>

              <div className="overflow-y-auto max-h-[60vh] space-y-5 px-5 py-4 text-sm font-medium">
                {summaryReviewContent}
              </div>

              {selectedItemsList.length > 0 && (
                <div className="border-t border-border/40 px-5 pt-3 pb-2 shrink-0">
                  <Button
                    onClick={() => setStep("checkout")}
                    disabled={isFeeLoading || isDeliveryInvalid || isPickupInvalid}
                    className="w-full h-11 rounded-xl font-bold"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <DrawerHeader className="text-left border-b border-border/40 px-5 py-4 shrink-0">
                <DrawerTitle className="text-lg font-black text-foreground">
                  Create Food Basket
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground mt-1">
                  Finalize your savings plan format, title, and wallet credentials.
                </DrawerDescription>
              </DrawerHeader>

              <div className="overflow-y-auto max-h-[60vh] space-y-5 px-5 py-4 text-sm font-medium">
                {formFields}
              </div>

              <div className="border-t border-border/40 px-5 pt-3 pb-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("review")}
                  className="w-full h-10 rounded-xl font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Summary
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[576px] flex flex-col overflow-hidden rounded-2xl p-0">
        {/* Modal header */}
        <div className="border-b border-border/40 px-5 sm:px-8 py-5 sm:py-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground tracking-tight">
              Create Food Basket
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Finalize your savings plan format, title, and wallet credentials.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-5 px-5 sm:px-8 py-5 sm:py-6 text-sm font-medium">
          {formFields}
        </div>
      </DialogContent>
    </Dialog>
  )
}
