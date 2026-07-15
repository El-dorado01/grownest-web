// app/nestbaskets/baskets/new/page.tsx
"use client"

import { DashboardHeader } from "@/components/dashboard-header"

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
import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  ShoppingBag,
  Check,
} from "lucide-react"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import { FoodItem, CreateCustomPlanRequest, SubscribeRequest } from "@/types/nestbaskets"
import useSWR from "swr"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
import { useIsMobile } from "@/hooks/use-mobile"

// Sub-components
import { CatalogHeader } from "@/components/nestbaskets/catalog-header"
import { FoodItemCard } from "@/components/nestbaskets/food-item-card"
import { BasketSummary } from "@/components/nestbaskets/basket-summary"
import { CheckoutDialog } from "@/components/nestbaskets/checkout-dialog"
import {
  getCategoryForFoodItem,
  formatCurrency,
} from "@/components/nestbaskets/utils"

const CUSTOM_CART_STORAGE_KEY = "nestbaskets-custom-cart"

function CustomBasketBuilderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cloneFrom = searchParams.get("cloneFrom")

  // Primary State
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [isCartLoaded, setIsCartLoaded] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedBrand, setSelectedBrand] = React.useState<string>("all")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)
  const [basketTitle, setBasketTitle] = React.useState("")
  const [paymentType, setPaymentType] = React.useState<
    "subscription" | "flexible"
  >("subscription")

  // Checkout configurations
  const [selectedProfileId, setSelectedProfileId] = React.useState("")
  const [subFreq, setSubFreq] = React.useState<
    "weekly" | "monthly" | "quarterly" | "yearly"
  >("monthly")
  const [flexibleMonths, setFlexibleMonths] = React.useState(3)
  const [enableAutoPay, setEnableAutoPay] = React.useState(false)
  const [autoPayFreq, setAutoPayFreq] = React.useState<
    "daily" | "weekly" | "biweekly" | "monthly"
  >("monthly")
  const [autoPayAmount, setAutoPayAmount] = React.useState("")

  // Option B states
  const [fundNow, setFundNow] = React.useState(false)
  const [fundingMode, setFundingMode] = React.useState<"full" | "custom">(
    "full"
  )
  const [initialDepositAmount, setInitialDepositAmount] = React.useState("")
  const [deliveryOption, setDeliveryOption] = React.useState<"delivery" | "pickup">("delivery")
  const [pickupBranchId, setPickupBranchId] = React.useState("")

  // Success dialog states
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false)
  const [createdPlanId, setCreatedPlanId] = React.useState("")
  const [createdPlanTitle, setCreatedPlanTitle] = React.useState("")
  const [createdPlanType, setCreatedPlanType] = React.useState<
    "subscription" | "flexible"
  >("flexible")
  const [actualFundedAmount, setActualFundedAmount] = React.useState(0)

  // Security Verification
  const [pinValue, setPinValue] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Infinite Scroll limit
  const [visibleCount, setVisibleCount] = React.useState(12)

  // SWR for Inventory
  const { data: foodRes, isLoading: isInventoryLoading } = useSWR(
    "food-items",
    () => nestBasketsApi.getFoodItems()
  )

  // SWR for Predefined plan when cloning
  const { data: cloneRes } = useSWR(
    cloneFrom ? `clone-details-${cloneFrom}` : null,
    () => nestBasketsApi.getPlanDetails(cloneFrom!)
  )

  // SWR for Delivery profiles
  const { data: profilesRes } = useSWR("delivery-profiles", () =>
    nestBasketsApi.getDeliveryProfiles()
  )

  // SWR for Pickup branches
  const { data: branchesRes } = useSWR("pickup-branches", () =>
    nestBasketsApi.getPickupBranches()
  )
  const branches = branchesRes?.data?.data ?? []

  // SWR for Delivery zones
  const { data: zonesRes } = useSWR("delivery-zones", () =>
    nestBasketsApi.getDeliveryZones()
  )

  // SWR for the global minimum basket value setting
  const { data: minBasketRes } = useSWR("min-basket-value", () =>
    nestBasketsApi.getMinBasketValueSetting()
  )
  const minBasketValueEnabled = minBasketRes?.data?.data?.enabled ?? false
  const minBasketValue = minBasketRes?.data?.data?.value ?? 0

  const foodItems = foodRes?.data?.data ?? []
  const profiles = profilesRes?.data?.data ?? []
  const zones = zonesRes?.data?.data ?? []
  const defaultProfile = profilesRes?.data?.default ?? null

  // Restore saved cart from localStorage (skipped when cloning a predefined plan)
  React.useEffect(() => {
    if (!cloneFrom) {
      try {
        const saved = localStorage.getItem(CUSTOM_CART_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === "object") {
            setQuantities(parsed)
          }
        }
      } catch {
        // Ignore corrupted or inaccessible storage
      }
    }
    setIsCartLoaded(true)
  }, [cloneFrom])

  // Persist cart to localStorage whenever it changes (after initial load)
  React.useEffect(() => {
    if (!isCartLoaded) return
    try {
      if (Object.keys(quantities).length === 0) {
        localStorage.removeItem(CUSTOM_CART_STORAGE_KEY)
      } else {
        localStorage.setItem(
          CUSTOM_CART_STORAGE_KEY,
          JSON.stringify(quantities)
        )
      }
    } catch {
      // Ignore storage errors (e.g. private browsing quota)
    }
  }, [quantities, isCartLoaded])

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

  // Reset/Clear PIN and Option B states when the checkout dialog is loaded/opened
  React.useEffect(() => {
    if (isCheckoutOpen) {
      setPinValue("")
      setFundNow(false)
      setFundingMode("full")
      setInitialDepositAmount("")
      setDeliveryOption("delivery")
      if (branches.length > 0) {
        setPickupBranchId(branches[0].id)
      } else {
        setPickupBranchId("")
      }
    }
  }, [isCheckoutOpen, branches])

  // Calculate live statistics
  const selectedItemsList = React.useMemo(() => {
    return Object.entries(quantities)
      .map(([id, qty]) => {
        const item = foodItems.find((f) => f.id === id)
        return item ? { item, quantity: qty } : null
      })
      .filter(
        (i): i is { item: (typeof foodItems)[0]; quantity: number } =>
          i !== null
      )
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
      if (deliveryOption === "pickup") {
        setDeliveryFee(0)
        return
      }
      const activeProfile = profiles.find((p) => p.id === selectedProfileId)
      if (selectedItemsList.length === 0) {
        setDeliveryFee(0)
        return
      }

      let zoneId = activeProfile?.deliveryZoneId
      if (!zoneId && zones.length > 0) {
        const stateName = (activeProfile?.state || "").toLowerCase().trim()
        const cityName = (activeProfile?.city || "").toLowerCase().trim()
        const matchedZone = zones.find((z) => {
          const zn = z.name.toLowerCase()
          return (
            (cityName && (zn.includes(cityName) || cityName.includes(zn))) ||
            (stateName && (zn.includes(stateName) || stateName.includes(zn)))
          )
        })
        const otherStateZone = zones.find((z) =>
          z.name.toLowerCase().includes("other")
        )
        zoneId = matchedZone?.id || otherStateZone?.id || zones[0]?.id
      }

      if (!zoneId) {
        setDeliveryFee(0)
        return
      }

      setIsFeeLoading(true)
      try {
        const payload = selectedItemsList.map((i) => ({
          foodItemId: i.item.id,
          quantity: i.quantity,
          weightPerUnit: i.item.weightPerUnit || 0,
        }))
        const res = await nestBasketsApi.calculateDeliveryFee({
          deliveryZoneId: zoneId,
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
  }, [selectedProfileId, selectedItemsList, profiles, zones, deliveryOption])

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
    const brands = new Set(
      foodItems.map((f) => f.brand).filter((b): b is string => !!b)
    )
    return ["all", ...Array.from(brands)]
  }, [foodItems])

  const filteredFoodItems = React.useMemo(() => {
    return foodItems.filter((item: FoodItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand &&
          item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesBrand =
        selectedBrand === "all" || item.brand === selectedBrand

      const itemCategory = getCategoryForFoodItem(item)
      const matchesCategory =
        selectedCategory === "all" || itemCategory === selectedCategory

      return matchesSearch && matchesBrand && matchesCategory && item.isActive
    })
  }, [foodItems, searchQuery, selectedBrand, selectedCategory])

  const visibleFoodItems = React.useMemo(() => {
    return filteredFoodItems.slice(0, visibleCount)
  }, [filteredFoodItems, visibleCount])

  React.useEffect(() => {
    setVisibleCount(12)
  }, [searchQuery, selectedBrand, selectedCategory])

  const observerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const currentTarget = observerRef.current
    if (!currentTarget || visibleCount >= filteredFoodItems.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + 12, filteredFoodItems.length)
          )
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    observer.observe(currentTarget)

    return () => {
      observer.unobserve(currentTarget)
    }
  }, [visibleCount, filteredFoodItems.length])

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
    if (minBasketValueEnabled && subtotal < minBasketValue) {
      const shortfall = minBasketValue - subtotal
      toast.error(
        `Your basket must total at least ${formatCurrency(minBasketValue)} before you can create this plan. Add ${formatCurrency(shortfall)} more worth of items to continue.`
      )
      return
    }
    if (deliveryOption === "delivery" && !selectedProfileId) {
      toast.error("Please select a delivery address")
      return
    }
    if (deliveryOption === "pickup" && !pickupBranchId) {
      toast.error("Please select a pickup branch")
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

      const createPayload: CreateCustomPlanRequest = {
        title: basketTitle,
        items: planItems,
        paymentType,
        deliveryOption,
      }

      if (deliveryOption === "delivery") {
        createPayload.deliveryProfileId = selectedProfileId
      } else {
        createPayload.pickupBranchId = pickupBranchId
      }

      if (paymentType === "flexible") {
        createPayload.savingExpiresAt = expiresDate.toISOString()
      }

      const createRes = await nestBasketsApi.createCustomPlan(createPayload)

      if (
        createRes.error ||
        !createRes.data?.success ||
        !createRes.data?.data?.customPlan
      ) {
        throw new Error(
          createRes.data?.message ||
            createRes.error ||
            "Failed to establish custom plan configuration"
        )
      }

      const customPlan = createRes.data.data.customPlan

      // Basket has been claimed by this plan — clear the saved draft cart
      try {
        localStorage.removeItem(CUSTOM_CART_STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }

      let funded = 0

      // 2. Perform Transaction Checkout depending on Payment Type
      if (paymentType === "subscription") {
        const subscribePayload: SubscribeRequest = {
          customPlanId: customPlan.id,
          frequency: subFreq,
          pin: pinValue,
          deliveryOption,
        }

        if (deliveryOption === "delivery") {
          subscribePayload.useDefaultDelivery = (selectedProfileId === defaultProfile?.id)
          if (!subscribePayload.useDefaultDelivery) {
            const activeProfile = profiles.find((p) => p.id === selectedProfileId)
            if (activeProfile) {
              subscribePayload.deliveryOverride = {
                fullName: activeProfile.fullName,
                phone: activeProfile.phone,
                address: activeProfile.address,
                city: activeProfile.city,
                state: activeProfile.state,
                landmark: activeProfile.landmark || undefined,
                notes: activeProfile.notes || undefined,
              }
            }
          }
        } else {
          subscribePayload.pickupBranchId = pickupBranchId
        }

        const subRes = await nestBasketsApi.subscribeToPlan(subscribePayload)

        if (subRes.error || !subRes.data?.success) {
          throw new Error(
            subRes.data?.message ||
              subRes.error ||
              "Failed to activate subscription"
          )
        }

        toast.success(`Successfully subscribed to custom plan: ${basketTitle}`)
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
            toast.warning(
              "Goal created, but Auto-Pay setup failed. You can re-enable it in your goal details page."
            )
          }
        }

        if (fundNow) {
          const depositVal =
            fundingMode === "full"
              ? totalCost
              : parseFloat(initialDepositAmount)
          try {
            const payRes = await nestBasketsApi.makeFlexiblePayment({
              customPlanId: customPlan.id,
              amount: depositVal,
              pin: pinValue,
            })
            if (payRes.data?.success) {
              funded = depositVal
              toast.success(
                `Deposit of ${formatCurrency(depositVal)} successful!`
              )
            } else {
              toast.error(
                payRes.data?.message ||
                  payRes.error ||
                  "Initial deposit transaction failed"
              )
            }
          } catch (payErr: any) {
            toast.error(
              payErr.message ||
                "Failed to process initial deposit. Check wallet PIN and balance."
            )
          }
        }
        toast.success(
          `Successfully established flexible savings goal: ${basketTitle}`
        )
      }

      // Record success details and trigger dialog
      setCreatedPlanId(customPlan.id)
      setCreatedPlanTitle(basketTitle)
      setCreatedPlanType(paymentType)
      setActualFundedAmount(funded)
      setIsCheckoutOpen(false)
      setIsSuccessOpen(true)
    } catch (err: any) {
      toast.error(
        err.message ||
          "Transaction failed. Please verify your PIN and NestPurse balance."
      )
      setPinValue("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap overflow-hidden whitespace-nowrap">
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbLink
                  href="/dashboard"
                  className="max-w-[80px] truncate sm:max-w-[120px] md:max-w-none"
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbLink
                  href="/nestbaskets/baskets"
                  className="max-w-[90px] truncate sm:max-w-[150px] md:max-w-none"
                >
                  Food Baskets
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="max-w-[100px] truncate sm:max-w-[150px] md:max-w-none">
                  Custom Builder
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        {/* Two-column layout */}
        <div className="flex w-full flex-col divide-y pb-20 lg:grid lg:grid-cols-[1fr_360px] lg:divide-y-0 lg:pb-0">
          {/* Main Catalog View */}
          <div className="min-w-0">
            <CatalogHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              uniqueBrands={uniqueBrands}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Scrolling item grid */}
            <div className="space-y-6 p-5 md:p-6">
              {isInventoryLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-2xl" />
                  ))}
                </div>
              ) : filteredFoodItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/20 py-16 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/45" />
                  <p className="text-base font-bold">
                    No active food items match filters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try clearing search terms or selected brands filter.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedBrand("all")
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Reset Filter
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleFoodItems.map((item) => {
                    const qty = quantities[item.id] || 0
                    return (
                      <FoodItemCard
                        key={item.id}
                        item={item}
                        qty={qty}
                        updateQuantity={updateQuantity}
                      />
                    )
                  })}
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {visibleCount < filteredFoodItems.length && (
                <div
                  ref={observerRef}
                  className="flex w-full justify-center py-6"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Builder Sidebar Panel (Desktop version) */}
          <BasketSummary
            selectedItemsList={selectedItemsList}
            subtotal={subtotal}
            totalWeight={totalWeight}
            deliveryFee={deliveryFee}
            isFeeLoading={isFeeLoading}
            totalCost={totalCost}
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            updateQuantity={updateQuantity}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            branches={branches}
            deliveryOption={deliveryOption}
            setDeliveryOption={setDeliveryOption}
            pickupBranchId={pickupBranchId}
            setPickupBranchId={setPickupBranchId}
          />
        </div>

        {/* Floating Mobile Checkout Bar */}
        {selectedItemsList.length > 0 && (
          <div className="fixed right-0 bottom-0 left-0 z-30 flex animate-in items-center justify-between border-t bg-background/90 p-4 shadow-2xl backdrop-blur-md duration-300 slide-in-from-bottom lg:hidden">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {selectedItemsList.reduce(
                  (acc, curr) => acc + curr.quantity,
                  0
                )}{" "}
                items selected
              </span>
              <span className="text-lg font-black text-primary">
                {formatCurrency(totalCost)}
              </span>
            </div>
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl px-5 font-bold text-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              Review & Checkout
            </Button>
          </div>
        )}

        {/* Checkout Modal / Drawer Config */}
        <CheckoutDialog
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          basketTitle={basketTitle}
          setBasketTitle={setBasketTitle}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          subFreq={subFreq}
          setSubFreq={setSubFreq}
          flexibleMonths={flexibleMonths}
          setFlexibleMonths={setFlexibleMonths}
          enableAutoPay={enableAutoPay}
          setEnableAutoPay={setEnableAutoPay}
          autoPayFreq={autoPayFreq}
          setAutoPayFreq={setAutoPayFreq}
          autoPayAmount={autoPayAmount}
          setAutoPayAmount={setAutoPayAmount}
          pinValue={pinValue}
          setPinValue={setPinValue}
          isSubmitting={isSubmitting}
          onSubmit={handleCheckoutSubmit}
          totalCost={totalCost}
          minBasketValueEnabled={minBasketValueEnabled}
          minBasketValue={minBasketValue}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          setSelectedProfileId={setSelectedProfileId}
          branches={branches}
          deliveryOption={deliveryOption}
          setDeliveryOption={setDeliveryOption}
          pickupBranchId={pickupBranchId}
          setPickupBranchId={setPickupBranchId}
          isFeeLoading={isFeeLoading}
          deliveryFee={deliveryFee}
          subtotal={subtotal}
          totalWeight={totalWeight}
          selectedItemsList={selectedItemsList}
          updateQuantity={updateQuantity}
          fundNow={fundNow}
          setFundNow={setFundNow}
          fundingMode={fundingMode}
          setFundingMode={setFundingMode}
          initialDepositAmount={initialDepositAmount}
          setInitialDepositAmount={setInitialDepositAmount}
        />

        {/* Success Modal */}
        <CheckoutSuccessDialog
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          planId={createdPlanId}
          planTitle={createdPlanTitle}
          planType={createdPlanType}
          fundedAmount={actualFundedAmount}
          totalCost={totalCost}
          subFreq={subFreq}
        />
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

function CheckoutSuccessDialog({
  isOpen,
  onClose,
  planId,
  planTitle,
  planType,
  fundedAmount,
  totalCost,
  subFreq,
}: {
  isOpen: boolean
  onClose: () => void
  planId: string
  planTitle: string
  planType: "subscription" | "flexible"
  fundedAmount: number
  totalCost: number
  subFreq: string
}) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const handleAction = (route: string) => {
    onClose()
    router.push(route)
  }

  const overviewCard = (
    <div className="w-full space-y-2.5 rounded-xl border bg-muted/20 p-4 text-left text-xs font-semibold">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Plan Name:</span>
        <span className="max-w-[200px] truncate text-foreground">
          {planTitle}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Plan Type:</span>
        <span className="text-foreground capitalize">
          {planType === "flexible" ? "Flexible Target" : "Subscription"}
        </span>
      </div>
      {planType === "subscription" ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Billing Cycle:</span>
            <span className="text-foreground capitalize">{subFreq}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cycle Cost:</span>
            <span className="font-black text-foreground">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-black text-foreground">
              {formatCurrency(totalCost)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Funded Amount:</span>
            <span className="font-black text-emerald-600">
              {formatCurrency(fundedAmount)}
            </span>
          </div>
        </>
      )}
    </div>
  )

  const actionButtons = (
    <>
      {planType === "flexible" && fundedAmount === 0 ? (
        <div className="w-full space-y-3 pt-2">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs leading-normal font-semibold text-primary">
            Would you like to make a deposit to your plan now?
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleAction("/nestbaskets/baskets")}
              variant="outline"
              className="h-11 flex-1 rounded-xl text-xs"
            >
              Later
            </Button>
            <Button
              onClick={() =>
                handleAction(
                  `/nestbaskets/baskets/flexible/${planId}?deposit=true`
                )
              }
              className="h-11 flex-1 rounded-xl text-xs font-bold text-foreground"
            >
              Yes, Deposit Now
            </Button>
          </div>
        </div>
      ) : planType === "flexible" ? (
        <div className="flex w-full gap-3 pt-2">
          <Button
            onClick={() => handleAction("/nestbaskets/baskets")}
            variant="outline"
            className="h-11 flex-1 rounded-xl text-xs"
          >
            Back to Baskets
          </Button>
          <Button
            onClick={() =>
              handleAction(`/nestbaskets/baskets/flexible/${planId}`)
            }
            className="h-11 flex-1 rounded-xl text-xs font-bold text-foreground"
          >
            View Goal Details
          </Button>
        </div>
      ) : (
        <div className="flex w-full gap-3 pt-2">
          <Button
            onClick={() => handleAction("/nestbaskets/baskets")}
            variant="outline"
            className="h-11 flex-1 rounded-xl text-xs"
          >
            Back to Baskets
          </Button>
          <Button
            onClick={() =>
              handleAction(`/nestbaskets/baskets/subscription/${planId}`)
            }
            className="h-11 flex-1 rounded-xl text-xs font-bold text-foreground"
          >
            View Subscription Details
          </Button>
        </div>
      )}
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={() => {}}>
        <DrawerContent className="p-6 select-none">
          <div className="flex flex-col items-center space-y-4 pb-6 text-center">
            {/* Animated check bubble */}
            <div className="flex size-16 animate-bounce items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-8" strokeWidth={3} />
            </div>

            <DrawerHeader className="space-y-1 px-0 text-center">
              <DrawerTitle className="text-xl font-black tracking-tight text-foreground">
                Basket Setup Successful!
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Your custom food basket has been created successfully.
              </DrawerDescription>
            </DrawerHeader>

            {overviewCard}
            {actionButtons}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md rounded-2xl p-6 select-none"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Animated check bubble */}
          <div className="flex size-16 animate-bounce items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Check className="size-8" strokeWidth={3} />
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
              Basket Setup Successful!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Your custom food basket has been created successfully.
            </DialogDescription>
          </DialogHeader>

          {overviewCard}
          {actionButtons}
        </div>
      </DialogContent>
    </Dialog>
  )
}
