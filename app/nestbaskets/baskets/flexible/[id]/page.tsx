// app/nestbaskets/baskets/flexible/[id]/page.tsx
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
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  Loader2,
  ShieldCheck,
  Trash,
  Truck,
  ArrowLeft,
  Info,
  MapPin,
  ShoppingBag,
  PiggyBank,
  Plus,
  TrendingUp,
  Settings,
  AlertCircle,
  Check,
  User,
  AlertTriangle,
} from "lucide-react"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import useSWR from "swr"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
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
import { PinInput } from "@/components/ui/pin-input"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface ResponsiveDialogProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}

function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="p-6">
          <DrawerHeader className="text-left mb-4 px-0">
            <DrawerTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
              {title}
            </DrawerTitle>
            {description && (
              <DrawerDescription className="text-xs text-muted-foreground mt-1">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="pb-6">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default function FlexibleSavingsGoalPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const customPlanId = params.id as string
  const autoOpenDeposit = searchParams?.get("deposit") === "true"

  // UI state overlays
  const [isDepositOpen, setIsDepositOpen] = React.useState(false)
  const [isAutoPayOpen, setIsAutoPayOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  // Forms fields
  const [depositAmount, setDepositAmount] = React.useState("")
  const [autoPayAmount, setAutoPayAmount] = React.useState("")
  const [autoPayFreq, setAutoPayFreq] = React.useState<
    "daily" | "weekly" | "biweekly" | "monthly"
  >("weekly")

  // Security authorization state
  const [pinValue, setPinValue] = React.useState("")
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // SWR for Plan Details
  const {
    data: planRes,
    isLoading,
    mutate,
  } = useSWR(customPlanId ? `flexible-details-${customPlanId}` : null, () =>
    nestBasketsApi.getFlexiblePlanDetails(customPlanId)
  )

  // SWR for Shipping profiles (to switch addresses)
  const { data: profilesRes } = useSWR("delivery-profiles", () =>
    nestBasketsApi.getDeliveryProfiles()
  )

  const plan = planRes?.data?.data || null
  const profiles = profilesRes?.data?.data ?? []

  const isPendingSelection = plan?.status === "pending_selection"
  const deliveries = plan?.deliveries || []

  // Procurement states
  const [selectedQuantities, setSelectedQuantities] = React.useState<
    Record<string, number>
  >({})

  // Set default selection quantities when plan loads
  React.useEffect(() => {
    if (plan && plan.status === "pending_selection" && plan.items) {
      const initial: Record<string, number> = {}
      plan.items.forEach((item: any) => {
        initial[item.foodItemId] = 0
      })
      setSelectedQuantities(initial)
    }
  }, [plan])

  // Auto-open deposit drawer if requested via query parameters
  React.useEffect(() => {
    if (autoOpenDeposit && plan) {
      setIsDepositOpen(true)
    }
  }, [autoOpenDeposit, plan])

  // Selected Cost
  const selectedCost = React.useMemo(() => {
    if (!plan || !plan.items) return 0
    return plan.items.reduce((sum: number, planItem: any) => {
      const qty = selectedQuantities[planItem.foodItemId] || 0
      return sum + qty * (planItem.foodItem?.pricePerUnit || 0)
    }, 0)
  }, [plan, selectedQuantities])

  // Greedy Check
  const greedyCheckError = React.useMemo(() => {
    if (!plan || plan.status !== "pending_selection" || !plan.items) return null
    if (selectedCost > plan.paidAmount)
      return "Selected items cost exceeds your saved funds"

    const remainingFunds = plan.paidAmount - selectedCost
    for (const planItem of plan.items) {
      const selectedQty = selectedQuantities[planItem.foodItemId] || 0
      const remainingPlanQty = planItem.quantity - selectedQty
      const currentPrice = planItem.foodItem?.pricePerUnit || 0

      if (remainingPlanQty > 0 && currentPrice <= remainingFunds) {
        return `You still have enough saved funds (₦${remainingFunds.toLocaleString()}) to select more items. For example, you can buy another unit of "${planItem.foodItem?.name || "Item"}" (₦${currentPrice.toLocaleString()}). Please increase your selection.`
      }
    }
    return null
  }, [plan, selectedQuantities, selectedCost])

  const updateQuantity = (
    foodItemId: string,
    change: number,
    maxQty: number
  ) => {
    setSelectedQuantities((prev) => {
      const current = prev[foodItemId] || 0
      const updated = Math.max(0, Math.min(maxQty, current + change))
      return { ...prev, [foodItemId]: updated }
    })
  }

  const handleProcureSubmit = async () => {
    if (!plan) return
    if (selectedCost === 0) {
      toast.error("Please select at least one item to procure.")
      return
    }
    if (selectedCost > plan.paidAmount) {
      toast.error("Selected cost exceeds your saved budget.")
      return
    }
    if (greedyCheckError) {
      toast.error("Greedy completeness constraint not met: " + greedyCheckError)
      return
    }

    setIsActionLoading(true)
    try {
      const selectedItemsPayload = Object.entries(selectedQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([foodItemId, qty]) => ({
          foodItemId,
          quantity: qty,
        }))

      const res = await nestBasketsApi.procureFlexiblePlan(
        plan.id,
        selectedItemsPayload
      )
      if (res.data?.success) {
        toast.success(
          `Procurement successful! Delivery scheduled. Refund of ${formatCurrency(
            res.data?.data?.refundAmount || 0
          )} credited back to your NestPurse.`
        )
        mutate() // Refetch details
      } else {
        toast.error(
          res.data?.message || res.error || "Failed to process procurement"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during procurement.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Deposit Shortcut
  const handleAmountChipClick = (amount: number) => {
    setDepositAmount(amount.toString())
  }

  // Handle address swap
  const handleAddressSwap = async (deliveryProfileId: string) => {
    if (!plan) return
    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.updateCustomPlanAddress(
        plan.id,
        deliveryProfileId
      )
      if (res.data?.success) {
        toast.success(
          "Delivery address updated successfully! Progressive weight shipping fee recalculated."
        )
        mutate() // Refetch details
      } else {
        toast.error(
          res.data?.message || res.error || "Failed to update address"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong updating destination.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Action deposit handler
  const handleDepositSubmit = async () => {
    if (!plan) return
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < 500) {
      toast.error("Please specify a deposit amount of at least ₦500")
      return
    }
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.makeFlexiblePayment({
        customPlanId: plan.id,
        amount,
        pin: pinValue,
      })

      if (res.data?.success) {
        toast.success(
          `Deposit of ${formatCurrency(amount)} successful! savings goal progress: ${res.data?.data?.progress || "0%"}`
        )
        setIsDepositOpen(false)
        setDepositAmount("")
        setPinValue("")
        mutate()
      } else {
        toast.error(
          res.data?.message || res.error || "Deposit transaction failed"
        )
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to process savings deposit. Check wallet PIN and balance."
      )
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Configure Auto-Pay
  const handleAutoPaySubmit = async () => {
    if (!plan) return
    const amount = parseFloat(autoPayAmount)
    if (isNaN(amount) || amount < 500) {
      toast.error(
        "Please specify an Auto-Save transfer amount of at least ₦500"
      )
      return
    }
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.setupAutoPay({
        customPlanId: plan.id,
        frequency: autoPayFreq,
        amount,
        pin: pinValue,
      })

      if (res.data?.success) {
        toast.success(
          `Successfully activated automated Auto-Pay savings scheduler!`
        )
        setIsAutoPayOpen(false)
        setAutoPayAmount("")
        setPinValue("")
        mutate()
      } else {
        toast.error(
          res.data?.message || res.error || "Failed to configure Auto-Pay"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "Incorrect PIN or failed to setup rules.")
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Deactivate Auto-Pay
  const handleDisableAutoPay = async () => {
    if (!plan) return
    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.disableAutoPay(plan.id)
      if (res.data?.success) {
        toast.success("Automated Auto-Pay savings disabled successfully.")
        mutate()
      } else {
        toast.error(
          res.data?.message || res.error || "Failed to disable Auto-Pay"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Delete Savings and full wallet refund
  const handleDeletePlanSubmit = async () => {
    if (!plan) return
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.deleteCustomPlan(plan.id, pinValue)
      if (res.data?.success) {
        toast.success(
          `Savings plan successfully deleted! All accrued savings of ${formatCurrency(
            res.data?.data?.refundAmount || 0
          )} have been refunded back to your NestPurse.`
        )
        setIsDeleteOpen(false)
        router.push("/nestbaskets/baskets")
      } else {
        toast.error(res.data?.message || res.error || "Failed to delete plan")
      }
    } catch (err: any) {
      toast.error(err.message || "Incorrect PIN. Plan deletion denied.")
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="space-y-6 p-4 md:p-6">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Skeleton className="h-[400px] rounded-2xl lg:col-span-2" />
              <Skeleton className="h-[300px] rounded-2xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!plan) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <AlertTriangle className="h-12 w-12 animate-pulse text-amber-500" />
            <h2 className="text-xl font-bold">Goal Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The requested flexible savings meal target does not exist.
            </p>
            <Button asChild>
              <Link href="/nestbaskets/baskets">Back to Dashboard</Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const items = plan.items || []
  const profile = plan.deliveryProfile || null

  // Progress Calculations
  const savedPercent =
    plan.totalPrice > 0
      ? Math.min((plan.paidAmount / plan.totalPrice) * 100, 100)
      : 0
  const progressPercent = Math.round(savedPercent)
  const remainingAmount = Math.max(plan.totalPrice - plan.paidAmount, 0)

  // Circular progress SVG configurations
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (savedPercent / 100) * circumference

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader
          rightActions={
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 border bg-muted/30"
            >
              <Link href="/nestbaskets/baskets">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
          }
        >
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:inline-flex">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:inline-flex" />
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink href="/nestbaskets/baskets">
                  Food Baskets
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem>
                <BreadcrumbPage>Savings Goal hub</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
          {/* Top Page Header Banner */}
          <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border bg-card p-6 shadow-md shadow-primary/2 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {(isPendingSelection || plan.isPaid) && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase",
                      isPendingSelection
                        ? "animate-pulse bg-amber-500/15 text-amber-600 dark:bg-amber-500/25"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full bg-current",
                        isPendingSelection && "animate-ping"
                      )}
                    />
                    {isPendingSelection
                      ? "Selection Pending"
                      : "Ready for Delivery"}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
                  Flexible savings goal
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {plan.title}
              </h1>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Target date:{" "}
                {formatDate(plan.savingExpiresAt)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
              <span className="text-xs font-semibold text-muted-foreground">
                Total Target Groceries Budget
              </span>
              <span className="text-2xl font-black text-foreground">
                {formatCurrency(plan.totalPrice)}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-bold text-primary">
                Saved so far: {formatCurrency(plan.paidAmount)} (
                {progressPercent}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left side circular progress ring and list of ingredients */}
            <div className="space-y-6 lg:col-span-2">
              {isPendingSelection ? (
                <>
                  {/* Procurement Banner */}
                  <div className="space-y-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-xs shadow-sm">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-5 w-5" />
                      <h3 className="text-sm font-bold">
                        Important: Select Items to Procure
                      </h3>
                    </div>
                    <p className="leading-relaxed text-muted-foreground">
                      This custom savings goal has expired. As per the updated
                      policy, we do not issue a full cash refund to prevent
                      service abuse. Instead, you can select items from your
                      basket below up to your accrued savings of{" "}
                      <strong className="text-foreground">
                        {formatCurrency(plan.paidAmount)}
                      </strong>
                      .
                    </p>
                    <p className="leading-relaxed text-muted-foreground">
                      <strong>Greedy Selection Rule:</strong> You must select as
                      many items as possible. The remaining balance after
                      selection must be strictly less than the price of any
                      remaining unselected items in your plan. Any leftover
                      balance will be refunded to your NestPurse.
                    </p>
                  </div>

                  {/* Procurement Item Selector */}
                  <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-bold text-foreground">
                          Select Items to Procure
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Accrued Savings:{" "}
                        <strong className="text-foreground">
                          {formatCurrency(plan.paidAmount)}
                        </strong>
                      </span>
                    </div>

                    <div className="divide-y text-xs font-medium">
                      {items.map((planItem: any) => {
                        const item = planItem.foodItem
                        const selectedQty =
                          selectedQuantities[planItem.foodItemId] || 0
                        const maxQty = planItem.quantity
                        return (
                          <div
                            key={planItem.id}
                            className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xl">
                                {item?.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    className="h-full w-full rounded-lg object-cover"
                                  />
                                ) : (
                                  "🌾"
                                )}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate font-bold text-foreground">
                                  {item?.name || "Fresh Grocery"}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {item?.brand || "Fresh Farms"} • {item?.unit}{" "}
                                  • {formatCurrency(item?.pricePerUnit)} / unit
                                </span>
                                <span className="mt-0.5 text-xs font-semibold text-primary/80">
                                  Plan Target: {planItem.quantity} unit
                                  {planItem.quantity > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex w-full shrink-0 items-center justify-between gap-4 border-t border-dashed border-border/60 pt-2 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                              {/* Decrement / Increment buttons */}
                              <div className="flex items-center overflow-hidden rounded-xl border bg-muted/40">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      planItem.foodItemId,
                                      -1,
                                      maxQty
                                    )
                                  }
                                  disabled={selectedQty === 0}
                                  className="px-2.5 py-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                >
                                  -
                                </button>
                                <span className="min-w-[20px] px-3 text-center font-bold text-foreground">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      planItem.foodItemId,
                                      1,
                                      maxQty
                                    )
                                  }
                                  disabled={selectedQty >= maxQty}
                                  className="px-2.5 py-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                              <span className="min-w-[80px] text-right font-black text-foreground">
                                {formatCurrency(
                                  (item?.pricePerUnit || 0) * selectedQty
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Radial Savings Meter Banner */}
                  <div className="flex flex-col items-center justify-around gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row">
                    {/* Glowing radial Progress Ring SVG */}
                    <div className="relative flex size-36 shrink-0 items-center justify-center">
                      <svg className="size-full -rotate-90">
                        {/* Background track circle */}
                        <circle
                          cx="72"
                          cy="72"
                          r={radius}
                          className="stroke-muted"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        {/* Glowing gold active progress path circle */}
                        <circle
                          cx="72"
                          cy="72"
                          r={radius}
                          className="stroke-primary transition-all duration-1000 ease-out"
                          strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      {/* Central Text Label overlay */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl leading-none font-black text-foreground">
                          {progressPercent}%
                        </span>
                        <span className="mt-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                          Saved
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-center sm:text-left">
                      <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">
                          {" "}
                          Groceries Target Milestone
                        </h3>
                      </div>
                      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                        Keep contributing at your convenience. When the
                        indicator glows green at <strong>100% complete</strong>,
                        your customized food ingredients unlock and
                        automatically schedule for immediate dispatch!
                      </p>

                      <div className="flex flex-wrap justify-center gap-2.5 pt-1.5 sm:justify-start">
                        {!plan.isPaid && (
                          <Button
                            onClick={() => setIsDepositOpen(true)}
                            size="sm"
                            className="flex h-9 items-center gap-1.5 rounded-xl font-bold text-foreground shadow-md shadow-primary/10 transition-transform active:scale-95"
                          >
                            <Plus className="h-4 w-4 text-foreground" /> Save
                            Now
                          </Button>
                        )}

                        <Button
                          onClick={() => setIsAutoPayOpen(true)}
                          size="sm"
                          variant="outline"
                          className="flex h-9 items-center gap-1.5 rounded-xl border-muted text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          <Settings className="h-3.5 w-3.5" /> Auto-Pay Settings
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Deliveries Timeline (Only shown if plan is fully paid/delivered and has dispatches) */}
                  {plan.isPaid && (
                    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-2 border-b pb-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-bold text-foreground">
                          Delivery Timeline
                        </h2>
                      </div>

                      {deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
                          <Truck className="h-8 w-8 text-muted-foreground/35" />
                          <p className="text-xs font-bold text-muted-foreground">
                            No dispatches created yet
                          </p>
                        </div>
                      ) : (
                        <div className="relative ml-3 space-y-6 border-l-2 border-primary/20 py-2 pl-6">
                          {deliveries.map((delivery: any) => (
                            <div key={delivery.id} className="relative">
                              {/* Timeline marker */}
                              <div
                                className={cn(
                                  "absolute top-1 left-[-31px] flex size-4.5 items-center justify-center rounded-full border-4 border-card shadow-md",
                                  delivery.status === "delivered"
                                    ? "bg-emerald-500"
                                    : delivery.status === "failed"
                                      ? "bg-destructive"
                                      : "animate-pulse bg-primary"
                                )}
                              />
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-foreground">
                                    {delivery.status === "delivered"
                                      ? "Groceries Fulfilled"
                                      : delivery.status === "in_transit"
                                        ? "In Transit"
                                        : delivery.status === "dispatched"
                                          ? "Dispatched"
                                          : "Delivery Scheduled"}
                                  </h4>
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" /> Scheduled:{" "}
                                    {formatDate(delivery.deliveryDate)}
                                  </p>
                                  {delivery.riderName && (
                                    <div className="mt-1.5 flex w-fit items-center gap-1.5 rounded bg-muted/65 p-1 px-2 text-xs font-medium text-foreground">
                                      <User className="h-3 w-3 text-primary" />
                                      <span>
                                        Rider: {delivery.riderName} (
                                        {delivery.riderPhone})
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "shrink-0 rounded px-2 py-0.5 text-xs font-black tracking-wider uppercase",
                                    delivery.status === "delivered"
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-primary/10 text-primary"
                                  )}
                                >
                                  {delivery.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subscribed Ingredients Inventory */}
                  <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 border-b pb-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <h2 className="text-base font-bold text-foreground">
                        Custom Basket Ingredients
                      </h2>
                    </div>

                    <div className="divide-y text-xs font-medium">
                      {items.map((planItem: any) => {
                        const item = planItem.foodItem
                        return (
                          <div
                            key={planItem.id}
                            className="flex flex-col justify-between gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xl">
                                {item?.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    className="h-full w-full rounded-lg object-cover"
                                  />
                                ) : (
                                  "🌾"
                                )}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate font-bold text-foreground">
                                  {item?.name || "Fresh Grocery"}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {item?.brand || "Fresh Farms"} • {item?.unit}
                                </span>
                              </div>
                            </div>

                            <div className="flex w-full items-center justify-between gap-4 border-t border-dashed border-border/60 pt-2 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                              <span className="font-black text-muted-foreground">
                                ×{planItem.quantity}
                              </span>
                              <span className="font-black text-foreground">
                                {formatCurrency(
                                  (item?.pricePerUnit || 0) * planItem.quantity
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side Auto-pay info, Delivery Profiles selector and delete button */}
            <div className="space-y-6">
              {isPendingSelection ? (
                <>
                  {/* Procurement Summary & Dispatch Card */}
                  <div className="space-y-4 rounded-2xl border bg-card p-5 text-xs shadow-sm">
                    <h3 className="flex items-center gap-1.5 border-b pb-2 text-sm font-bold text-foreground">
                      <Truck className="h-4 w-4 text-primary" /> Procurement
                      Summary
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-semibold text-muted-foreground">
                        <span>Accrued Savings:</span>
                        <span className="text-foreground">
                          {formatCurrency(plan.paidAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-muted-foreground">
                        <span>Selected Items Cost:</span>
                        <span className="text-foreground">
                          {formatCurrency(selectedCost)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>Leftover Wallet Refund:</span>
                        <span className="text-primary">
                          {formatCurrency(
                            Math.max(0, plan.paidAmount - selectedCost)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Validation alerts */}
                    <div className="mt-2 space-y-2">
                      {selectedCost === 0 ? (
                        <div className="flex items-start gap-1.5 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>
                            Select one or more items from the list to enable
                            checkout.
                          </span>
                        </div>
                      ) : selectedCost > plan.paidAmount ? (
                        <div className="flex items-start gap-1.5 rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-600">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                          <span>
                            The selected cost exceeds your saved budget by{" "}
                            {formatCurrency(selectedCost - plan.paidAmount)}.
                          </span>
                        </div>
                      ) : greedyCheckError ? (
                        <div className="flex items-start gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-xs leading-normal text-amber-600">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>{greedyCheckError}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs text-emerald-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>
                            Selection satisfies the completeness rule! The
                            remaining balance will be credited to your
                            NestPurse.
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleProcureSubmit}
                      disabled={
                        isActionLoading ||
                        selectedCost === 0 ||
                        selectedCost > plan.paidAmount ||
                        !!greedyCheckError
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-black text-foreground"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                      ) : (
                        "Confirm & Dispatch Deliveries"
                      )}
                    </Button>
                  </div>

                  {/* Delivery destination card */}
                  <div className="space-y-3.5 rounded-2xl border bg-card p-5 text-xs shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />{" "}
                        Shipping Destination
                      </h3>
                    </div>

                    {profiles.length === 0 ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          No active address profiles linked. Create a shipping
                          address to select delivery.
                        </p>
                        {!plan.isPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-full text-xs"
                            asChild
                          >
                            <Link href="/settings?tab=addresses">
                              + Add Delivery Address
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : plan.isPaid ? (
                      profile ? (
                        <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">
                              {profile.fullName} ({profile.phone})
                            </span>
                            <span className="truncate">
                              {profile.address}, {profile.city}, {profile.state}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No active address profiles linked.
                        </p>
                      )
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99]">
                            <div className="flex flex-col gap-0.5 text-xs leading-relaxed text-muted-foreground">
                              <span className="font-bold text-foreground">
                                {profile
                                  ? `${profile.fullName} (${profile.phone})`
                                  : "Select Destination"}
                              </span>
                              {profile && (
                                <span className="truncate">
                                  {profile.address}, {profile.city},{" "}
                                  {profile.state}
                                </span>
                              )}
                              <span className="mt-1 text-xs font-semibold text-primary">
                                Tap to change destination ›
                              </span>
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-72 rounded-2xl p-3"
                          align="end"
                        >
                          <p className="mb-2.5 text-xs font-black tracking-wider text-muted-foreground uppercase">
                            Select Destination
                          </p>
                          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                            {profiles.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => handleAddressSwap(p.id)}
                                disabled={isActionLoading}
                                className={cn(
                                  "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all",
                                  plan.deliveryProfileId === p.id
                                    ? "border-primary bg-primary/5 font-semibold text-foreground"
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
                                {plan.deliveryProfileId === p.id && (
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-col items-center justify-center gap-1 border-t border-border/40 pt-2.5 text-center">
                            <span className="text-[10px] text-muted-foreground">
                              Your destination not listed?
                            </span>
                            <Link
                              href="/settings?tab=addresses"
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              + Add New Address
                            </Link>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Auto-Pay Planner Card */}
                  <div className="space-y-3.5 rounded-2xl border bg-card p-5 text-xs shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <Calendar className="h-4 w-4 text-primary" /> Auto-Pay
                        Scheduler
                      </h3>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-black tracking-tight uppercase",
                          plan.autoPayEnabled
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {plan.autoPayEnabled ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {plan.autoPayEnabled ? (
                      <div className="space-y-2.5">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Automated savings transfer rules are configured and
                          active. Periodic deductions will credit your groceries
                          goal automatically.
                        </p>
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-xs font-bold text-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black tracking-wider text-muted-foreground uppercase">
                              Cycle Frequency
                            </span>
                            <span className="capitalize">
                              {plan.autoPayFrequency}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] font-black tracking-wider text-muted-foreground uppercase">
                              Transfer Amount
                            </span>
                            <span>
                              {formatCurrency(plan.autoPayAmount || 0)}
                            </span>
                          </div>
                        </div>
                        {plan.autoPayNextDate && (
                          <p className="text-center text-xs font-bold text-primary">
                            Next Auto-Pay transfer:{" "}
                            {formatDate(plan.autoPayNextDate)}
                          </p>
                        )}
                        <Button
                          onClick={handleDisableAutoPay}
                          disabled={isActionLoading}
                          variant="outline"
                          size="sm"
                          className="h-8 w-full rounded-lg border-red-500/35 text-xs font-bold transition-colors hover:bg-red-500/5 hover:text-red-500"
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Disable Auto-Pay"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Auto-Pay scheduler is inactive. Enable rules to
                          automatically deposit set amounts periodically,
                          accelerating your progress goal.
                        </p>
                        <Button
                          onClick={() => setIsAutoPayOpen(true)}
                          variant="outline"
                          size="sm"
                          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Setup Auto-Pay Rules
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Shipping profiles pre-delivery swap utility */}
                  <div className="space-y-3.5 rounded-2xl border bg-card p-5 text-xs shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />{" "}
                        Delivery Destination
                      </h3>
                    </div>

                    {profiles.length === 0 ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          No active address profiles linked. Create a shipping
                          address to calculate shipping fee.
                        </p>
                        {!plan.isPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-full text-xs"
                            asChild
                          >
                            <Link href="/settings?tab=addresses">
                              + Add Delivery Address
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : plan.isPaid ? (
                      profile ? (
                        <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">
                              {profile.fullName} ({profile.phone})
                            </span>
                            <span className="truncate">
                              {profile.address}, {profile.city}, {profile.state}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No active address profiles linked.
                        </p>
                      )
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99]">
                            <div className="flex flex-col gap-0.5 text-xs leading-relaxed text-muted-foreground">
                              <span className="font-bold text-foreground">
                                {profile
                                  ? `${profile.fullName} (${profile.phone})`
                                  : "Select Destination"}
                              </span>
                              {profile && (
                                <span className="truncate">
                                  {profile.address}, {profile.city},{" "}
                                  {profile.state}
                                </span>
                              )}
                              <span className="mt-1 text-xs font-semibold text-primary">
                                Tap to change destination ›
                              </span>
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-72 rounded-2xl p-3"
                          align="end"
                        >
                          <p className="mb-2.5 text-xs font-black tracking-wider text-muted-foreground uppercase">
                            Select Destination
                          </p>
                          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                            {profiles.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => handleAddressSwap(p.id)}
                                disabled={isActionLoading}
                                className={cn(
                                  "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all",
                                  plan.deliveryProfileId === p.id
                                    ? "border-primary bg-primary/5 font-semibold text-foreground"
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
                                {plan.deliveryProfileId === p.id && (
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-col items-center justify-center gap-1 border-t border-border/40 pt-2.5 text-center">
                            <span className="text-[10px] text-muted-foreground">
                              Your destination not listed?
                            </span>
                            <Link
                              href="/settings?tab=addresses"
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              + Add New Address
                            </Link>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {profile && (
                      <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs font-bold">
                        <span className="text-muted-foreground">
                          Zone Shipping Fee:
                        </span>
                        <span className="text-foreground">
                          {formatCurrency(plan.deliveryFee || 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Goal Deletion CTA */}
                  {!plan.isPaid && plan.paidAmount === 0 && (
                    <div className="space-y-4 rounded-2xl border bg-card p-5 text-xs shadow-sm">
                      <h3 className="border-b pb-2 text-sm font-bold text-foreground">
                        Destructive Options
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Delete this savings goal permanently. Since no payments
                        have been made yet, no refunds will be processed.
                      </p>
                      <Button
                        onClick={() => setIsDeleteOpen(true)}
                        variant="destructive"
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-bold"
                      >
                        <Trash className="h-4 w-4" /> Delete Goal
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Deposit Quick-Save Drawer */}
        <ResponsiveDialog
          isOpen={isDepositOpen}
          onClose={setIsDepositOpen}
          title="Savings Goal Deposit"
          description="Accelerate your groceries target by making manual deposits. Min ₦500."
        >
          <div className="space-y-4 text-xs font-medium">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Deposit Amount (₦)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                className="h-10 rounded-xl border-muted text-base font-bold md:text-sm"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>

            {/* Preset Chips */}
            <div className="flex gap-2">
              {[1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountChipClick(amt)}
                  className="flex-1 rounded-lg border py-1.5 font-bold transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  +{formatCurrency(amt)}
                </button>
              ))}
            </div>

            {remainingAmount > 0 && remainingAmount >= 500 && (
              <button
                type="button"
                onClick={() => handleAmountChipClick(remainingAmount)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/10"
              >
                Pay Remaining: {formatCurrency(remainingAmount)}
              </button>
            )}

            {/* PinInput confirmation */}
            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Confirm NestPurse PIN
                </span>
              </div>
              <PinInput
                value={pinValue}
                onChange={setPinValue}
                disabled={isActionLoading}
              />
            </div>

            <Button
              onClick={handleDepositSubmit}
              disabled={
                isActionLoading ||
                pinValue.length !== 4 ||
                parseFloat(depositAmount) < 500
              }
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-black text-foreground"
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              ) : (
                "Authorize Savings Deposit"
              )}
            </Button>
          </div>
        </ResponsiveDialog>

        {/* Configure Auto-Pay Drawer */}
        <ResponsiveDialog
          isOpen={isAutoPayOpen}
          onClose={setIsAutoPayOpen}
          title={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-primary" /> Configure Auto-Pay
            </span>
          }
          description="Set up periodically automated balance transfers from NestPurse."
        >
          <div className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Frequency
                </label>
                <select
                  value={autoPayFreq}
                  onChange={(e) => setAutoPayFreq(e.target.value as any)}
                  className="h-9 w-full rounded-lg border bg-card px-2 text-base font-bold md:text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  placeholder="Min ₦500"
                  className="h-9 rounded-lg border-muted text-base font-bold md:text-xs"
                  value={autoPayAmount}
                  onChange={(e) => setAutoPayAmount(e.target.value)}
                />
              </div>
            </div>

            {/* PinInput confirmation */}
            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Confirm NestPurse PIN
                </span>
              </div>
              <PinInput
                value={pinValue}
                onChange={setPinValue}
                disabled={isActionLoading}
              />
            </div>

            <Button
              onClick={handleAutoPaySubmit}
              disabled={
                isActionLoading ||
                pinValue.length !== 4 ||
                parseFloat(autoPayAmount) < 500
              }
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-black text-foreground"
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              ) : (
                "Activate Auto-Pay Plan"
              )}
            </Button>
          </div>
        </ResponsiveDialog>

        {/* Delete Savings Confirm Dialog */}
        <ResponsiveDialog
          isOpen={isDeleteOpen}
          onClose={setIsDeleteOpen}
          title={
            <span className="flex items-center gap-1.5">
              <Trash className="h-5 w-5 text-destructive" /> Delete Savings Goal
            </span>
          }
          description="Are you sure you want to delete this custom savings goal?"
        >
          <div className="space-y-4 text-xs font-medium">
            <div className="rounded-xl border border-destructive/10 bg-destructive/5 p-3.5 text-xs leading-relaxed text-destructive">
              <div className="mb-1.5 flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>Important Refund Warning:</span>
              </div>
              Deleting this savings goal will instantly release all locked
              funds. An amount of{" "}
              <strong>{formatCurrency(plan.paidAmount)}</strong> will be
              immediately refunded back to your NestPurse balance.
            </div>

            {/* PinInput confirmation */}
            <div className="space-y-2 border-t pt-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Confirm NestPurse PIN
                </span>
              </div>
              <PinInput
                value={pinValue}
                onChange={setPinValue}
                disabled={isActionLoading}
              />
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => setIsDeleteOpen(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isActionLoading}
              >
                Dismiss
              </Button>
              <Button
                onClick={handleDeletePlanSubmit}
                disabled={isActionLoading || pinValue.length !== 4}
                variant="destructive"
                className="flex-1 rounded-xl font-bold"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  "Authorize Delete & Refund"
                )}
              </Button>
            </div>
          </div>
        </ResponsiveDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
