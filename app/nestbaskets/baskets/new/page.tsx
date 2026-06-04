// app/nestbaskets/baskets/new/page.tsx
"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Minus,
  ShoppingCart,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Search,
  Loader2,
  Info,
  ChevronRight,
  Check,
  AlertCircle,
  Scale,
  Sparkles,
  ShoppingBag
} from "lucide-react"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import { FoodItem } from "@/types/nestbaskets"
import useSWR from "swr"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PinInput } from "@/components/ui/pin-input"
import { toast } from "sonner"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

function CustomBasketBuilderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cloneFrom = searchParams.get("cloneFrom")

  // States
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedBrand, setSelectedBrand] = React.useState<string>("all")
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)
  const [basketTitle, setBasketTitle] = React.useState("")
  const [paymentType, setPaymentType] = React.useState<"subscription" | "flexible">("subscription")
  
  // Checkout configurations
  const [selectedProfileId, setSelectedProfileId] = React.useState("")
  const [subFreq, setSubFreq] = React.useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly")
  const [flexibleMonths, setFlexibleMonths] = React.useState(3)
  const [enableAutoPay, setEnableAutoPay] = React.useState(false)
  const [autoPayFreq, setAutoPayFreq] = React.useState<"daily" | "weekly" | "biweekly" | "monthly">("monthly")
  const [autoPayAmount, setAutoPayAmount] = React.useState("")

  // Security Verification
  const [pinValue, setPinValue] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // SWR for Inventory
  const { data: foodRes, isLoading: isInventoryLoading } = useSWR("food-items", () =>
    nestBasketsApi.getFoodItems()
  )

  // SWR for Predefined plan when cloning
  const { data: cloneRes } = useSWR(
    cloneFrom ? `clone-details-${cloneFrom}` : null,
    () => nestBasketsApi.getPlanDetails(cloneFrom!)
  )

  // SWR for Delivery profiles
  const { data: profilesRes, isLoading: isProfilesLoading } = useSWR(
    "delivery-profiles",
    () => nestBasketsApi.getDeliveryProfiles()
  )

  const foodItems = foodRes?.data?.data ?? []
  const profiles = profilesRes?.data?.data ?? []
  const defaultProfile = profilesRes?.data?.default ?? null

  // Seed quantities if cloning from predefined plan
  React.useEffect(() => {
    const cloneData = cloneRes?.data?.data
    if (cloneData) {
      const seed: Record<string, number> = {}
      setBasketTitle(`My Custom ${cloneData.name || "Basket"}`)
      if (cloneData.items) {
        cloneData.items.forEach((item: any) => {
          seed[item.foodItemId] = item.quantity
        })
      }
      setQuantities(seed)
    } else if (!basketTitle) {
      setBasketTitle("My Premium Basket")
    }
  }, [cloneRes])

  // Select default delivery profile automatically if available
  React.useEffect(() => {
    if (defaultProfile) {
      setSelectedProfileId(defaultProfile.id)
    } else if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [profilesRes, defaultProfile, profiles])

  // Calculate live statistics
  const selectedItemsList = React.useMemo(() => {
    return Object.entries(quantities)
      .map(([id, qty]) => {
        const item = foodItems.find((f) => f.id === id)
        return item ? { item, quantity: qty } : null
      })
      .filter((i): i is { item: typeof foodItems[0]; quantity: number } => i !== null)
  }, [quantities, foodItems])

  const subtotal = React.useMemo(() => {
    return selectedItemsList.reduce((sum, current) => {
      return sum + current.item.pricePerUnit * current.quantity
    }, 0)
  }, [selectedItemsList])

  const totalWeight = React.useMemo(() => {
    return selectedItemsList.reduce((sum, current) => {
      return sum + (current.item.weightPerUnit || 0) * current.quantity
    }, 0)
  }, [selectedItemsList])

  // Fetch / Calculate delivery fee
  const [deliveryFee, setDeliveryFee] = React.useState(0)
  const [isFeeLoading, setIsFeeLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchFee = async () => {
      const activeProfile = profiles.find((p) => p.id === selectedProfileId)
      if (!activeProfile?.deliveryZoneId || selectedItemsList.length === 0) {
        setDeliveryFee(0)
        return
      }

      setIsFeeLoading(true)
      try {
        const payload = selectedItemsList.map((i) => ({
          foodItemId: i.item.id,
          quantity: i.quantity,
        }))
        const res = await nestBasketsApi.calculateDeliveryFee({
          deliveryZoneId: activeProfile.deliveryZoneId,
          items: payload,
        })
        if (res.data?.success) {
          setDeliveryFee(res.data.fee)
        }
      } catch (err) {
        console.error("Failed to calculate delivery fee", err)
      } finally {
        setIsFeeLoading(false)
      }
    }

    fetchFee()
  }, [selectedProfileId, selectedItemsList, profiles])

  const totalCost = subtotal + deliveryFee

  // Quantity updates
  const updateQuantity = (id: string, newQty: number) => {
    setQuantities((prev) => {
      const next = { ...prev }
      if (newQty <= 0) {
        delete next[id]
      } else {
        next[id] = newQty
      }
      return next
    })
  }

  // Curation Filters
  const uniqueBrands = React.useMemo<string[]>(() => {
    const brands = new Set(foodItems.map((f) => f.brand).filter((b): b is string => !!b))
    return ["all", ...Array.from(brands)]
  }, [foodItems])

  const filteredFoodItems = React.useMemo(() => {
    return foodItems.filter((item: FoodItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand
      return matchesSearch && matchesBrand && item.isActive
    })
  }, [foodItems, searchQuery, selectedBrand])

  // Checkout submission handler
  const handleCheckoutSubmit = async () => {
    if (!basketTitle.trim()) {
      toast.error("Please provide a name for your custom basket")
      return
    }
    if (selectedItemsList.length === 0) {
      toast.error("Please add at least one item to your basket")
      return
    }
    if (!selectedProfileId) {
      toast.error("Please select a delivery address")
      return
    }
    if (pinValue.length !== 4) {
      toast.error("Please enter a valid 4-digit security PIN")
      return
    }

    setIsSubmitting(true)
    try {
      const planItems = selectedItemsList.map((i) => ({
        foodItemId: i.item.id,
        quantity: i.quantity,
      }))

      // 1. Create the Custom Plan Draft
      const expiresDate = new Date()
      expiresDate.setMonth(expiresDate.getMonth() + flexibleMonths)

      const createPayload = {
        title: basketTitle,
        items: planItems,
        paymentType,
        deliveryProfileId: selectedProfileId,
        savingExpiresAt: paymentType === "flexible" ? expiresDate.toISOString() : undefined,
      }

      const createRes = await nestBasketsApi.createCustomPlan(createPayload)

      if (createRes.error || !createRes.data?.success || !createRes.data?.data?.customPlan) {
        throw new Error(createRes.data?.message || createRes.error || "Failed to establish custom plan configuration")
      }

      const customPlan = createRes.data.data.customPlan

      // 2. Perform Transaction Checkout depending on Payment Type
      if (paymentType === "subscription") {
        const subRes = await nestBasketsApi.subscribeToPlan({
          customPlanId: customPlan.id,
          frequency: subFreq,
          useDefaultDelivery: true,
          pin: pinValue,
        })

        if (subRes.error || !subRes.data?.success) {
          throw new Error(subRes.data?.message || subRes.error || "Failed to activate subscription")
        }

        toast.success(`Successfully subscribed to custom plan: ${basketTitle}`)
        router.push("/nestbaskets/baskets")
      } else {
        // Flexible Savings plan
        if (enableAutoPay) {
          const autoPaySetupRes = await nestBasketsApi.setupAutoPay({
            customPlanId: customPlan.id,
            frequency: autoPayFreq,
            amount: parseFloat(autoPayAmount) || 1000,
            pin: pinValue,
          })
          if (autoPaySetupRes.error || !autoPaySetupRes.data?.success) {
            toast.warning("Goal created, but Auto-Pay setup failed. You can re-enable it in your goal details page.")
          }
        }
        toast.success(`Successfully established flexible savings goal: ${basketTitle}`)
        router.push("/nestbaskets/baskets")
      }
      setIsCheckoutOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Transaction failed. Please verify your PIN and NestPurse balance.")
      setPinValue("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/nestbaskets/baskets">Food Baskets</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Custom Builder</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button variant="ghost" size="sm" asChild className="gap-1 bg-muted/30 border">
              <Link href="/nestbaskets/baskets">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 divide-y lg:divide-y-0 lg:divide-x">
          {/* Main Catalog View */}
          <div className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Custom Basket Builder
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Select your preferred groceries from our active farm inventory. Adjust quantities to build your personalized weekly or monthly food bundle.
              </p>
            </div>

            {/* Catalog Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search food items or brands..."
                  className="pl-9 rounded-xl h-10 border-muted"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0">
                {uniqueBrands.slice(0, 5).map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                      selectedBrand === brand
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {brand === "all" ? "All Brands" : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Catalog */}
            {isInventoryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-2xl" />
                ))}
              </div>
            ) : filteredFoodItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-2xl bg-card/20 border-dashed">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/45" />
                <p className="text-base font-bold">No active food items match filters</p>
                <p className="text-sm text-muted-foreground">Try clearing search terms or selected brands filter.</p>
                <Button onClick={() => { setSearchQuery(""); setSelectedBrand("all"); }} size="sm" variant="outline">
                  Reset Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFoodItems.map((item) => {
                  const qty = quantities[item.id] || 0
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative flex flex-col p-4 rounded-2xl border transition-all duration-300 bg-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30",
                        qty > 0 ? "border-primary/50 ring-1 ring-primary/10" : "border-border/60"
                      )}
                    >
                      {/* Image / Thumbnail */}
                      <div className="flex gap-4 items-start">
                        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 text-3xl shrink-0 shadow-inner">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span>🌾</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black tracking-widest uppercase text-primary mb-1 block">
                            {item.brand || "Fresh Farms"}
                          </span>
                          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate mb-1">
                            {item.description || "Premium farm produce."}
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-black text-foreground">
                              {formatCurrency(item.pricePerUnit)}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              / {item.unit} ({item.weightPerUnit}kg)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/40">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Weight: {((item.weightPerUnit || 0) * (qty || 1)).toFixed(1)} kg
                        </span>
                        {qty > 0 ? (
                          <div className="flex items-center bg-muted/60 border rounded-xl p-1 gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="p-1.5 hover:bg-card rounded-lg transition-colors active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              className="p-1.5 hover:bg-card rounded-lg transition-colors active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => updateQuantity(item.id, 1)}
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl px-3 text-xs font-bold border-muted-foreground/30 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Builder Sidebar Panel */}
          <div className="w-full lg:w-96 p-4 md:p-6 shrink-0 bg-muted/10 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold tracking-tight">Basket Summary</h2>
                <p className="text-xs text-muted-foreground">Review your customized ingredients, aggregate weights, and shipping fees below.</p>
              </div>

              {selectedItemsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border-2 border-dashed border-muted rounded-2xl p-6">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm font-bold text-muted-foreground">Your basket is empty</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Add fresh ingredients from the inventory catalog on the left to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Item Rows */}
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {selectedItemsList.map(({ item, quantity }) => (
                      <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl bg-card border border-border/50 shadow-sm text-xs font-medium">
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <span className="font-bold text-foreground truncate">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{item.brand || "Fresh Store"} • {item.unit}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground font-black">×{quantity}</span>
                          <span className="font-black text-foreground">{formatCurrency(item.pricePerUnit * quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Address Summary Block */}
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-xs font-black text-foreground">Delivery Destination</span>
                      </div>
                      {profiles.length > 0 && (
                        <select
                          value={selectedProfileId}
                          onChange={(e) => setSelectedProfileId(e.target.value)}
                          className="bg-transparent text-[11px] font-bold text-primary underline focus:outline-none cursor-pointer max-w-[150px] text-right"
                        >
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id} className="text-foreground">
                              {p.fullName} ({p.city})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {profiles.length === 0 ? (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          No delivery addresses created. Create a default shipping address to calculate weight-based zones.
                        </p>
                        <Button size="xs" variant="outline" className="text-[10px] h-7 self-start" asChild>
                          <Link href="?settings=true">Create Address</Link>
                        </Button>
                      </div>
                    ) : (
                      (() => {
                        const activeProfile = profiles.find((p) => p.id === selectedProfileId)
                        return (
                          <div className="text-[11px] text-muted-foreground flex flex-col">
                            <span className="font-bold text-foreground">{activeProfile?.fullName} ({activeProfile?.phone})</span>
                            <span className="truncate">{activeProfile?.address}, {activeProfile?.city}, {activeProfile?.state}</span>
                          </div>
                        )
                      })()
                    )}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Aggregate Weight</span>
                      <span className="text-foreground font-bold">{totalWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>Items Subtotal</span>
                      <span className="text-foreground font-bold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>Progressive Delivery Fee</span>
                      {isFeeLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <span className="text-foreground font-bold">{formatCurrency(deliveryFee)}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm font-black border-t pt-3">
                      <span>Aggregated Cost</span>
                      <span className="text-primary text-base font-black">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedItemsList.length > 0 && (
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full mt-6 h-12 rounded-xl text-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-transform active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic checkout custom sheet dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="w-5 h-5 text-primary" /> Create Food Basket
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Finalize your savings plan format, title, and wallet credentials.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-medium">
              {/* Basket Title input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Basket Title</label>
                <Input
                  placeholder="e.g. My Mama Monthly Pack"
                  className="rounded-xl h-10 border-muted font-bold"
                  value={basketTitle}
                  onChange={(e) => setBasketTitle(e.target.value)}
                />
              </div>

              {/* Payment Type Selection Cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Savings Plan Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Recurring Subscription */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("subscription")}
                    className={cn(
                      "flex flex-col p-3 rounded-xl border text-left gap-1.5 transition-all",
                      paymentType === "subscription"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-foreground">Subscription</span>
                      {paymentType === "subscription" && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                      Continuous delivery debited automatically from wallet at set cycles.
                    </span>
                  </button>

                  {/* Flexible Savings Target */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("flexible")}
                    className={cn(
                      "flex flex-col p-3 rounded-xl border text-left gap-1.5 transition-all",
                      paymentType === "flexible"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-foreground">Flexible Target</span>
                      {paymentType === "flexible" && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                      Save towards groceries at your own pace. Delivered once 100% saved.
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic configs based on savings payment type */}
              {paymentType === "subscription" ? (
                <div className="space-y-1.5 p-3.5 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-1 text-primary">
                    <Calendar className="w-4 h-4" />
                    <span className="font-black">Subscription Cycle</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                    Select the interval for recurring balance debits and home food deliveries.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["weekly", "monthly", "quarterly", "yearly"] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setSubFreq(freq)}
                        className={cn(
                          "py-1.5 rounded-lg border text-center text-[10px] font-black capitalize transition-all",
                          subFreq === freq
                            ? "bg-primary border-primary text-primary-foreground font-black"
                            : "bg-card border-border hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
                  {/* Saving duration selection */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-primary">
                      <Calendar className="w-4 h-4" />
                      <span className="font-black">Target Savings Window</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                      When would you like to complete this goal? Your basket remains locked until fully funded.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFlexibleMonths(m)}
                          className={cn(
                            "py-1.5 rounded-lg border text-center text-[10px] font-black transition-all",
                            flexibleMonths === m
                              ? "bg-primary border-primary text-primary-foreground font-black"
                              : "bg-card border-border hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {m} {m === 1 ? "Month" : "Months"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-pay setup */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Auto-Pay Automated Transfers</span>
                      <input
                        type="checkbox"
                        checked={enableAutoPay}
                        onChange={(e) => setEnableAutoPay(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Enable to automatically debit set amounts from your digital NestPurse into this food goal periodically.
                    </p>
                    {enableAutoPay && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-muted-foreground">Frequency</label>
                            <select
                              value={autoPayFreq}
                              onChange={(e) => setAutoPayFreq(e.target.value as any)}
                              className="w-full bg-card border rounded-lg h-8 px-2 text-[11px] font-bold"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-muted-foreground">Amount (₦)</label>
                            <Input
                              type="number"
                              placeholder="Min ₦500"
                              className="h-8 rounded-lg text-[11px] border-muted font-bold"
                              value={autoPayAmount}
                              onChange={(e) => setAutoPayAmount(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aggregated totals check */}
              <div className="p-3.5 rounded-xl border border-dashed flex justify-between items-center bg-card">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">Total Checkout Cost</span>
                  <span className="text-[10px] text-muted-foreground leading-none">Items subtotal + shipping zone fee</span>
                </div>
                <span className="text-primary text-lg font-black">{formatCurrency(totalCost)}</span>
              </div>

              {/* Security PIN code validation */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-1 justify-center text-primary mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Confirm NestPurse PIN</span>
                </div>
                <PinInput
                  value={pinValue}
                  onChange={setPinValue}
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed text-center mt-1.5 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  Please enter your 4-digit transactions security code to authorize transaction.
                </p>
              </div>

              {/* Submit CTA button */}
              <Button
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting || pinValue.length !== 4}
                className="w-full h-11 mt-4 rounded-xl text-foreground font-black flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                    Completing Transaction...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Authorize & Create Plan
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CustomBasketBuilderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CustomBasketBuilderPageContent />
    </React.Suspense>
  )
}
